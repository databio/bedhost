from enum import Enum
from typing import Dict

from fastapi import Path
from pydantic import BaseModel

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

CROM_NUMBERS = Path(
    ...,
    description="Chromosome number",
    regex=r"^\S+$",
    example=ex_chr,
)


class Type(BaseModel):
    group: str
    artifact: str
    version: str


class Organization(BaseModel):
    name: str
    url: str


class ComponentVersions(BaseModel):
    bedhost_version: str
    bbconf_version: str
    python_version: str
    geniml_version: str
    openapi_version: str


class EmbeddingModels(BaseModel):
    region2vec: str
    text2vec: str


class ServiceInfoResponse(BaseModel):
    id: str
    name: str
    type: Type
    description: str
    organization: Organization
    contactUrl: str
    documentationUrl: str
    updatedAt: str
    environment: str
    version: str
    component_versions: ComponentVersions
    embedding_models: EmbeddingModels


class BaseListResponse(BaseModel):
    count: int
    limit: int
    offset: int
    results: list


class CreateBEDsetRequest(BaseModel):
    registry_path: str


class ChromLengthUploadModel(BaseModel):
    bed_file: Dict[str, int]
