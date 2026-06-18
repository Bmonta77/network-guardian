# Network Guardian

Network Guardian is a Next.js application for monitoring and protecting a network.

## Local development

Requirements:

- Node.js 20.9 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

When environment variables are needed, copy the committed template:

```bash
cp .env.example .env.local
```

Keep secrets in `.env.local`. Add safe placeholder names to `.env.example` so required configuration remains documented.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

Testing will be added with the first feature that has meaningful behavior to verify.
