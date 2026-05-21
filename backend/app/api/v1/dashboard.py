from fastapi import APIRouter, Depends
from app.services import dashboard_service
from app.schemas.dashboard import KPIsResponse, TopRegioesResponse, TopCategoriasResponse
from app.core.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis", response_model=KPIsResponse)
def get_kpis(periodo: str = "12m", current_user=Depends(get_current_user)):
    """
    Retorna KPIs mensais agregados (gold_vendas_kpis).

    - **periodo**: janela de tempo — `3m`, `6m` ou `12m` (padrão: `12m`)
    """
    return dashboard_service.get_kpis(periodo)


@router.get("/top-regioes", response_model=TopRegioesResponse)
def get_top_regioes(current_user=Depends(get_current_user)):
    """Retorna as top 5 regiões (estados) por receita total."""
    return dashboard_service.get_top_regioes()


@router.get("/top-categorias", response_model=TopCategoriasResponse)
def get_top_categorias(current_user=Depends(get_current_user)):
    """Retorna as top 5 categorias por quantidade vendida."""
    return dashboard_service.get_top_categorias()
