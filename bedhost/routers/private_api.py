from fastapi import APIRouter, Path, Query
from typing import Optional
from ..main import bbc, _LOGGER, app
from ..const import *
from ..data_models import *
from ..helpers import *


router = APIRouter()

# private API


@router.get("/query/{table_name}/{query}/{query_val}")
async def get_query_results(
        table_name: TableName = Path(
            ...,
            description="DB Table name"),
        query: str = Path(
            None,
            description="DB query to perform with placeholders for values"),
        query_val: str = Path(
            None,
            description="Values to populate DB query with"),
        columns: Optional[List[str]] = Query(
            None,
            description="Column names to include in the query result")
):
    """
    Return query results with provided table name and query string
    """
    if columns:
        assert_table_columns_match(
            bbc=bbc, table_name=table_name, columns=columns)
    return bbc.select(table_name=table_name, condition=query, condition_val=query_val, columns=columns)


@router.get("/filters/{table_name}")
async def get_search_setup_for_table(
        table_name: TableName = Path(
            ...,
            description="DB Table name"
        )
):
    """
    Returns the filters mapping to based on the selected table schema to
    construct the queryBuilder to interface the DB
    """
    if table_name.value == BED_TABLE:
        return get_search_setup(bbc.get_bedfiles_table_columns_types())
    return get_search_setup(bbc.get_bedsets_table_columns_types())
