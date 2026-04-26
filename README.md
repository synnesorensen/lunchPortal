# newLunchApp

Monorepo: **common** (shared types), **server** (TypeScript Lambdas), **infrastructure** (Terraform), **client** (React + Vite + Tailwind + shadcn).

## Security

- **Never commit `.env`.** If AWS access keys were ever committed or shared, **rotate them** in IAM immediately and use **AWS SSO** or short-lived credentials where possible.

## Prerequisites

- Node 22 (Volta optional)
- Terraform >= 1.5
- AWS credentials with rights to create DynamoDB, Lambda, IAM, API Gateway (for `terraform apply`)

## First-time setup

```bash
npm install
npm run build:server
cd infrastructure && terraform init && terraform apply
```

After apply, copy `api_base_url` from Terraform output into `client/.env` as `VITE_API_URL` (or use a `.env.local` in `client/`).

### Cognito + `GET /me`

1. In `infrastructure/terraform.tfvars` (or workspace vars), set **`cognito_user_pool_id`** and **`cognito_app_client_id`** for your **existing** pool and a **public** app client (no secret, SRP / username-password allowed for dev).
2. `terraform apply` — creates JWT authorizer, **`GET /me`** Lambda, and route (skipped if either id is empty).
3. Match the same ids in `client/.env` as `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID` (see `client/.env.example`).
4. Open **Sign in** — browser uses SRP, then calls `/me` with **`Id` token** in `Authorization: Bearer …`.

```bash
cd client && npm run dev
```

Open the app; home calls `GET /health`. After Cognito env is set, **Sign in** exercises `GET /me`.

## Terraform state

Default backend is **local** (`infrastructure/terraform.tfstate`). For teams, configure a remote S3 backend (see `infrastructure/backend.tf.example`).

Commit **`infrastructure/.terraform.lock.hcl`** so provider versions stay reproducible. Do not commit **`infrastructure/.terraform/`** (ignored via root `.gitignore`).

## Workspaces

| Package    | Role                          |
|-----------|--------------------------------|
| `common`  | Shared types (`Nok`, entities)|
| `server`  | Lambda bundles (`dist/`)      |

## DynamoDB single-table probe

Lambdas use env **`DYNAMODB_TABLE_NAME`**. The **`dbPing`** Lambda exposes:

- **`GET /db/ping`** — `GetItem` on `pk = SYSTEM`, `sk = PING` (returns `null` until first POST).
- **`POST /db/ping`** — `PutItem` with `updatedAt` and optional JSON body `{ "note": "..." }` (max 500 chars).

Shared IAM policy **`…-lambda-dynamodb-main`** is attached to **health**, **me** (when deployed), and **dbPing** roles for the main table ARN and `index/*`.
| `client`  | Vite SPA                       |
