import os

from bbconf import BedBaseConf
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse, RedirectResponse
from typing import List, Union
from urllib import parse

from . import _LOGGER
from .const import (
    CFG_PATH_KEY,
    CFG_PATH_PIPELINE_OUTPUT_KEY,
    CFG_REMOTE_KEY,
    TYPES_MAPPING,
    VALIDATIONS_MAPPING,
    OPERATORS_MAPPING,
)
from .exceptions import BedHostException

class BedHostConf(BedBaseConf):
    """
    An extended BedBaseConf object that adds some BedHost-specific functions
    """

    def __init__(self, config_path: str = None):
        super().__init__(config_path)

    def serve_file(self, path: str, remote: bool = None):
        """
        Serve a local or remote file

        :param str path: relative path to serve
        :param bool remote: whether to redirect to a remote source or serve local
        :exception FileNotFoundError: if file not found
        """
        remote = remote or self.is_remote
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

    def bed_retrieve(self, digest: str, column: str) -> dict:
        """
        Retrieve a single column from the bed table

        :param digest: bed file digest
        :param column: column name to retrieve
        :return: result
        """
        try:
            return self.bed.retrieve(digest, column)
        except KeyError:  # Probably should be something else
            return {}

    def bedset_retrieve(self, digest: str, column: str) -> dict:
        """
        Retrieve a single column from the bedset table

        :param digest: bedset digest
        :param column: column name to retrieve
        :return: result
        """
        try:
            return self.bedset.retrieve(digest, column)
        except KeyError:
            return {}


def get_search_setup(schema: dict):
    """
    Create a query setup for QueryBuilder to interface the DB.

    :param dict schema: pipestat schema
    :return list[dict]: a list dictionaries with search setup to use
        in QueryBuilder
    """
    setup_dicts = []
    for col_name, col_schema in schema.items():
        try:
            setup_dict = {
                "id": col_name,
                "label": col_schema["description"],
                "type": TYPES_MAPPING[col_schema["type"]],
                "validation": VALIDATIONS_MAPPING[col_schema["type"]],
                "operators": OPERATORS_MAPPING[col_schema["type"]],
            }
        except (AttributeError, KeyError):
            _LOGGER.warning(
                f"Database column '{col_name}' of type "
                f"'{col_schema['type']}' has no query builder "
                f"settings predefined, skipping."
            )
        else:
            setup_dicts.append(setup_dict)
    return setup_dicts


def construct_search_data(hits: list, request) -> List[List[str]]:
    """
    Construct a list of links to display as the search result

    :param Iterable[str] hits: ids to compose the list for
    :param starlette.requests.Request request: request for the context
    :return Iterable[list]: results to display
    """
    template_data = []
    for h in hits:
        bed_data_url_template = (
            request.url_for("bedfile") + f"?md5sum={h['md5sum']}&format="
        )
        template_data.append(
            [h["name"]]
            + [bed_data_url_template + ext for ext in ["html", "bed", "json"]]
        )
    return template_data


def get_mounted_symlink_path(symlink: str) -> str:
    """
    Get path to the symlinks target on a mounted filesystem volume.
    Accounts for both transformed and non-transformed symlink targets

    :param str symlink: absolute symlink path
    :return str: path to the symlink target on the mounted volume
    """

    def _find_mount_point(path):
        path = os.path.abspath(path)
        while not os.path.ismount(path):
            path = os.path.dirname(path)
        return path

    link_tgt = os.readlink(symlink)
    if not os.path.isabs(link_tgt):
        _LOGGER.debug("Volume mounted with symlinks transformation")
        return os.path.abspath(os.path.join(os.path.dirname(symlink), link_tgt))
    mnt_point = _find_mount_point(symlink)
    first = os.path.relpath(symlink, mnt_point).split("/")[0]
    common_idx = link_tgt.split("/").index(first)
    rel_tgt = os.path.join(*link_tgt.split("/")[common_idx:])
    return os.path.join(mnt_point, rel_tgt)


def get_all_bedset_urls_mapping(bbc: BedBaseConf, request):
    """
    Get a mapping of all bedset ids and corrsponding splaspages urls

    :param bbconf.BedBaseConf bbc: bedbase configuration object
    :param starlette.requests.Request request: request context for url generation
    :return Mapping: a mapping of bedset ids and the urls to the corresponding splashpages
    """
    hits = bbc.bedset.backend.select(columns=["name", "md5sum"])
    if not hits:
        return
    # TODO: don't hardcode url path element name, use operationID?
    return {
        hit.name: get_param_url(request.url_for("bedsetsplash"), {"md5sum": hit.md5sum})
        for hit in hits
    }


def get_param_url(url, params):
    """
    Create parametrized URL

    :param str url: URL base to parametrize
    :param Mapping params: a mapping of URL parameters and values
    :return str: parametrized URL
    """
    if not params:
        return url
    return url + "?" + parse.urlencode(params)


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
    app.include_router(bedset_api.router)
    app.include_router(search_api.search_router)
    return app


def configure(bbconf_file_path):
    try:
        # bbconf_file_path = os.environ.get("BEDBASE_CONFIG") or None
        _LOGGER.info(f"Loading config: '{bbconf_file_path}'")
        bbc = BedHostConf(bbconf_file_path)
    except Exception as e:
        raise BedHostException(f"Bedbase config was not provided or is incorrect: {e}")
    
    if not CFG_REMOTE_KEY in bbc.config:
        _LOGGER.debug(
            f"Using local files for serving: "
            f"{bbc.config[CFG_PATH_KEY][CFG_PATH_PIPELINE_OUTPUT_KEY]}"
        )
        app.mount(
            bbc.get_bedstat_output_path(),
            StaticFiles(directory=bbc.get_bedstat_output_path()),
            name="bedfile",
        )
        app.mount(
            bbc.get_bedbuncher_output_path(),
            StaticFiles(directory=bbc.get_bedbuncher_output_path()),
            name="bedset",
        )
    else:
        _LOGGER.debug(
            f"Using remote files for serving. Prefix: {bbc.config[CFG_REMOTE_KEY]['http']['prefix']}"
        )
    return bbc


# def get_id_map(bbc, table_name, file_type):
#     """
#     Get a dict for avalible file/figure ids
#
#     :param str table_name: table name to query
#     :param st file_type: "file" or "image"
#     :return dict
#     """
#
#     id_map = {}
#
#     schema = serve_schema_for_table(bbc=bbc, table_name=table_name)
#     # This is basically just doing this:
#     # if table_name == BED_TABLE:
#     #     schema = bbc.bed.schema
#     # if table_name == BEDSET_TABLE:
#     #     schema = bbc.bedset.schema
#     # TODO: Eliminate the need for bedhost to be aware of table names; this should be abstracted away by bbconf/pipestat
#     for key, value in schema.sample_level_data.items():
#         if value["type"] == file_type:
#             id_map[value["label"]] = key
#
#     return id_map


# def get_enum_map(bbc, table_name, file_type):
#     """
#     Get a dict of file/figure labels

#     :param str table_name: table name to query
#     :param st file_type: "file" or "image"
#     :return dict
#     """

#     enum_map = {}
#     _LOGGER.debug(f"Getting enum map for {file_type} in {table_name}")

#     # TO FIX: I think we need a different way to get the schema
#     schema = serve_schema_for_table(bbc=bbc, table_name=table_name)

#     for key, value in schema.sample_level_data.items():
#         if value["type"] == file_type:
#             enum_map[value["label"]] = value["label"]

#     return enum_map
