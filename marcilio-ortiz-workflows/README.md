# Marcilio Ortiz Workflows (Next.js + Supabase + Stripe)

SaaS para catálogo premium de 2.000+ workflows n8n traduzidos para PT-BR.

## Setup

1. Copie `.env.example` para `.env.local` e preencha as variáveis.
2. Execute as migrações no Supabase (SQL em `src/supabase/migrations/0001_init.sql`).
3. Crie produtos/preços no Stripe (BRL) e capture os IDs para os planos.
4. Instale dependências e rode:

```bash
npm install
npm run dev
```

## Scripts ETL
- `npm run sync:github`: importa JSONs da pasta `workflows` e faz upsert.
- `npm run etl:index`: recalcula metadados e texto extraído.
- `npm run etl:translate`: traduz campos para PT-BR (placeholder).

## API
- `POST /api/checkout` → inicia Checkout no Stripe.
- `POST /api/webhooks/stripe` → processa eventos Stripe.
- `GET  /api/search?q=` → busca por palavra-chave.
- `POST /api/sync` → protegido via `CRON_SECRET`.

## Observações
- Habilite RLS e revise políticas de acesso conforme necessário.
- Conteúdo premium deve ser servido apenas para assinantes ativos.