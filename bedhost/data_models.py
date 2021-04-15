from typing import Dict, List, Text, Optional

from pydantic import BaseModel


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
    label: Optional[Text]
    description: Text
