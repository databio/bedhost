from pydantic import create_model, Field
import logging
from typing import Union, Tuple, Dict, Any, List
from pathlib import Path
import os
from ubiquerg import expandpath
from oyaml import safe_load


_LOGGER = logging.getLogger("bedhost")

CLASSES_BY_TYPE = {
    "object": dict,
    "number": float,
    "integer": int,
    "string": str,
    "path": Path,
    "boolean": bool,
    "file": str,
    "image": str,
    "link": str,
    "array": List[Dict],
}


def _get_data_type(type_name):
    t = CLASSES_BY_TYPE[type_name]
    return t


def read_yaml_data(path: Union[str, Path], what: str) -> Tuple[str, Dict[str, Any]]:
    """
    Safely read YAML file and log message

    :param str path: YAML file to read
    :param str what: context
    :return (str, dict): absolute path to the read file and the read data
    """
    if isinstance(path, Path):
        test = lambda p: p.is_file()
    elif isinstance(path, str):
        path = expandpath(path)
        test = os.path.isfile
    else:
        raise TypeError(
            f"Alleged path to YAML file to read is neither path nor string: {path}"
        )
    assert test(path), FileNotFoundError(f"File not found: {path}")
    _LOGGER.debug(f"Reading {what} from '{path}'")
    with open(path, "r") as f:
        return path, safe_load(f)


def get_fields_list(schema: dict) -> Dict[str, Field]:
    """
    Get the field dictionary from the schema

    :param schema: schema dictionary

    :return: field dictionary
    """
    defs = {}
    samples = schema["properties"].get("samples")
    for name, value in samples["properties"].items():

        # data_type = value.get("type")
        # if not data_type:
        #     continue
        defs[name] = (
            Union[_get_data_type(value["type"]), None],
            Field(
                default=value.get("default"),
                nullable=True,
                description=value.get("description"),
            ),
        )
    return defs


def yaml_to_pydantic(name: str, data: Union[str, dict]):
    """
    Convert yaml to pydantic model

    :param data: path to yaml file
    :param name: name of the model

    :return: pydantic model
    """
    if not isinstance(data, dict):
        _, data = read_yaml_data(data, "schema")
    from pipestat.parsed_schema import replace_JSON_refs

    data = replace_JSON_refs(data, data)
    fields_list = get_fields_list(data)

    return create_model(name, **fields_list)
