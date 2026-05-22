"""
Recarrega todas as tabelas Gold no vcommerce.db a partir dos CSVs atualizados.

Uso (a partir de backend/):
    python reload_gold.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import pandas as pd
from sqlalchemy import inspect, text

from app.database import engine, Base
from app.models import (  # noqa: F401 — importar para registrar no metadata
    Customer, Order, Product, SupportTicket, Review, ClickstreamResumo, DashboardKPI,
)

GOLD_DIR = Path(__file__).parent.parent / "data" / "gold"

GOLD_TABLES = [
    "gold_produto_performance",
    "gold_pedidos_enriquecidos",
    "gold_tickets",
    "gold_cliente_360",
    "gold_avaliacoes",
    "gold_clickstream_resumo",
    "gold_vendas_kpis",
]


def reload():
    print("=== Recarga das tabelas Gold ===\n")

    # 1. Dropar tabelas gold (mantém users e outras)
    with engine.begin() as conn:
        for table in GOLD_TABLES:
            conn.execute(text(f'DROP TABLE IF EXISTS "{table}"'))
    print("Tabelas antigas removidas.")

    # 2. Recriar com schema atual dos modelos SQLAlchemy
    Base.metadata.create_all(bind=engine)
    print("Schema recriado.\n")

    # 3. Inspecionar colunas reais de cada tabela (para filtrar o CSV)
    inspector = inspect(engine)

    loaded = []
    skipped = []

    for table in GOLD_TABLES:
        csv_path = GOLD_DIR / f"{table}.csv"
        if not csv_path.exists():
            skipped.append(table)
            print(f"  SKIP  {table}: CSV não encontrado")
            continue

        model_cols = {c["name"] for c in inspector.get_columns(table)}

        df = pd.read_csv(csv_path, low_memory=False)
        df.columns = [c.strip().lower() for c in df.columns]

        # Filtra apenas colunas declaradas no modelo
        cols_to_load = [c for c in df.columns if c in model_cols]
        df_filtered = df[cols_to_load]

        df_filtered.to_sql(
            table, engine, if_exists="append", index=False, chunksize=5000
        )
        loaded.append((table, len(df_filtered)))
        print(f"  OK    {table}: {len(df_filtered):,} linhas")

    print("\n=== Concluído ===")
    if skipped:
        print(f"  CSVs ausentes: {skipped}")


if __name__ == "__main__":
    reload()
