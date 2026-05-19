from pydantic import BaseModel, Field, field_validator
from datetime import date, datetime
from typing import Literal, Optional


class ReviewOut(BaseModel):
    id_avaliacao: str
    id_cliente: str
    id_pedido: str
    id_produto: str
    nota_produto: Optional[int] = None
    nota_nps: Optional[int] = None
    recomenda: bool
    comentario: Optional[str] = None
    sentimento: Optional[str] = None
    data_avaliacao: date
    nome_produto: str
    categoria_produto: Optional[str] = None
    nome_cliente: str

    model_config = {"from_attributes": True}

    @field_validator("data_avaliacao", mode="before")
    @classmethod
    def parse_date(cls, v):
        if v is None or isinstance(v, date):
            return v
        s = str(v)
        try:
            return datetime.strptime(s, "%d/%m/%Y").date()
        except ValueError:
            pass
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
        except ValueError:
            pass
        return date.fromisoformat(s)


class ReviewListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[ReviewOut]


class ReviewCreate(BaseModel):
    id_cliente: str
    id_pedido: str
    id_produto: str
    nota_produto: int = Field(..., ge=1, le=5)
    nota_nps: int = Field(..., ge=0, le=10)
    recomenda: bool
    comentario: Optional[str] = None
    sentimento: Optional[Literal["positivo", "neutro", "negativo"]] = None
    data_avaliacao: Optional[date] = None
    nome_produto: str
    categoria_produto: str
    nome_cliente: str


class ReviewUpdate(BaseModel):
    nota_produto: Optional[int] = Field(None, ge=1, le=5)
    nota_nps: Optional[int] = Field(None, ge=0, le=10)
    recomenda: Optional[bool] = None
    comentario: Optional[str] = None
    sentimento: Optional[Literal["positivo", "neutro", "negativo"]] = None
