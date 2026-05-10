from pydantic import BaseModel

class TableMetadata(BaseModel):
    name: str
    description: str
    columns: list[str]