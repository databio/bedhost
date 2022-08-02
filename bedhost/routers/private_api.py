from typing import Optional

from fastapi import APIRouter, Path, Query
from sqlalchemy import text

from ..const import *
from ..data_models import *
from ..helpers import *
from ..main import _LOGGER, app, bbc

router = APIRouter()


class Terms(BaseModel):
    genome: str
    terms: list


class MyQuery(BaseModel):
    query: str


# private API
@router.post(
    "/distance/bedfiles/terms",
    response_model=DBResponse,
    include_in_schema=False,
)
async def get_bedfiles_in_distance(
    terms: Terms,
    ids: Optional[List[str]] = Query(None, description="Bedfiles table column name"),
    limit: int = Query(None, description="number of rows returned by the query"),
):

    if ids:
        assert_table_columns_match(bbc=bbc, table_name=BED_TABLE, columns=ids)

    res = bbc.select_bedfiles_for_distance(
        terms=terms.terms,
        genome=terms.genome,
        bedfile_cols=ids,
        limit=limit if limit else None,
    )

    values = []
    for x in res:
        values.append(list(x.values()))

    if values:
        if ids:
            colnames = ids
            colnames.extend(["score"])
        else:
            colnames = list(
                serve_schema_for_table(bbc=bbc, table_name=BED_TABLE).keys()
            )
            colnames.extend(["score"])

        _LOGGER.info(f"Serving data for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]

    return {"columns": colnames, "data": values}


@router.post("/query/{table_name}", include_in_schema=False)
async def get_query_results(
    query: MyQuery,
    table_name: TableName = Path(..., description="DB Table name"),
    ids: Optional[List[str]] = Query(
        None, description="Column names to include in the query result"
    ),
    limit: int = Query(None, description="number of rows returned by the query"),
):
    """
    Return query results with provided table name and query
    """
    if ids:
        assert_table_columns_match(bbc=bbc, table_name=table_name, columns=ids)

    columns = ", ".join([c for c in ids])

    statement_str = "SELECT {} FROM {} WHERE {}"
    print(text(statement_str.format(columns, table_name.value, query.query)))
    try:
        if table_name.value == BED_TABLE:

            with bbc.bed.session as s:
                res = s.execute(
                    text(statement_str.format(columns, table_name.value, query.query)),
                )
        else:
            with bbc.bedset.session as s:
                res = s.execute(
                    text(statement_str.format(columns, table_name.value, query.query)),
                )

        res = res.mappings().all()

    except Exception as e:
        msg = f"Caught exception while querying the DB: {str(e)}"
        _LOGGER.error(msg)
        raise HTTPException(status_code=404, detail=msg)

    values = []
    for x in res:
        values.append(list(x.values()))

    if values:
        if ids:
            colnames = ids
        else:
            colnames = list(
                serve_schema_for_table(bbc=bbc, table_name=table_name.value).keys()
            )

        _LOGGER.info(f"Serving data for columns: {colnames}")
    else:
        _LOGGER.warning("No records matched the query")
        colnames = []
        values = [[]]

    return {"columns": colnames, "data": values}


@router.get("/filters/{table_name}", include_in_schema=False)
async def get_search_setup_for_table(
    table_name: TableName = Path(..., description="DB Table name")
):
    """
    Returns the filters mapping to based on the selected table schema to
    construct the queryBuilder to interface the DB
    """
    if table_name.value == BED_TABLE:
        return get_search_setup(bbc.bed.schema)
    return get_search_setup(bbc.bedset.schema)
