from pydantic import BaseModel
from typing import List, Dict, Text


class DBResponse(BaseModel):
    """
    Database response data model
    """
    columns: List
    data: List[List]


class Schema(BaseModel):
    """
    Schema data mode
    """
    type: Text
    description: Text