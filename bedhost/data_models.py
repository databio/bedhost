from typing import Dict, List, Optional, Text, Union, Tuple
import enum
from pydantic import BaseModel
from fastapi import Path

from .helpers import get_enum_map, get_id_map
from .main import bbc
from .const import *

class DBResponse(BaseModel):
    """
    Database response data model
    """

    columns: List
    data: Union[List[List], List[Dict], Tuple, Dict]


class SchemaElement(BaseModel):
    """
    Schema element data model
    """

    type: Text
    label: Optional[Text]
    description: Text

RemoteClassEnum = Enum(
    "RemoteClassEnum",
    {r: r for r in bbc.config[CFG_REMOTE_KEY]} if bbc.is_remote else {"http": "http"},
)

BedsetDigest = Path(
    ...,
    description="BED set digest",
    regex=r"^\w+$",
    max_length=32,
    min_length=32,
    # example=ex_bedset_digest,
)

FileColumnBedset = enum.Enum(
    value="FileColumnBedset",  # name of the enumeration
    names=get_enum_map(bbc, BEDSET_TABLE, "file"),  # dictionary of names and values
)

ImgColumnBedset = enum.Enum("ImgColumnBedset", get_enum_map(bbc, BEDSET_TABLE, "image"))

file_map_bedset = get_id_map(bbc, BEDSET_TABLE, "file")

img_map_bedset = get_id_map(bbc, BEDSET_TABLE, "image")

class BEDLIST(BaseModel):
    md5sums: list

