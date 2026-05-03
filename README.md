# Página Pro — App Nuvemshop

App incorporado para personalização de páginas de produto com blocos dinâmicos.

## Stack

- Next.js 14+ (App Router)
- React + Nimbus Design System + Nexo SDK
- Prisma + PostgreSQL (multi-tenant)
- Metafields para armazenar blocos por produto

## Setup inicial

### 1. Pré-requisitos

- Conta no [Portal de Parceiros Nuvemshop](https://partners.nuvemshop.com.br)
- App criado no Portal com tipo "Incorporado"
- Loja demo para testes
- PostgreSQL disponível (Railway, Supabase, Neon, etc.)
- Node.js 20+

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env.local
# Preencha todas as variáveis
```

Gere a ENCRYPTION_KEY:
```bash
openssl rand -hex 32
```

### 4. Banco de dados

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Configurar Portal de Parceiros

No Portal de Parceiros → seu app → Editar:

**Redirect URL:**
```
https://seuapp.com/api/auth/callback
```

**Escopos necessários:**
```
read_products
write_products
read_metafields
write_metafields
```

**URLs LGPD:**
```
store/redact:           https://seuapp.com/api/webhooks/lgpd/store-redact
customers/redact:       https://seuapp.com/api/webhooks/lgpd/customer-redact
customers/data_request: https://seuapp.com/api/webhooks/lgpd/data-request
```

### 6. Desenvolvimento local

```bash
# Terminal 1 — Next.js
npm run dev

# Terminal 2 — túnel público
ngrok http 3000
```

Copie a URL HTTPS do ngrok e:
1. Atualize a Redirect URL no Portal
2. No admin da loja demo: Modo Desenvolvedor → cole a URL do ngrok

### 7. Instalar na loja demo

Acesse:
```
https://www.tiendanube.com/apps/{seu_client_id}/authorize
```

Isso inicia o fluxo OAuth e redireciona para `/app?onboarding=1`.

## Estrutura do projeto

```
src/
├── app/
│   ├── api/
│   │   ├── auth/callback/     # OAuth callback
│   │   └── webhooks/          # Webhooks + LGPD
│   └── (app)/                 # Interface do app (iframe)
│       ├── layout.tsx          # Nexo connect + ErrorBoundary
│       ├── page.tsx            # Entry point — onboarding ou dashboard
│       └── dashboard/
├── components/
│   ├── shell/AppShell.tsx     # Sidebar + layout
│   └── onboarding/            # Wizard 3 passos
├── lib/
│   ├── nuvemshop/             # API client, OAuth, Webhooks
│   ├── nexo/                  # Instância Nexo
│   ├── crypto.ts              # AES-256-GCM
│   └── prisma.ts              # Singleton
└── types/index.ts             # Tipos do domínio (Block, Template, etc.)
```

## Sprints planejados

- [x] **Sprint 1** — Shell + OAuth + LGPD + Onboarding
- [ ] **Sprint 2** — Editor de template com drag & drop
- [ ] **Sprint 3** — Aplicação em produtos (manual, bulk, regras)
- [ ] **Sprint 4** — Dashboard de analytics
