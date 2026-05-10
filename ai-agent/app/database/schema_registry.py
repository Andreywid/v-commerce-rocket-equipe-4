
DB_SCHEMA = """
CREATE TABLE vendas (
    id INT,
    produto VARCHAR,
    valor DECIMAL,
    data DATE
);

CREATE TABLE clientes (
    id INT,
    nome VARCHAR,
    email VARCHAR,
    telefone VARCHAR
);

CREATE TABLE produtos (
    id INT,
    nome VARCHAR,
    preco DECIMAL
);

CREATE TABLE pedidos (
    id INT,
    cliente_id INT,
    produto_id INT,
    quantidade INT,
    data DATE
);

CREATE TABLE suporte (
    id INT,
    cliente_id INT,
    produto_id INT,
    quantidade INT,
    data DATE
);

CREATE TABLE avaliacoes (
    id INT,
    cliente_id INT,
    produto_id INT,
    avaliacao INT,
    data DATE
);

CREATE TABLE clickstream (
    id INT,
    cliente_id INT,
    produto_id INT,
    quantidade INT,
    data DATE
);
"""
