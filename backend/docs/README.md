# Documentação Técnica — Backend

Índice da documentação modular do backend V-Commerce CRM 360.

## Módulos

| Arquivo | Conteúdo |
|---|---|
| [arquitetura.md](modules/arquitetura.md) | Arquitetura em camadas, fluxo completo de uma requisição autenticada |
| [autenticacao.md](modules/autenticacao.md) | JWT, bcrypt, deps (get_current_user / require_admin), rate limiting |
| [endpoints.md](modules/endpoints.md) | Referência completa de todos os endpoints da API |
| [modelos.md](modules/modelos.md) | Modelos SQLAlchemy com todos os campos e tipos |
| [schemas.md](modules/schemas.md) | Schemas Pydantic de entrada e saída por entidade |
| [repositorios.md](modules/repositorios.md) | Camada de acesso a dados, filtros, paginação |
| [servicos.md](modules/servicos.md) | Camada de serviços, regras de negócio, orquestração |
| [banco-de-dados.md](modules/banco-de-dados.md) | Configuração SQLite, tabelas Gold, scripts seed e load |
| [ai-agent.md](modules/ai-agent.md) | Proxy HTTP para o AI Agent, mapeamento de campos, fallback |

## Referências

- [README do backend](../README.md) — início rápido e estrutura geral
- [Documentação completa consolidada](../V-Commerce-backend-Documentacao.MD)
- [Documentação do frontend](../../frontend/docs/README.md)
- [Documentação do AI Agent](../../ai-agent/docs/README.md)
