from typing import Dict, List, Optional, Text, Tuple, Union
from fastapi import Path
from pydantic import BaseModel
from enum import Enum

from .const import CFG_REMOTE_KEY

# from bedhost.main import bbc
# from bedhost.dependencies import get_bbconf

# bbc = get_bbconf()

# from .main import bbc

class DBResponse(BaseModel):
    """
    Database response data model
    """

    columns: List
    data: Union[List[List], List[Dict], Tuple, Dict]


# RemoteClassEnum = Enum(
#     "RemoteClassEnum",
#     {r: r for r in bbc.config[CFG_REMOTE_KEY]} if bbc.is_remote else {"http": "http"},
# )

RemoteClassEnum = Enum(
    "RemoteClassEnum",
    {"http": "http"},
)

BedsetDigest = Path(
    ...,
    description="BED set digest",
    regex=r"^\w+$",
    max_length=32,
    min_length=32,
    # example=ex_bedset_digest,
)


class BedList(BaseModel):
    md5sums: list


ex_chr = "chr1"

# API query path definitions
BedDigest = Path(
    ...,
    description="BED digest",
    regex=r"^\w+$",
    max_length=32,
    min_length=32,
    # example=ex_bed_digest,
)

chromosome_number = Path(
    ...,
    description="Chromosome number",
    regex=r"^\S+$",
    example=ex_chr,
)


# class SchemaElement(BaseModel):
#     """
#     Schema element data model
#     """

#     type: Text
#     label: Optional[Text]
#     description: Text

# FileColumnBedset = enum.Enum(
#     value="FileColumnBedset",  # name of the enumeration
#     names=get_enum_map(bbc, BEDSET_TABLE, "file"),  # dictionary of names and values
# )

# ImgColumnBedset = enum.Enum("ImgColumnBedset", get_enum_map(bbc, BEDSET_TABLE, "image"))

# file_map_bedset = get_id_map(bbc, BEDSET_TABLE, "file")

# img_map_bedset = get_id_map(bbc, BEDSET_TABLE, "image")


# This is using Python's Functional API to create enumerations without the typical
# class syntax. This is useful for creating enumerations dynamically, which is
# what we're doing here. We're creating a new enumeration for each table in the
# database, and then creating a new enumeration for each column in each table.
# This is done by calling the `get_enum_map` function, which returns a dictionary
# of column names and values. The `enum.Enum` function then creates a new
# enumeration class with the given name and values.

# FileColumnBed = enum.Enum("FileColumnBed", get_enum_map(bbc, BED_TABLE, "file"))

# ImgColumnBed = enum.Enum("ImgColumnBed", get_enum_map(bbc, BED_TABLE, "image"))

# file_map_bed = get_id_map(bbc, BED_TABLE, "file")

# img_map_bed = get_id_map(bbc, BED_TABLE, "image")

# ex_bed_digest = serve_columns_for_table(
#     bbc=bbc, table_name=BED_TABLE, columns=["md5sum"], limit=1
# ).get("data")[0][0]

# ex_bedset_digest = serve_columns_for_table(
#     bbc=bbc, table_name=BEDSET_TABLE, columns=["md5sum"], limit=1
# ).get("data")[0][0]
