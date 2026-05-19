_created_id = None


def test_list_tickets(client, auth_headers):
    resp = client.get("/api/v1/support", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 2


def test_get_ticket(client, auth_headers):
    resp = client.get("/api/v1/support/TIC-TEST-1", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id_ticket"] == "TIC-TEST-1"
    assert data["tipo_problema"] == "Entrega"


def test_get_ticket_not_found(client, auth_headers):
    resp = client.get("/api/v1/support/TIC-INEXISTENTE", headers=auth_headers)
    assert resp.status_code == 404


def test_create_ticket_no_auth(client):
    resp = client.post(
        "/api/v1/support",
        json={
            "id_cliente": "CLI-TEST-1",
            "tipo_problema": "Reembolso",
            "data_abertura": "2025-03-10",
        },
    )
    assert resp.status_code == 401


def test_create_ticket(client, auth_headers):
    global _created_id
    resp = client.post(
        "/api/v1/support",
        json={
            "id_cliente": "CLI-TEST-1",
            "tipo_problema": "Reembolso",
            "agente_suporte": "Agente Teste",
            "nome_cliente": "Cliente Teste Um",
            "data_abertura": "2025-03-10",
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "id_ticket" in data
    _created_id = data["id_ticket"]
    # cleanup
    client.delete(f"/api/v1/support/{_created_id}", headers=auth_headers)
