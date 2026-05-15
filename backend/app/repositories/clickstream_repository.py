from datetime import date

# When Gold CSVs arrive: replace MOCK_CLICKSTREAM with SQLAlchemy queries on gold_clickstream_resumo.
MOCK_CLICKSTREAM: list[dict] = [
    {"id_cliente": 1, "data": date(2026, 5, 10), "qtd_eventos": 42, "qtd_sessoes": 3, "qtd_page_view": 28, "qtd_click": 8, "qtd_add_to_cart": 3, "qtd_abandon_cart": 1, "qtd_purchase": 1, "qtd_search": 1, "canal_principal": "Web",    "dispositivo_principal": "Desktop", "tempo_total_segundos": 2340, "data_referencia_calculo": date(2026, 5, 1)},
    {"id_cliente": 1, "data": date(2026, 5, 9),  "qtd_eventos": 18, "qtd_sessoes": 2, "qtd_page_view": 12, "qtd_click": 4, "qtd_add_to_cart": 1, "qtd_abandon_cart": 1, "qtd_purchase": 0, "qtd_search": 0, "canal_principal": "Web",    "dispositivo_principal": "Desktop", "tempo_total_segundos": 890,  "data_referencia_calculo": date(2026, 5, 1)},
    {"id_cliente": 2, "data": date(2026, 5, 10), "qtd_eventos": 35, "qtd_sessoes": 2, "qtd_page_view": 22, "qtd_click": 7, "qtd_add_to_cart": 4, "qtd_abandon_cart": 2, "qtd_purchase": 0, "qtd_search": 0, "canal_principal": "App",    "dispositivo_principal": "Mobile",  "tempo_total_segundos": 1800, "data_referencia_calculo": date(2026, 5, 1)},
    {"id_cliente": 2, "data": date(2026, 5, 8),  "qtd_eventos": 27, "qtd_sessoes": 1, "qtd_page_view": 18, "qtd_click": 5, "qtd_add_to_cart": 2, "qtd_abandon_cart": 1, "qtd_purchase": 1, "qtd_search": 0, "canal_principal": "App",    "dispositivo_principal": "Mobile",  "tempo_total_segundos": 1250, "data_referencia_calculo": date(2026, 5, 1)},
    {"id_cliente": 3, "data": date(2026, 5, 7),  "qtd_eventos": 20, "qtd_sessoes": 2, "qtd_page_view": 14, "qtd_click": 3, "qtd_add_to_cart": 2, "qtd_abandon_cart": 1, "qtd_purchase": 0, "qtd_search": 0, "canal_principal": "Web",    "dispositivo_principal": "Desktop", "tempo_total_segundos": 760,  "data_referencia_calculo": date(2026, 5, 1)},
    {"id_cliente": 5, "data": date(2026, 5, 10), "qtd_eventos": 55, "qtd_sessoes": 4, "qtd_page_view": 35, "qtd_click": 12, "qtd_add_to_cart": 5, "qtd_abandon_cart": 1, "qtd_purchase": 1, "qtd_search": 1, "canal_principal": "App",   "dispositivo_principal": "Mobile",  "tempo_total_segundos": 3100, "data_referencia_calculo": date(2026, 5, 1)},
    {"id_cliente": 6, "data": date(2026, 5, 10), "qtd_eventos": 78, "qtd_sessoes": 5, "qtd_page_view": 50, "qtd_click": 15, "qtd_add_to_cart": 8, "qtd_abandon_cart": 2, "qtd_purchase": 2, "qtd_search": 1, "canal_principal": "Web",   "dispositivo_principal": "Desktop", "tempo_total_segundos": 4200, "data_referencia_calculo": date(2026, 5, 1)},
    {"id_cliente": 9, "data": date(2026, 5, 10), "qtd_eventos": 48, "qtd_sessoes": 3, "qtd_page_view": 30, "qtd_click": 10, "qtd_add_to_cart": 5, "qtd_abandon_cart": 1, "qtd_purchase": 1, "qtd_search": 1, "canal_principal": "App",   "dispositivo_principal": "Mobile",  "tempo_total_segundos": 2600, "data_referencia_calculo": date(2026, 5, 1)},
    {"id_cliente": 10, "data": date(2026, 5, 9), "qtd_eventos": 32, "qtd_sessoes": 2, "qtd_page_view": 20, "qtd_click": 6, "qtd_add_to_cart": 4, "qtd_abandon_cart": 1, "qtd_purchase": 1, "qtd_search": 0, "canal_principal": "Web",    "dispositivo_principal": "Desktop", "tempo_total_segundos": 1650, "data_referencia_calculo": date(2026, 5, 1)},
]


def get_by_customer(id_cliente: int, periodo_dias: int = 30) -> list[dict]:
    # When Gold CSVs arrive: replace with db.query(ClickstreamResumo)
    #   .filter_by(id_cliente=id_cliente).filter(data >= cutoff).all()
    return [r for r in MOCK_CLICKSTREAM if r["id_cliente"] == id_cliente]
