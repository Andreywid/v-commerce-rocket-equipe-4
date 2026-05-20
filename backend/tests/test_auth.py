def test_login_success(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@example.com", "password": "TestAdmin@123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "testadmin@example.com"


def test_login_wrong_password(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "testadmin@example.com", "password": "senhaerrada"},
    )
    assert resp.status_code == 401


def test_login_nonexistent_email(client):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "naoexiste@test.com", "password": "qualquer"},
    )
    assert resp.status_code == 401


def test_me_no_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_me_with_token(client, auth_headers):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "testadmin@example.com"
    assert data["role"] == "admin"
