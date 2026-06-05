# GitHub Pages Deployment

## Deployment Target

Homefood Happiness v1 deploys as a static site to GitHub Pages under:

```text
https://preethamsomsole.github.io/homefood-happiness/
```

Because this is a project site, the app must work with the base path `/homefood-happiness`.

## Next.js Static Export Requirements

The implementation should configure Next.js for static export:

```ts
const repoName = 'homefood-happiness'
const isPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  basePath: isPages ? `/${repoName}` : '',
  assetPrefix: isPages ? `/${repoName}/` : '',
}

export default nextConfig
```

Avoid these features in production behavior:

- API routes.
- Server actions.
- Server-side session middleware.
- Dynamic server rendering.
- Prisma or database clients that require a server runtime.

## Recommended Workflow

Future file: `.github/workflows/pages.yml`

```yaml
name: Deploy GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: GITHUB_PAGES=true npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Refresh and Routing

For v1, prefer routes that can be statically exported cleanly. If deep links become unreliable on GitHub Pages, use hash routing or ensure every route has a generated static HTML entry.

Acceptance:

- The app loads at `/homefood-happiness/`.
- Refreshing the app does not produce a GitHub Pages 404.
- Static assets load with the project base path.
- Images use unoptimized mode or static assets compatible with export.

