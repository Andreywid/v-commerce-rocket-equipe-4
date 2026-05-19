"""SQLite mock alinhado a ``GOLD_SCHEMA`` em ``schema_registry`` para testar o agente."""

from __future__ import annotations

import csv
import sqlite3
from pathlib import Path

from app.database.schema_registry import GOLD_SCHEMA

_SQL_TYPES = {
    "inteiro": "INTEGER",
    "texto": "TEXT",
    "decimal": "REAL",
    "booleano": "INTEGER",
    "data": "TEXT",
    "enum": "TEXT",
}


def _sql_type(meta: dict) -> str:
    """Converte o tipo semântico do registry para um tipo aceito pelo SQLite."""

    return _SQL_TYPES.get(meta.get("tipo", "texto"), "TEXT")


def _create_tables(cur: sqlite3.Cursor) -> None:
    """Cria todas as tabelas Gold usando a ordem de colunas do registry."""

    for table, spec in GOLD_SCHEMA.items():
        cols = ", ".join(
            f'"{name}" {_sql_type(meta)}' for name, meta in spec["colunas"].items()
        )
        cur.execute(f'CREATE TABLE "{table}" ({cols})')


def _load_csv_data(csv_path: Path) -> list[dict] | None:
    """Carrega dados de um arquivo CSV e retorna lista de dicts."""
    try:
        if not csv_path.exists():
            return None
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            return list(reader)
    except Exception as e:
        print(f"Erro ao carregar {csv_path}: {e}")
        return None


def _load_and_seed_csv_data(cur: sqlite3.Cursor) -> bool:
    """
    Tenta carregar dados dos CSVs na pasta data/.
    Retorna True se conseguiu, False caso contrário.
    """
    data_dir = Path(__file__).resolve().parent / "data"
    
    # Mapear tabelas para arquivos CSV
    csv_mappings = {
        "gold_cliente_360": "gold_clientes_360.csv",
        "gold_produto_performance": "gold_produto_performance.csv",
        "gold_avaliacoes": "gold_avaliacoes.csv",
        "gold_tickets": "gold_tickets.csv",
        "gold_vendas_kpis": "gold_vendas_kpis.csv",
        "gold_pedidos_enriquecidos": "gold_pedidos_enriquecidos.csv",
        "gold_clickstream_resumo": "gold_clickstream_resumo.csv",
    }
    
    loaded_any = False
    
    for table_name, csv_filename in csv_mappings.items():
        csv_path = data_dir / csv_filename
        rows = _load_csv_data(csv_path)
        
        if rows:
            loaded_any = True
            spec = GOLD_SCHEMA.get(table_name, {})
            cols = list(spec.get("colunas", {}).keys())
            
            # Converter valores aos tipos corretos
            for row in rows:
                values = []
                for col in cols:
                    val = row.get(col, "")
                    # Converter valores
                    if val == "" or val is None:
                        values.append(None)
                    else:
                        meta = spec.get("colunas", {}).get(col, {})
                        tipo = meta.get("tipo", "texto")
                        try:
                            if tipo == "inteiro":
                                values.append(int(val) if val else None)
                            elif tipo == "decimal":
                                values.append(float(val) if val else None)
                            elif tipo == "booleano":
                                values.append(1 if str(val).lower() in ["true", "1", "sim"] else 0)
                            else:
                                values.append(val)
                        except (ValueError, TypeError):
                            values.append(val)
                
                placeholders = ",".join(["?" for _ in cols])
                col_list = ", ".join(f'"{c}"' for c in cols)
                try:
                    cur.execute(
                        f'INSERT INTO "{table_name}" ({col_list}) VALUES ({placeholders})',
                        values
                    )
                except Exception as e:
                    print(f"Erro inserindo linha em {table_name}: {e}")
    
    return loaded_any


def _seed(cur: sqlite3.Cursor) -> None:
    """Insere dados: primeiro tenta CSV, depois usa dados hardcoded como fallback."""
    
    # Tenta carregar dados dos CSVs
    if _load_and_seed_csv_data(cur):
        print("Dados carregados dos arquivos CSV")
        return

    # Fallback: dados hardcoded

    cur.executemany(
        """
        INSERT INTO gold_cliente_360 VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )
        """,
        [
            (
                1,
                "Ana Souza",
                "ana@email.com",
                "11999990001",
                "2023-01-10",
                "São Paulo",
                "SP",
                "Web",
                12,
                10,
                1,
                1,
                0,
                4850.0,
                485.0,
                "2023-02-01",
                "2026-04-28",
                2,
                1,
                1,
                4,
                4.2,
                8.0,
                420,
                "Web",
                "Alto",
                1,
                0,
                ref,
            ),
            (
                2,
                "Bruno Lima",
                "bruno@email.com",
                "21988880002",
                "2023-06-15",
                "Rio de Janeiro",
                "RJ",
                "App",
                5,
                4,
                1,
                0,
                0,
                920.0,
                230.0,
                "2024-01-05",
                "2026-03-12",
                5,
                3,
                2,
                2,
                3.5,
                7.0,
                890,
                "Mobile",
                "Medio",
                1,
                1,
                ref,
            ),
            (
                3,
                "Carla Dias",
                "carla@email.com",
                "31377770003",
                "2024-02-20",
                "Belo Horizonte",
                "MG",
                "Indicacao",
                2,
                2,
                0,
                0,
                0,
                310.0,
                155.0,
                "2025-11-01",
                "2025-11-20",
                0,
                0,
                0,
                1,
                5.0,
                9.0,
                120,
                "App",
                "Baixo",
                0,
                0,
                ref,
            ),
            (
                4,
                "Diego Rocha",
                "diego@email.com",
                "85966660004",
                "2024-08-01",
                "Fortaleza",
                "CE",
                "Web",
                8,
                7,
                1,
                0,
                0,
                2100.0,
                300.0,
                "2024-09-10",
                "2026-05-01",
                1,
                0,
                1,
                3,
                4.0,
                8.0,
                340,
                "Web",
                "Alto",
                1,
                0,
                ref,
            ),
            (
                5,
                "Elena Prado",
                "elena@email.com",
                "48355550005",
                "2025-01-05",
                "Florianópolis",
                "SC",
                "Web",
                1,
                1,
                0,
                0,
                0,
                199.0,
                199.0,
                "2026-01-10",
                "2026-01-10",
                0,
                0,
                0,
                0,
                0.0,
                0.0,
                45,
                "Desktop",
                "Baixo",
                1,
                0,
                ref,
            ),
            (
                6,
                "Felipe Nunes",
                "felipe@email.com",
                "11344440006",
                "2022-11-20",
                "São Paulo",
                "SP",
                "App",
                20,
                18,
                2,
                0,
                0,
                12400.0,
                688.89,
                "2022-12-01",
                "2026-04-15",
                1,
                0,
                1,
                6,
                4.5,
                9.0,
                2100,
                "App",
                "Alto",
                1,
                0,
                ref,
            ),
            (
                7,
                "Gabi Torres",
                "gabi@email.com",
                "21333330007",
                "2025-10-01",
                "Rio de Janeiro",
                "RJ",
                "Web",
                0,
                0,
                0,
                0,
                0,
                0.0,
                0.0,
                None,
                None,
                0,
                0,
                0,
                0,
                0.0,
                0.0,
                80,
                "Mobile",
                "Baixo",
                0,
                0,
                ref,
            ),
            (
                8,
                "Hugo Martins",
                "hugo@email.com",
                "11322220008",
                "2021-05-01",
                "Campinas",
                "SP",
                "Indicacao",
                3,
                2,
                1,
                0,
                0,
                450.0,
                225.0,
                "2024-06-01",
                "2025-08-01",
                4,
                4,
                0,
                1,
                2.0,
                6.0,
                200,
                "Web",
                "Medio",
                0,
                1,
                ref,
            ),
        ],
    )

    cur.executemany(
        """
        INSERT INTO gold_produto_performance VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )
        """,
        [
            (
                1,
                "Fone Bluetooth X",
                "Eletronicos",
                199.9,
                1,
                120,
                25,
                80,
                18500.0,
                4200.0,
                8,
                3,
                0.067,
                40,
                4.3,
                0.85,
                5000,
                400,
                0.024,
                "Top Vendedor",
                ref,
            ),
            (
                2,
                "Cadeira Ergo Pro",
                "Moveis",
                899.0,
                1,
                45,
                5,
                18,
                32000.0,
                4500.0,
                22,
                8,
                0.489,
                15,
                3.8,
                0.6,
                800,
                60,
                0.056,
                "Problemático",
                ref,
            ),
            (
                3,
                "Kit Cafés Especiais",
                "Alimentos",
                89.9,
                1,
                200,
                40,
                110,
                15000.0,
                3600.0,
                2,
                1,
                0.01,
                60,
                4.7,
                0.92,
                3000,
                500,
                0.067,
                "Top Vendedor",
                ref,
            ),
            (
                4,
                "Smartwatch Lite",
                "Eletronicos",
                349.0,
                1,
                30,
                2,
                12,
                9000.0,
                698.0,
                15,
                5,
                0.5,
                10,
                3.2,
                0.4,
                2000,
                80,
                0.015,
                "Encalhado",
                ref,
            ),
            (
                5,
                "Luminária LED",
                "Casa",
                59.9,
                0,
                500,
                0,
                0,
                25000.0,
                0.0,
                1,
                0,
                0.002,
                200,
                4.5,
                0.88,
                10000,
                200,
                0.02,
                "Estável",
                ref,
            ),
        ],
    )

    pedidos = [
        (1, 1, 1, "2026-01-05", 1, 199.9, 199.9, "Aprovado", "PIX", "Ana Souza", "SP", "Fone Bluetooth X", "Eletronicos", 2026, 1, 1),
        (2, 1, 3, "2026-01-12", 2, 89.9, 179.8, "Aprovado", "Cartao", "Ana Souza", "SP", "Kit Cafés Especiais", "Alimentos", 2026, 1, 1),
        (3, 2, 1, "2026-02-01", 1, 199.9, 199.9, "Aprovado", "Boleto", "Bruno Lima", "RJ", "Fone Bluetooth X", "Eletronicos", 2026, 2, 1),
        (4, 2, 2, "2026-02-14", 1, 899.0, 899.0, "Recusado", "Cartao", "Bruno Lima", "RJ", "Cadeira Ergo Pro", "Moveis", 2026, 2, 1),
        (5, 3, 3, "2025-11-15", 1, 89.9, 89.9, "Aprovado", "PIX", "Carla Dias", "MG", "Kit Cafés Especiais", "Alimentos", 2025, 11, 4),
        (6, 4, 4, "2026-03-01", 1, 349.0, 349.0, "Processando", "PIX", "Diego Rocha", "CE", "Smartwatch Lite", "Eletronicos", 2026, 3, 1),
        (7, 4, 1, "2026-04-20", 2, 199.9, 399.8, "Aprovado", "Cartao", "Diego Rocha", "CE", "Fone Bluetooth X", "Eletronicos", 2026, 4, 2),
        (8, 5, 5, "2026-01-10", 3, 59.9, 179.7, "Aprovado", "PIX", "Elena Prado", "SC", "Luminária LED", "Casa", 2026, 1, 1),
        (9, 6, 2, "2026-04-01", 1, 899.0, 899.0, "Aprovado", "Cartao", "Felipe Nunes", "SP", "Cadeira Ergo Pro", "Moveis", 2026, 4, 2),
        (10, 6, 1, "2026-04-10", 1, 199.9, 199.9, "Reembolsado", "PIX", "Felipe Nunes", "SP", "Fone Bluetooth X", "Eletronicos", 2026, 4, 2),
        (11, 1, 2, "2025-12-20", 1, 899.0, 899.0, "Aprovado", "PIX", "Ana Souza", "SP", "Cadeira Ergo Pro", "Moveis", 2025, 12, 4),
        (12, 8, 3, "2025-08-01", 4, 89.9, 359.6, "Aprovado", "Boleto", "Hugo Martins", "SP", "Kit Cafés Especiais", "Alimentos", 2025, 8, 3),
        (13, 2, 3, "2026-03-05", 1, 89.9, 89.9, "Aprovado", "PIX", "Bruno Lima", "RJ", "Kit Cafés Especiais", "Alimentos", 2026, 3, 1),
        (14, 4, 3, "2026-05-01", 2, 89.9, 179.8, "Aprovado", "PIX", "Diego Rocha", "CE", "Kit Cafés Especiais", "Alimentos", 2026, 5, 2),
        (15, 1, 4, "2024-11-10", 1, 349.0, 349.0, "Recusado", "Cartao", "Ana Souza", "SP", "Smartwatch Lite", "Eletronicos", 2024, 11, 4),
    ]
    cur.executemany(
        """
        INSERT INTO gold_pedidos_enriquecidos VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )
        """,
        pedidos,
    )

    kpis = [
        (2024, 11, "2024-11", 120, 95, 15, 5, 5, 28500.0, 300.0, 70, 12, 0.792, 0.125, 0.042, "Eletronicos", "SP", "2026-05-10"),
        (2024, 12, "2024-12", 200, 165, 25, 8, 2, 52000.0, 315.15, 90, 20, 0.825, 0.125, 0.04, "Alimentos", "RJ", "2026-05-10"),
        (2025, 1, "2025-01", 180, 150, 20, 7, 3, 48000.0, 320.0, 85, 18, 0.833, 0.111, 0.039, "Eletronicos", "SP", "2026-05-10"),
        (2025, 2, "2025-02", 150, 128, 14, 5, 3, 41000.0, 320.31, 72, 10, 0.853, 0.093, 0.033, "Moveis", "MG", "2026-05-10"),
        (2026, 3, "2026-03", 95, 80, 10, 3, 2, 26500.0, 331.25, 55, 8, 0.842, 0.105, 0.032, "Eletronicos", "CE", "2026-05-10"),
        (2026, 4, "2026-04", 110, 92, 12, 4, 2, 30100.0, 327.17, 60, 9, 0.836, 0.109, 0.036, "Alimentos", "SP", "2026-05-10"),
    ]
    cur.executemany(
        """
        INSERT INTO gold_vendas_kpis VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )
        """,
        kpis,
    )

    tickets = [
        (1, 2, 4, 2, "Produto", "media", "2026-03-01", "2026-03-02", 18.0, "João", 4, "Aberto", 0, "Bruno Lima", "Cadeira Ergo Pro", ref),
        (2, 2, 4, 2, "Entrega", "alta", "2026-02-10", "2026-02-11", 22.0, "Maria", 5, "Resolvido", 0, "Bruno Lima", "Cadeira Ergo Pro", ref),
        (3, 2, 13, 3, "Pagamento", "baixa", "2026-03-06", None, None, "João", 2, "Aberto", 1, "Bruno Lima", "Kit Cafés Especiais", ref),
        (4, 8, 12, 3, "Reembolso", "sem_avaliacao", "2025-08-02", "2025-08-03", 26.0, "Maria", None, "Resolvido", 0, "Hugo Martins", "Kit Cafés Especiais", ref),
        (5, 1, 11, 2, "Produto", "alta", "2025-12-21", "2025-12-22", 8.0, "João", 5, "Resolvido", 0, "Ana Souza", "Cadeira Ergo Pro", ref),
    ]
    cur.executemany(
        """
        INSERT INTO gold_tickets VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )
        """,
        tickets,
    )

    avaliacoes = [
        (1, 1, 1, 1, 5, 9, 1, "Excelente qualidade", "positivo", "2026-01-06", "Fone Bluetooth X", "Eletronicos", "Ana Souza"),
        (2, 3, 5, 3, 5, 10, 1, "Adorei o sabor", "positivo", "2025-11-16", "Kit Cafés Especiais", "Alimentos", "Carla Dias"),
        (3, 6, 9, 2, 4, 8, 1, "Confortável", "positivo", "2026-04-02", "Cadeira Ergo Pro", "Moveis", "Felipe Nunes"),
        (4, 6, 10, 1, 2, 3, 0, "Veio com defeito", "negativo", "2026-04-11", "Fone Bluetooth X", "Eletronicos", "Felipe Nunes"),
        (5, 4, 7, 1, 5, 9, 1, "Rápido", "positivo", "2026-04-21", "Fone Bluetooth X", "Eletronicos", "Diego Rocha"),
    ]
    cur.executemany(
        """
        INSERT INTO gold_avaliacoes VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?
        )
        """,
        avaliacoes,
    )

    click = [
        (1, "2026-05-09", 45, 2, 20, 10, 3, 1, 2, 4, "Web", "Desktop", 3600, ref),
        (1, "2026-05-08", 30, 1, 15, 8, 2, 0, 1, 2, "Mobile", "Mobile", 2100, ref),
        (2, "2026-05-09", 80, 3, 40, 20, 5, 2, 1, 8, "App", "Mobile", 5400, ref),
        (4, "2026-05-09", 25, 1, 12, 6, 1, 0, 0, 3, "Web", "Tablet", 1800, ref),
        (7, "2026-05-09", 10, 1, 5, 2, 0, 1, 0, 1, "Mobile", "Mobile", 600, ref),
    ]
    cur.executemany(
        """
        INSERT INTO gold_clickstream_resumo VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )
        """,
        click,
    )


def build_mock_sqlite(path: str | Path | None = None) -> Path:
    """
    Cria um arquivo SQLite com tabelas e dados de exemplo.

    Se ``path`` for None, usa ``app/database/mock_gold.sqlite`` ao lado deste módulo.
    """
    base = Path(__file__).resolve().parent
    out = Path(path) if path is not None else base / "mock_gold.sqlite"
    if out.exists():
        out.unlink()
    conn = sqlite3.connect(out)
    try:
        cur = conn.cursor()
        _create_tables(cur)
        _seed(cur)
        conn.commit()
    finally:
        conn.close()
    return out


def _is_populated(db_path: Path) -> bool:
    """Retorna True se o banco tem pelo menos um registro em gold_produto_performance."""
    try:
        conn = sqlite3.connect(str(db_path))
        count = conn.execute("SELECT COUNT(*) FROM gold_produto_performance").fetchone()[0]
        conn.close()
        return count > 0
    except Exception:
        return False


def ensure_mock_sqlite(path: str | Path | None = None) -> Path:
    """Garante que o SQLite existe e está populado com os dados Gold.

    Na primeira execução (ou se o banco estiver vazio), carrega os CSVs de
    ``data/gold/`` via ``load_gold_csv.build()``. Isso elimina a necessidade
    de rodar o script manualmente após clonar o repositório.
    """
    base = Path(__file__).resolve().parent
    out = Path(path) if path is not None else base / "mock_gold.sqlite"

    if out.exists() and _is_populated(out):
        return out

    # Banco ausente ou vazio — carrega dos CSVs Gold
    from app.database.load_gold_csv import build as _build_from_csv
    _build_from_csv(out)
    return out


__all__ = ["build_mock_sqlite", "ensure_mock_sqlite"]


if __name__ == "__main__":
    out = build_mock_sqlite()
    conn = sqlite3.connect(out)
    try:
        cur = conn.cursor()
        for name in GOLD_SCHEMA:
            n = cur.execute(f"select count(*) from {name}").fetchone()[0]
            print(f"{name}: {n} linhas")
    finally:
        conn.close()
    print("Arquivo:", out)
