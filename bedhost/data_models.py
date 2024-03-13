from typing import Dict, List, Union, Any
from fastapi import Path
from pydantic import BaseModel
from enum import Enum
from .model_parser import yaml_to_pydantic
from .main import bbc

RemoteClassEnum = Enum(
    "RemoteClassEnum",
    {"http": "http"},
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


class BedsetResponse(BaseModel):
    bedset_record_id: str
    number_of_bedfiles: int
    bedfile_metadata: List[Dict]


BedFile = yaml_to_pydantic("BedFile", bbc.bed._schema_path)


class BedMetadataResponse(BaseModel):
    record_identifier: str
    metadata: BedFile
    raw: Union[Dict[str, Any], None] = None


class RecordsIdReturn(BaseModel):
    record_identifier: str = None
    name: Union[str, None] = (None,)


class ListBedFilesResponse(BaseModel):
    total_size: int
    page_size: int
    next_page_token: int
    records: List[RecordsIdReturn]


class BedSetMetadataResponse(BaseModel):
    record_identifier: str
    metadata: yaml_to_pydantic("BedSet", bbc.bedset._schema_path)
    raw: Union[Dict[str, Any], None] = None
