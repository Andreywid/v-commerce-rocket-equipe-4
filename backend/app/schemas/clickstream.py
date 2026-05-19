from pydantic import BaseModel
from datetime import date
from typing import Literal, Optional


class ClickstreamOut(BaseModel):
    id: int
    id_cliente: str
    data: date
    qtd_eventos: int = 0
    qtd_sessoes: int = 0
    qtd_page_view: int = 0
    qtd_click: int = 0
    qtd_add_to_cart: int = 0
    qtd_abandon_cart: int = 0
    qtd_purchase: int = 0
    qtd_search: int = 0
    canal_principal: Optional[str] = None
    dispositivo_principal: Optional[str] = None
    tempo_total_segundos: int = 0
    data_referencia_calculo: Optional[date] = None

    model_config = {"from_attributes": True}


class ClickstreamListResponse(BaseModel):
    total: int
    page: int
    size: int
    items: list[ClickstreamOut]


class ClickstreamCreate(BaseModel):
    id_cliente: str
    data: date
    qtd_eventos: int = 0
    qtd_sessoes: int = 0
    qtd_page_view: int = 0
    qtd_click: int = 0
    qtd_add_to_cart: int = 0
    qtd_abandon_cart: int = 0
    qtd_purchase: int = 0
    qtd_search: int = 0
    canal_principal: Optional[Literal["Web", "Mobile", "App"]] = None
    dispositivo_principal: Optional[Literal["Desktop", "Mobile", "Tablet"]] = None
    tempo_total_segundos: int = 0


class ClickstreamUpdate(BaseModel):
    qtd_eventos: Optional[int] = None
    qtd_sessoes: Optional[int] = None
    qtd_page_view: Optional[int] = None
    qtd_click: Optional[int] = None
    qtd_add_to_cart: Optional[int] = None
    qtd_abandon_cart: Optional[int] = None
    qtd_purchase: Optional[int] = None
    qtd_search: Optional[int] = None
    canal_principal: Optional[Literal["Web", "Mobile", "App"]] = None
    dispositivo_principal: Optional[Literal["Desktop", "Mobile", "Tablet"]] = None
    tempo_total_segundos: Optional[int] = None
