from fastapi import APIRouter, Depends
from app.services import dashboard_service
from app.schemas.dashboard import KPIsResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=KPIsResponse)
def get_kpis(periodo: str = "12m", current_user=Depends(get_current_user)):
    """
    Retorna KPIs mensais agregados (gold_vendas_kpis).

    - **periodo**: janela de tempo — `3m`, `6m` ou `12m` (padrão: `12m`)
    """
    return dashboard_service.get_kpis(periodo)
