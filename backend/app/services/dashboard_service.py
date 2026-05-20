from fastapi import HTTPException
from app.repositories import dashboard_repository
from app.schemas.dashboard import KPIsResponse, VendasKPIMes

_PERIODOS_VALIDOS = {"3m", "6m", "12m", "all"}


def get_kpis(periodo: str = "12m") -> KPIsResponse:
    if periodo not in _PERIODOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Período inválido '{periodo}'. Use: {', '.join(sorted(_PERIODOS_VALIDOS))}",
        )
    meses = [VendasKPIMes(**row) for row in dashboard_repository.get_kpis(periodo)]
    return KPIsResponse(periodo=periodo, meses=meses)
