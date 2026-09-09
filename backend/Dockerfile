# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Image produksi Strapi.
#
# Base: node:22-slim (Debian), bukan Alpine. Strapi bergantung pada `sharp`
# untuk pemrosesan gambar, dan binary prebuilt-nya disediakan untuk glibc.
# Di musl milik Alpine, sharp umumnya harus dikompilasi dari source — menyeret
# toolchain build dan membuat proses rapuh. Selisih ~40 MB tidak sepadan.
#
# Dibangun oleh Cloud Build, bukan di mesin developer:
#   gcloud run deploy strapi-cms --source backend --region asia-southeast2
# ---------------------------------------------------------------------------

# ----------------------------- tahap builder -------------------------------
FROM node:22-slim AS builder

WORKDIR /app

# Dependensi disalin lebih dulu supaya layer npm ci ikut ter-cache selama
# package-lock.json tidak berubah.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# `strapi build` mengompilasi TypeScript ke dist/ dan membangun admin panel
# React dengan Vite ke dist/build. Diverifikasi: tahap ini tidak membaca satu
# pun environment variable, jadi tidak ada secret yang perlu hadir saat build.
RUN NODE_ENV=production npm run build

# ------------------------------ tahap runner -------------------------------
FROM node:22-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

# Hanya dependensi runtime. Toolchain build admin panel tidak ikut terbawa —
# itulah alasan utama multi-stage di sini.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/database ./database
COPY --from=builder /app/favicon.png ./favicon.png

# Jalan sebagai non-root. Image node menyediakan user `node`.
RUN chown -R node:node /app
USER node

# Cloud Run menyuntikkan PORT sendiri dan config/server.ts membacanya
# (`env.int('PORT', 1337)`). Baris ini dokumentasi untuk pemakaian lokal.
EXPOSE 1337

CMD ["npm", "run", "start"]
