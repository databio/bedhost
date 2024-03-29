try:
    from typing import Annotated, Dict, Optional, List, Any
except ImportError:
    from typing_extensions import Annotated
    from typing import Dict, Optional, List, Any

from fastapi import APIRouter, HTTPException, Request

from ..main import bbagent
from ..helpers import (
    serve_file,
)
from urllib.parse import urlparse

router = APIRouter(prefix="/v1/objects", tags=["objects"])


@router.get(
    "/{object_id}",
    summary="Get DRS object metadata",
)
async def get_drs_object_metadata(object_id: str, req: Request):
    """
    Returns metadata about a DrsObject.
    """
    ids = parse_bedbase_drs_object_id(object_id)
    base_uri = urlparse(str(req.url)).netloc
    return bbagent.objects.get_drs_metadata(
        ids["record_type"], ids["record_id"], ids["result_id"], base_uri
    )


@router.get(
    "/{object_id}/access/{access_id}",
    summary="Get URL where you can retrieve files",
)
async def get_object_bytes_url(object_id: str, access_id: str):
    """
    Returns a URL that can be used to fetch the bytes of a DrsObject.
    """
    ids = parse_bedbase_drs_object_id(object_id)
    return bbagent.objects.get_object_uri(
        ids["record_type"], ids["record_id"], ids["result_id"], access_id
    )


@router.head(
    "/{object_id}/access/{access_id}/bytes", include_in_schema=False
)  # Required by UCSC track hubs
@router.get(
    "/{object_id}/access/{access_id}/bytes",
    summary="Download actual files",
)
async def get_object_bytes(object_id: str, access_id: str):
    """
    Returns the bytes of a DrsObject.
    """
    ids = parse_bedbase_drs_object_id(object_id)
    return serve_file(
        bbagent.objects.get_object_uri(
            ids["record_type"], ids["record_id"], ids["result_id"], access_id
        )
    )


@router.get(
    "/{object_id}/access/{access_id}/thumbnail",
    summary="Download thumbnail",
)
async def get_object_thumbnail(object_id: str, access_id: str):
    """
    Returns the bytes of a thumbnail of a DrsObject
    """
    ids = parse_bedbase_drs_object_id(object_id)
    return serve_file(
        bbagent.objects.get_thumbnail_uri(
            ids["record_type"], ids["record_id"], ids["result_id"], access_id
        )
    )


# DRS-compatible API.
# Requires using `object_id` which has the form: `<record_type>.<record_id>.<object_class>`
# for example: `bed.326d5d77c7decf067bd4c7b42340c9a8.bedfile`
# or: `bed.421d2128e183424fcc6a74269bae7934.bedfile`
# bed.326d5d77c7decf067bd4c7b42340c9a8.bedfile
# bed.326d5d77c7decf067bd4c7b42340c9a8.bigbed
def parse_bedbase_drs_object_id(object_id: str):
    """
    Parse bedbase object id into its components
    """
    try:
        record_type, record_id, result_id = object_id.split(".")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Object ID {object_id} is malformed. Should be of the form <record_type>.<record_id>.<result_id>",
        )
    if record_type not in ["bed", "bedset"]:
        raise HTTPException(
            status_code=400, detail=f"Object type {record_type} is incorrect"
        )
    return {
        "record_type": record_type,
        "record_id": record_id,
        "result_id": result_id,
    }
