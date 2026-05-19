def test_kpis_default(client, auth_headers):
    resp = client.get("/api/v1/dashboard/kpis", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "meses" in data
    assert len(data["meses"]) >= 1


def test_kpis_6m(client, auth_headers):
    resp = client.get("/api/v1/dashboard/kpis?periodo=6m", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "meses" in data
    assert data["periodo"] == "6m"


def test_kpis_no_auth(client):
    resp = client.get("/api/v1/dashboard/kpis")
    assert resp.status_code == 401
