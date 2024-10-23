import io
import zipfile
from datetime import date
from typing import Any, Dict

import pandas as pd
import yaml
from fastapi import Response
from peppy.const import (
    CFG_SAMPLE_TABLE_KEY,
    CFG_SUBSAMPLE_TABLE_KEY,
    CONFIG_KEY,
    NAME_KEY,
    SAMPLE_RAW_DICT_KEY,
    SUBSAMPLE_RAW_LIST_KEY,
)


def zip_conv_result(conv_result: dict, filename: str = "project.zip") -> Response:
    """
    Given a dictionary of converted results, zip them up and return a response

    ## Copied from pephub/helpers.py

    :param conv_result: dictionary of converted results
    :param filename: name of the zip
    return Response: response object
    """
    mf = io.BytesIO()

    with zipfile.ZipFile(mf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for name, res in conv_result.items():
            # Add file, at correct path
            zf.writestr(name, str.encode(res))

    # Grab ZIP file from in-memory, make response with correct MIME-type
    resp = Response(
        mf.getvalue(),
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": f"attachment;filename={filename}"},
    )

    return resp


def zip_pep(project: Dict[str, Any]) -> Response:
    """
    Zip a project up to download
    ## Copied from pephub/helpers.py

    :param project: peppy project to zip
    """

    content_to_zip = {}
    config = project[CONFIG_KEY]
    project_name = config[NAME_KEY]

    if project[SAMPLE_RAW_DICT_KEY] is not None:
        config[CFG_SAMPLE_TABLE_KEY] = ["sample_table.csv"]
        content_to_zip["sample_table.csv"] = pd.DataFrame(
            project[SAMPLE_RAW_DICT_KEY]
        ).to_csv(index=False)

    if project[SUBSAMPLE_RAW_LIST_KEY] is not None:
        if not isinstance(project[SUBSAMPLE_RAW_LIST_KEY], list):
            config[CFG_SUBSAMPLE_TABLE_KEY] = ["subsample_table1.csv"]
            content_to_zip["subsample_table1.csv"] = pd.DataFrame(
                project[SUBSAMPLE_RAW_LIST_KEY]
            ).to_csv(index=False)
        else:
            config[CFG_SUBSAMPLE_TABLE_KEY] = []
            for number, file in enumerate(project[SUBSAMPLE_RAW_LIST_KEY]):
                file_name = f"subsample_table{number + 1}.csv"
                config[CFG_SUBSAMPLE_TABLE_KEY].append(file_name)
                content_to_zip[file_name] = pd.DataFrame(file).to_csv(index=False)

    content_to_zip[f"{project_name}_config.yaml"] = yaml.dump(config, indent=4)

    zip_filename = project_name or f"downloaded_pep_{date.today()}"
    return zip_conv_result(content_to_zip, filename=zip_filename)
