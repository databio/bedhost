from starlette.responses import FileResponse, RedirectResponse, JSONResponse

from bbconf.bbagent import BedBaseAgent
import os

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
    from .routers import bed_api, bedset_api, search_api

    app.include_router(bed_api.router)
    # app.include_router(bedset_api.router)
    # app.include_router(search_api.search_router)
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
