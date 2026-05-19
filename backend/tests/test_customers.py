def test_list_customers(client, auth_headers):
    resp = client.get("/api/v1/customers", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 2


def test_list_customers_filter_nome(client, auth_headers):
    resp = client.get("/api/v1/customers?nome=Cliente+Teste+Um", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any("Cliente Teste Um" in c["nome"] for c in data["items"])


def test_customer_stats(client, auth_headers):
    resp = client.get("/api/v1/customers/stats", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_clientes" in data
    assert "nota_media" in data


def test_get_customer(client, auth_headers):
    resp = client.get("/api/v1/customers/CLI-TEST-1", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id_cliente"] == "CLI-TEST-1"
    assert data["nome"] == "Cliente Teste Um"


def test_get_customer_not_found(client, auth_headers):
    resp = client.get("/api/v1/customers/CLI-INEXISTENTE", headers=auth_headers)
    assert resp.status_code == 404


def test_customer_perfil_360(client, auth_headers):
    resp = client.get("/api/v1/customers/CLI-TEST-1/perfil-360", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id_cliente"] == "CLI-TEST-1"
