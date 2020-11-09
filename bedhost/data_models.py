from pydantic import BaseModel
from typing import List, Dict


class DBResponse(BaseModel):
    """
    Database response data model
    """
    columns: List
    data: List[List]