import os
from functools import wraps

from typing import Literal
import datetime
from bbconf.bbagent import BedBaseAgent
from bbconf.models.base_models import UsageModel
from starlette.responses import FileResponse, JSONResponse, RedirectResponse

from . import _LOGGER
from .exceptions import BedHostException


def serve_file(path: str, remote: bool = None):
    """
    Serve a local or remote file

    :param str path: relative path to serve
    :param bool remote: whether to redirect to a remote source or serve local
    :exception FileNotFoundError: if file not found
    """
    remote = remote or True
    if remote:
        _LOGGER.info(f"Redirecting to: {path}")
        return RedirectResponse(path)
    _LOGGER.info(f"Returning local: {path}")
    if os.path.isfile(path):
        return FileResponse(
            path,
            headers={
                "Content-Disposition": f"inline; filename={os.path.basename(path)}"
            },
        )
    else:
        msg = f"File not found on server: {path}"
        _LOGGER.warning(msg)
        raise FileNotFoundError(msg)


def get_openapi_version(app):
    """
    Get the OpenAPI version from the OpenAPI description JSON

    :param fastapi.FastAPI app: app object
    :return str: openAPI version in use
    """
    try:
        return app.openapi()["openapi"]
    except Exception:
        return "3.0.2"


def attach_routers(app):
    _LOGGER.info("Mounting routers...")

    # importing routers here avoids circular imports
    from .routers import base_api, bed_api, bedset_api, objects_api

    app.include_router(base_api.router)
    app.include_router(bed_api.router)
    app.include_router(bedset_api.router)
    app.include_router(objects_api.router)

    return app


def configure(bbconf_file_path: str) -> BedBaseAgent:
    try:
        # bbconf_file_path = os.environ.get("BEDBASE_CONFIG") or None
        _LOGGER.info(f"Loading config: '{bbconf_file_path}'")
        bbc = BedBaseAgent(bbconf_file_path)
    except Exception as e:
        raise BedHostException(f"Bedbase config was not provided or is incorrect: {e}")
    return bbc


def drs_response(status_code, msg):
    """Helper function to make quick DRS responses"""
    content = {"status_code": status_code, "msg": msg}
    return JSONResponse(status_code=status_code, content=content)


from pprint import pprint


def count_requests(
    usage_data: UsageModel,
    event: Literal["bed_search", "bedset_search", "bed_meta", "bedset_meta", "files"],
):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if event == "files":
                file_path = kwargs.get("file_path")
                if "bed" in file_path or "bigbed" in file_path.lower():
                    if file_path in usage_data.files:
                        usage_data.files[file_path] += 1
                    else:
                        usage_data.files[file_path] = 1
            elif event == "bed_search":
                query = kwargs.get("query")
                if query in usage_data.bed_search:
                    usage_data.bed_search[query] += 1
                else:
                    usage_data.bed_search[query] = 1
            elif event == "bedset_search":
                query = kwargs.get("query")
                if query in usage_data.bedset_search:
                    usage_data.bedset_search[query] += 1
                else:
                    usage_data.bed_search[query] = 1
            elif event == "bed_meta":
                bed_id = kwargs.get("bed_id")
                if bed_id in usage_data.bed_meta:
                    usage_data.bed_meta[bed_id] += 1
                else:
                    usage_data.bed_meta[bed_id] = 1

            elif event == "bedset_meta":
                bedset_id = kwargs.get("bedset_id")
                if bedset_id in usage_data.bedset_meta:
                    usage_data.bedset_meta[bedset_id] += 1
                else:
                    usage_data.bedset_meta[bedset_id] = 1
            else:
                raise ValueError(f"Unknown event type: {event}")
            pprint(usage_data.model_dump())
            return await func(*args, **kwargs)

        return wrapper

    return decorator


def init_model_usage():
    return UsageModel(
        bed_meta={},
        bedset_meta={},
        bed_search={},
        bedset_search={},
        files={},
        date_from=datetime.datetime.now(),
    )
