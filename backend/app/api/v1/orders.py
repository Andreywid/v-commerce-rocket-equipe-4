# Endpoints: Orders
#
# GET /api/v1/orders
#   Query params: status, data_inicio, data_fim, produto_id, regiao, categoria, page, size
#   Retorna lista paginada de pedidos
#
# GET /api/v1/orders/{order_id}
#   Retorna detalhe do pedido com produto e cliente
#
# GET /api/v1/orders/export (diferencial — CSV)
