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

```bash
cd client && npm run dev
```

Open the app; it calls `GET /health` on the API.

## Terraform state

Default backend is **local** (`infrastructure/terraform.tfstate`). For teams, configure a remote S3 backend (see `infrastructure/backend.tf.example`).

## Workspaces

| Package    | Role                          |
|-----------|--------------------------------|
| `common`  | Shared types (`Nok`, entities)|
| `server`  | Lambda bundles (`dist/`)      |
| `client`  | Vite SPA                       |
