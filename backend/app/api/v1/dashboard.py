from fastapi import APIRouter
from app.services import dashboard_service
from app.schemas.dashboard import KPIsResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=KPIsResponse)
def get_kpis(periodo: str = "12m"):
    """
    Retorna KPIs mensais agregados (gold_vendas_kpis).

    - **periodo**: janela de tempo — `3m`, `6m` ou `12m` (padrão: `12m`)
    """
    return dashboard_service.get_kpis(periodo)
