# 🤖 Módulo de Inteligência Artificial (AI Agent) - V-Commerce CRM 360

Este diretório contém a implementação do Agente de IA Conversacional (Text-to-SQL) do projeto V-Commerce. O objetivo deste módulo é permitir que os usuários façam perguntas em linguagem natural e recebam respostas e dados precisos do banco de dados (Camada Gold).

## 🧠 O Arquivo `schema_gold.py`: Base de Conhecimento e Governança

Em vez de documentar o banco de dados em um arquivo de texto estático (como um Word ou PDF), o mapeamento foi construído diretamente em código através de um dicionário Python. Isso cria uma **Documentação Viva** que é processada em milissegundos pela IA a cada interação, garantindo que o modelo de linguagem tenha o contexto exato e atualizado antes de gerar qualquer query SQL.

Abaixo está o detalhamento técnico do **porquê** cada elemento foi estruturado dessa forma, focado na prevenção de "alucinações" e erros lógicos:

### 1. Nível da Tabela (Roteamento e Relacionamentos)
Quando o usuário faz uma pergunta, a IA primeiro precisa decidir *qual* tabela ou conjunto de tabelas usar. O escopo global de cada tabela no dicionário serve para isso:

* **`descricao`:** Funciona como o roteador principal. Ao ler instruções como *"Use para perguntas sobre desempenho mensal"*, a IA entende que deve otimizar a consulta usando a tabela agregada `gold_vendas_kpis` em vez de varrer milhares de linhas na tabela de pedidos individuais. Isso economiza processamento e evita queries ineficientes.
* **`granularidade`:** Define a escala de observação da tabela (ex: "Uma linha por mês" vs. "Uma linha por cliente por dia"). Essa propriedade impede a IA de tentar cruzar ou somar métricas de escalas temporais ou de entidades diferentes, evitando distorções estatísticas.
* **`chave_primaria` e `chaves_estrangeiras`:** Mapeiam os "pinos de encaixe" do banco. Ensinam a IA a conectar as tabelas corretamente (fazer `JOINs` precisos) e indicam qual coluna usar para contar registros únicos (`COUNT DISTINCT`), evitando a dupla contagem de clientes ou pedidos.
* **`regras_ia` (Guardrails de Negócio):** Este é o componente mais crítico para a confiabilidade analítica. São "travas" de segurança lógicas. Por exemplo, contém a regra que ensina a IA a *não fazer a média das médias* ao calcular o ticket médio de vários meses, fornecendo a equação matemática exata que deve ser usada no SQL (`SUM(receita_bruta) / SUM(qtd_pedidos_aprovados)`).

### 2. Nível das Colunas (Sintaxe e Precisão)
Após escolher a tabela, a IA precisa construir as cláusulas `SELECT` e `WHERE`. O dicionário de colunas blinda o modelo contra erros de tipagem e jargões de negócio:

* **`descricao` e `tipo`:** Explica o que o dado representa e informa se ele é um `texto`, `inteiro`, `decimal` ou `booleano`. O tipo de dado é crucial para garantir que a IA use a sintaxe correta (como colocar aspas em strings), evitando que o banco de dados rejeite a query.
* **`agregacao`:** Controla o comportamento matemático esperado para o campo. Tags como `NAO_SOMAR` impedem a IA de gerar aberrações matemáticas como `SUM(taxa_conversao)`. Tags como `RECALCULAR` forçam a IA a aplicar lógicas compostas em vez de agregações simples quando a consulta envolve múltiplos períodos.
* **`valores_validos` (Enums):** Lista explicitamente os status padronizados pela Engenharia de Dados (ex: "Aprovado", "Recusado", "Processando"). Isso impede que a IA alucine filtros baseados no jargão do usuário. Se o usuário perguntar por pedidos "Cancelados", a IA saberá mapear isso para `status IN ('Recusado', 'Reembolsado')`, evitando queries que retornam zero linhas por causa de vocabulário incorreto.

### 3. A Função `get_schema_prompt()`
Esta função atua como o compilador do prompt. Ela transforma a estrutura de dados (JSON/Dicionário) em um **System Prompt** linear em linguagem natural, otimizado para o Mecanismo de Atenção (Attention Mechanism) de modelos LLM. Ela injeta regras de conduta universais (ex: *"Não invente nomes de tabelas"*, *"Se a pergunta for ambígua, solicite esclarecimento"*) e anexa toda a documentação das tabelas de forma estruturada. 

O resultado final desta função é o contexto inviolável que o Agente utilizará para basear suas respostas.
