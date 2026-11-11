# ObraSense — Backend adaptado ao frontend do Iago

Backend **Node.js + Express + Prisma 6 + SQLite**, sem MySQL. Mantém o marketplace (cliente, profissional e empresa, solicitações, propostas, acompanhamento de obras) e acrescenta campos compatíveis com as telas do frontend do Iago.

## Instalar e iniciar

No terminal, **dentro desta pasta**:

```bash
npm install
npm run db:push
npm run dev
```

API: http://localhost:3000  |  SQLite: `prisma/dev.db` (criado ao executar `db:push`).

## Integração necessária no frontend

**O frontend original ainda usa dados fixos.** O backend foi preparado para entregar as informações que ele espera, mas você precisa substituir os dados locais por requisições HTTP e adicionar login/cadastro no frontend.

1. Cadastro: `POST /api/auth/cadastro` com `{ "nome", "email", "senha", "tipo": "CLIENTE" }` (ou `PROFISSIONAL` / `EMPRESA`).
2. Login: `POST /api/auth/login` com `{ "email", "senha" }`. Salve o campo `token` da resposta.
3. Nas demais requisições, envie `Authorization: Bearer SEU_TOKEN`.
4. Dashboard: `GET /api/dashboard`, que fornece `obrasAtivas`, `obrasTrend`, `orcamentoConsumido`, `orcamentoStatus`, `alertasCount`, `ultimoAlertaMsg`, `equipePresente`, `presencaStatus`.
5. Minhas Obras: `GET /api/obras`, que fornece array com `id`, `nome`, `responsavel`, `status` em português, `progresso`, `alerta` e também detalhes relacionais originais.
6. Agente: `POST /api/agente/perguntar` (ou `/api/agente/chat`) com `{ "pergunta": "..." }` ou `{ "prompt": "..." }`. Resposta `{ "resposta": "..." }`. **Não há IA generativa nesta versão**.
7. Clientes podem enviar solicitações em `POST /api/solicitacoes`; profissionais/empresas enviam propostas em `POST /api/propostas`; clientes aceitam em `POST /api/propostas/:id/aceitar`.
8. Ao aceitar uma proposta, o cliente cria a obra automaticamente. O prestador responsável pode alterar o orçamento com `PATCH /api/obras/:id/orcamento` (`{ "orcamento": 1200 }`), adicionar produtos em `POST /api/obras/:id/produtos` (`{ "nome": "Cimento", "quantidade": 10, "valorUnitario": 35.5 }`), registrar o progresso realizado em `POST /api/obras/:id/atualizacoes` (`{ "progresso": 40, "descricao": "Etapa concluída" }`) e planejar etapas do cronograma em `POST /api/obras/:id/etapas` (`{ "titulo": "Fundação", "descricao": "Preparar e concretar a fundação", "dataInicio": "2026-12-01", "dataFim": "2026-12-10" }`). Consulte o calendário em `GET /api/obras/:id/etapas` ou os detalhes da obra em `GET /api/obras/:id`; as etapas são retornadas em ordem de início. Edite datas, título, descrição ou status (`PLANEJADA`, `EM_ANDAMENTO`, `CONCLUIDA`, `CANCELADA`) com `PATCH /api/obras/:id/etapas/:etapaId` e remova uma etapa com `DELETE` na mesma rota. As datas devem ser válidas e a data final igual ou posterior à inicial. A empresa também pode administrar o progresso e é a única que pode cancelar a obra em `POST /api/obras/:id/cancelar`. As ações do prestador só se aplicam às obras vinculadas ao seu perfil. O cancelamento preserva o registro e altera o status para `CANCELADA`.

## O que não fica funcionando sem alterações no frontend

- `Dashboard.jsx`: atualmente exibe números literais (12, 45%, 3 e 148).
- `MinhasObras.jsx`: ainda tem array estático, botões de visualizar/editar sem ação e Nova Obra sem ação.
- `AgenteIA.jsx`: ainda usa `setTimeout` para simular o agente.
- `App.jsx`: não possui `/login` ou `/cadastro`, nem proteção de rotas.
- Links de Orçamentos e Cronogramas são apenas placeholders.

Essas páginas precisam ser ligadas à API para exibir o conteúdo real. Não removemos a autenticação das rotas para simular compatibilidade.

Após atualizar o backend, execute `npm run db:push` para criar as tabelas de produtos e etapas do cronograma no SQLite.

## Observações

- Tokens ficam em memória no servidor: reiniciar exige novo login.
- Contagem de equipe permanece zero porque a presença não é registrada no modelo atual.
- Contagem de alertas usa apenas obras explicitamente marcadas como `ATRASADA`.
- Use este projeto para estudo/desenvolvimento local; para produção, fortalecer sessões, validações, concorrência e controle de permissões.
- Não comite `.env` ou arquivos `.db` no Git.
