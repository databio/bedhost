import os
from functools import wraps

from typing import Literal
from bbconf.bbagent import BedBaseAgent
from bbconf.models.base_models import UsageModel
from starlette.responses import FileResponse, JSONResponse, RedirectResponse
from fastapi import Request

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
    bbagent: BedBaseAgent,
    event: Literal[
        "bed_search", "bedset_search", "bed_metadata", "bedset_metadata", "files"
    ],
):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            func_name = func.__name__

            bed_id = kwargs.get("bed_id")
            bedset_id = kwargs.get("bedset_id")
            query = kwargs.get("query")
            file_name = kwargs.get("file_path")

            request: Request = kwargs.get("request")
            if request:
                ip_address = request.client.host
                agent_name = request.headers.get("User-Agent", "unknown")
            else:
                ip_address = "unknown"
                agent_name = "unknown"

            usage = UsageModel(
                event=event,
                bed_id=bed_id,
                query=query,
                bedset_id=bedset_id,
                ipaddress=ip_address,
                user_agent=agent_name,
                file_name=file_name,
            )

            bbagent.add_usage(usage)

            print(usage)

            # stats_dict[func_name] = stats_dict.get(func_name, {})
            # stats_dict[func_name][bed_id] = stats_dict[func_name].get(bed_id, 0) + 1
            # pprint(stats_dict)

            return await func(*args, **kwargs)

        return wrapper

    return decorator
