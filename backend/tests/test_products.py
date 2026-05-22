_created_id = None


def test_list_products(client, auth_headers):
    resp = client.get("/api/v1/products", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 2


def test_list_products_filter_categoria(client, auth_headers):
    resp = client.get("/api/v1/products", params={"categoria": "Eletronicos"}, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    for item in data["items"]:
        assert item["categoria"] == "Eletronicos"


def test_get_product(client, auth_headers):
    resp = client.get("/api/v1/products/PROD-0001", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id_produto"] == "PROD-0001"
    assert data["nome_produto"] == "Produto Teste Alpha"


def test_get_product_not_found(client, auth_headers):
    resp = client.get("/api/v1/products/PROD-INEXISTENTE", headers=auth_headers)
    assert resp.status_code == 404


def test_create_product_no_auth(client):
    resp = client.post(
        "/api/v1/products",
        json={
            "nome_produto": "Produto Sem Auth",
            "categoria": "Livros",
            "preco_atual": 49.90,
            "ativo": True,
            "estoque": 10,
        },
    )
    assert resp.status_code == 401


def test_create_product_admin(client, auth_headers):
    global _created_id
    resp = client.post(
        "/api/v1/products",
        json={
            "nome_produto": "Produto Criado no Teste",
            "categoria": "Livros",
            "preco_atual": 59.90,
            "ativo": True,
            "estoque": 25,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["nome_produto"] == "Produto Criado no Teste"
    assert "id_produto" in data
    _created_id = data["id_produto"]


def test_update_product(client, auth_headers):
    assert _created_id is not None, "test_create_product_admin deve rodar antes"
    resp = client.put(
        f"/api/v1/products/{_created_id}",
        json={
            "nome_produto": "Produto Atualizado no Teste",
            "categoria": "Livros",
            "preco_atual": 69.90,
            "ativo": True,
            "estoque": 20,
        },
        headers=auth_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["nome_produto"] == "Produto Atualizado no Teste"
    assert data["preco_atual"] == 69.90


def test_delete_product(client, auth_headers):
    assert _created_id is not None
    resp = client.delete(f"/api/v1/products/{_created_id}", headers=auth_headers)
    assert resp.status_code == 204


def test_get_deleted_product(client, auth_headers):
    assert _created_id is not None
    resp = client.get(f"/api/v1/products/{_created_id}", headers=auth_headers)
    assert resp.status_code == 404
