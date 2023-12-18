from typing import Dict, List
from fastapi import Path
from pydantic import BaseModel
from enum import Enum


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
