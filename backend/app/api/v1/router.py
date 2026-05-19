from fastapi import APIRouter
from app.api.v1 import auth, dashboard, customers, orders, products, support, agent

router = APIRouter()

router.include_router(auth.router)
router.include_router(dashboard.router)
router.include_router(customers.router)
router.include_router(orders.router)
router.include_router(products.router)
router.include_router(support.router)
router.include_router(agent.router)
