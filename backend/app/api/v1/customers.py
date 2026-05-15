# Endpoints: Customers
#
# GET /api/v1/customers
#   Query params: nome, email, regiao, segmento, data_inicio, data_fim, page, size
#   Retorna lista paginada de clientes
#
# GET /api/v1/customers/{customer_id}
#   Retorna visão 360: dados cadastrais + pedidos + tickets + avaliações + métricas
#
# GET /api/v1/customers/{customer_id}/orders
# GET /api/v1/customers/{customer_id}/tickets
# GET /api/v1/customers/export (diferencial — CSV)
