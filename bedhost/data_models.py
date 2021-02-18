from pydantic import BaseModel
from typing import List, Dict, Text


class DBResponse(BaseModel):
    """
    Database response data model
    """
    columns: List
    data: List[List]


class SchemaElement(BaseModel):
    """
    Schema element data model
    """
    type: Text
    description: Text
