_created_id = None


def test_list_orders(client, auth_headers):
    resp = client.get("/api/v1/orders", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 2


def test_filter_orders_by_status(client, auth_headers):
    resp = client.get("/api/v1/orders", params={"status": "Aprovado"}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["status"] == "Aprovado"


def test_get_order(client, auth_headers):
    resp = client.get("/api/v1/orders/PED-TEST-1", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id_pedido"] == "PED-TEST-1"
    assert data["status"] == "Aprovado"


def test_get_order_not_found(client, auth_headers):
    resp = client.get("/api/v1/orders/PED-INEXISTENTE", headers=auth_headers)
    assert resp.status_code == 404


def test_create_order_admin(client, auth_headers):
    global _created_id
    resp = client.post(
        "/api/v1/orders",
        json={
            "id_pedido": "PED-CRIADO-TESTE",
            "id_produto": "PROD-0001",
            "data_pedido": "2025-03-01",
            "quantidade": 1,
            "status": "Aprovado",
            "metodo_pagamento": "PIX",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["id_pedido"] == "PED-CRIADO-TESTE"
    _created_id = data["id_pedido"]
    # cleanup
    client.delete(f"/api/v1/orders/{_created_id}", headers=auth_headers)
