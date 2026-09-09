# Backend — Strapi

[![Strapi](https://img.shields.io/badge/Strapi-4945FF?style=flat&logo=strapi&logoColor=white)](https://strapi.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=flat&logo=googlecloud&logoColor=white)](https://cloud.google.com)

**English** · [Bahasa Indonesia](README.id.md)

Strapi backend for the [Fullstack Headless CMS](../README.md) — the Headless CMS layer that owns content management, the REST API, and database access.

> [!NOTE]
> Project-wide context — goal, system architecture, tech stack, environment variables, code quality, and the implementation phases — lives in the [root README](../README.md).

---

## Table of Contents

- [Content Models](#content-models)
- [Content Relationships](#content-relationships)
- [Strapi Admin](#strapi-admin)
- [CORS & Security](#cors--security)
- [Public API access](#public-api-access)
- [Sample content](#sample-content)

---

## Content Models

Create the following Strapi content types.

### 1. Article

`title` · `slug` · `excerpt` · `content` · `coverImage` · `featured` · `publishedAt` · `author` · `category` · `tags` · `seo`

### 2. Author

`name` · `slug` · `avatar` · `bio`

### 3. Category

`name` · `slug` · `description`

### 4. Tag

`name` · `slug`

### 5. SEO Component

Reusable component containing:

`metaTitle` · `metaDescription` · `keywords` · `canonicalURL` · `socialImage`

---

## Content Relationships

Configure proper Strapi relationships.

| Content Type | Relationship |
|---|---|
| **Article** | belongs to one Author<br/>belongs to one Category<br/>can have multiple Tags<br/>contains one SEO component |
| **Author** | can have multiple Articles |
| **Category** | can have multiple Articles |
| **Tag** | can belong to multiple Articles |

```mermaid
erDiagram
    AUTHOR   ||--o{ ARTICLE : writes
    CATEGORY ||--o{ ARTICLE : groups
    ARTICLE  }o--o{ TAG     : "tagged with"
    ARTICLE  ||--|| SEO     : contains
```

Use meaningful relationship names.

---

## Strapi Admin

Use the standard Strapi Admin Panel.

**Administrators should be able to**

- Create articles
- Edit articles
- Delete articles
- Publish/unpublish articles
- Upload images
- Manage authors
- Manage categories
- Manage tags
- Configure SEO metadata

Configure appropriate Strapi roles and permissions.

---

## CORS & Security

Configure Strapi CORS so that production API access is limited appropriately.

```text
Production frontend:  Vercel  ->  Strapi Cloud Run
```

**Follow basic security practices**

- Environment variables for secrets
- Proper Strapi permissions
- Restrict unnecessary public API permissions
- Validate input
- Do not expose credentials
- Do not expose internal error details
- Configure CORS properly
- Keep dependencies updated

---

### Public API access

The content API is **open for reading**. Strapi's Public role is granted `find` and `findOne` on Article, Author, Category and Tag — and nothing else.

| Request | Public role | Result |
|---|---|---|
| `GET /api/articles` | granted | `200` |
| `GET /api/articles/:documentId` | granted | `200` |
| `POST` / `PUT` / `DELETE` on any content type | not granted | `403` |
| `/api/auth/*` (end-user login) | not granted | `403` |

Those grants are applied in [`src/index.ts`](src/index.ts) inside `bootstrap()`, not by ticking boxes in the admin panel.

The reason is that Strapi stores permissions in the **database**, not in files. A permission ticked on a local database never travels with the code — a database that has never run this code would start with none, and every request would fail with `403` in production only, long after the change looked correct locally. Granting them in code keeps the setting version-controlled, reviewable, and identical on every environment.

> [!NOTE]
> Open read means the content API is reachable by anyone who finds its URL. That is not a data leak — the same content is published on the public site — but it does allow scraping, and traffic can wake Cloud Run. To close it, remove the `bootstrap()` grant and give Astro a read-only API token instead. See D3 in [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

---

## Sample content

`scripts/seed.js` fills an empty database so the frontend has something to render.

```bash
npm run seed              # skips if any article already exists
npm run seed -- --reset   # deletes articles, categories and tags first
```

It is idempotent by default: running it twice changes nothing. `--reset` clears articles, categories and tags but **keeps the author and everything in the Media Library**, so uploaded images are never destroyed by a reseed.

The script boots Strapi programmatically through `compileStrapi()` and writes through the Document Service, so draft/published pairs, components and relations are all created the way the admin panel would create them.
