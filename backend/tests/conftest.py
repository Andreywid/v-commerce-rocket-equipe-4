import os

# Must be set before any app import so that repositories get the test SessionLocal binding
os.environ["DATABASE_URL"] = "sqlite:///./test_vcommerce.db"
os.environ["SECRET_KEY"] = "test-secret-key-only-for-tests"
os.environ["ADMIN_EMAIL"] = "testadmin@example.com"
os.environ["ADMIN_PASSWORD"] = "TestAdmin@123"
os.environ["ADMIN_NAME"] = "Test Admin"
os.environ["AI_AGENT_URL"] = "http://localhost:8001"

from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.database import Base, SessionLocal, engine
from app.main import app
from app.models.customer import Customer
from app.models.dashboard_kpi import DashboardKPI
from app.models.order import Order
from app.models.product import Product
from app.models.support_ticket import SupportTicket
from app.models.user import User


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        db.add_all([
            User(
                email="testadmin@example.com",
                hashed_password=hash_password("TestAdmin@123"),
                name="Test Admin",
                role="admin",
                is_active=True,
            ),
            Product(
                id_produto="PROD-0001",
                nome_produto="Produto Teste Alpha",
                categoria="Eletronicos",
                preco_atual=299.90,
                ativo=True,
                estoque_disponivel=50,
            ),
            Product(
                id_produto="PROD-0002",
                nome_produto="Produto Teste Beta",
                categoria="Vestuario",
                preco_atual=89.90,
                ativo=True,
                estoque_disponivel=100,
            ),
            Customer(
                id_cliente="CLI-TEST-1",
                nome="Cliente Teste Um",
                email="cliente1@example.com",
                cidade="São Paulo",
                estado="São Paulo",
            ),
            Customer(
                id_cliente="CLI-TEST-2",
                nome="Cliente Teste Dois",
                email="cliente2@example.com",
                cidade="Rio de Janeiro",
                estado="Rio de Janeiro",
            ),
            Order(
                id_pedido="PED-TEST-1",
                id_cliente="CLI-TEST-1",
                id_produto="PROD-0001",
                data_pedido=date(2025, 1, 15),
                quantidade=1,
                valor_unitario=299.90,
                valor_total=299.90,
                status="Aprovado",
                metodo_pagamento="PIX",
                nome_cliente="Cliente Teste Um",
                nome_produto="Produto Teste Alpha",
                categoria_produto="Eletronicos",
                ano=2025,
                mes=1,
                trimestre=1,
            ),
            Order(
                id_pedido="PED-TEST-2",
                id_cliente="CLI-TEST-2",
                id_produto="PROD-0002",
                data_pedido=date(2025, 2, 10),
                quantidade=2,
                valor_unitario=89.90,
                valor_total=179.80,
                status="Processando",
                metodo_pagamento="Cartao",
                nome_cliente="Cliente Teste Dois",
                nome_produto="Produto Teste Beta",
                categoria_produto="Vestuario",
                ano=2025,
                mes=2,
                trimestre=1,
            ),
            SupportTicket(
                id_ticket="TIC-TEST-1",
                id_cliente="CLI-TEST-1",
                tipo_problema="Entrega",
                satisfacao_atendimento="alta",
                data_abertura="2025-01-20",
                agente_suporte="Agente Teste",
                status_ticket="Aberto",
                sla_estourado=False,
                nome_cliente="Cliente Teste Um",
            ),
            SupportTicket(
                id_ticket="TIC-TEST-2",
                id_cliente="CLI-TEST-2",
                tipo_problema="Produto",
                satisfacao_atendimento="media",
                data_abertura="2025-02-05",
                agente_suporte="Agente Teste",
                status_ticket="Resolvido",
                sla_estourado=False,
                nome_cliente="Cliente Teste Dois",
            ),
            DashboardKPI(
                ano=2025,
                mes=1,
                ano_mes="2025-01",
                qtd_pedidos=120,
                qtd_pedidos_aprovados=90,
                qtd_pedidos_recusados=15,
                qtd_pedidos_reembolsados=10,
                qtd_pedidos_processando=5,
                receita_bruta=35000.0,
                ticket_medio=291.67,
                qtd_clientes_unicos=80,
                qtd_clientes_novos=20,
                taxa_aprovacao=0.75,
                taxa_recusa=0.125,
                taxa_reembolso=0.083,
                categoria_mais_vendida="Eletronicos",
                estado_maior_receita="São Paulo",
                data_referencia_calculo=date(2025, 1, 31),
            ),
            DashboardKPI(
                ano=2025,
                mes=2,
                ano_mes="2025-02",
                qtd_pedidos=140,
                qtd_pedidos_aprovados=105,
                qtd_pedidos_recusados=18,
                qtd_pedidos_reembolsados=12,
                qtd_pedidos_processando=5,
                receita_bruta=42000.0,
                ticket_medio=300.0,
                qtd_clientes_unicos=95,
                qtd_clientes_novos=30,
                taxa_aprovacao=0.75,
                taxa_recusa=0.129,
                taxa_reembolso=0.086,
                categoria_mais_vendida="Vestuario",
                estado_maior_receita="Rio de Janeiro",
                data_referencia_calculo=date(2025, 2, 28),
            ),
        ])
        db.commit()
    finally:
        db.close()

    yield

    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="session")
def client(setup_db):
    return TestClient(app)


@pytest.fixture(scope="session")
def auth_headers(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@example.com", "password": "TestAdmin@123"},
    )
    assert resp.status_code == 200, f"Login falhou: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
