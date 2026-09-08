# Frontend — Astro

[![Astro](https://img.shields.io/badge/Astro-BC52EE?style=flat&logo=astro&logoColor=white)](https://astro.build)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vue](https://img.shields.io/badge/Vue-4FC08D?style=flat&logo=vuedotjs&logoColor=white)](https://vuejs.org)
[![Svelte](https://img.shields.io/badge/Svelte-FF3E00?style=flat&logo=svelte&logoColor=white)](https://svelte.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com)

[English](README.md) · **Bahasa Indonesia**

Frontend Astro untuk [Fullstack Headless CMS](../README.id.md) — situs publik yang mengonsumsi konten terbit dari Strapi melalui REST API.

> [!NOTE]
> Konteks lintas-modul — tujuan, arsitektur sistem, tech stack, environment variable, kualitas kode, dan fase implementasi — ada di [README root](../README.id.md).

---

## Daftar Isi

- [Arsitektur: Astro vs UI Framework](#arsitektur-astro-vs-ui-framework)
- [Routing](#routing)
- [Tema](#tema)
- [Fitur Utama](#fitur-utama)
- [SEO](#seo)
- [Penanganan Error](#penanganan-error)

---

## Arsitektur: Astro vs UI Framework

Frontend ini adalah aplikasi **Astro** — bukan React SPA, bukan Next.js. React, Vue, dan Svelte hanyalah integrasi yang dimuat Astro untuk segelintir komponen yang memang butuh interaktivitas di browser.

Jadi `components/astro/` dan folder framework di sebelahnya bukan pilihan setara, melainkan **default dan pengecualian**.

### Siapa memegang apa

`.astro` itu **bukan** React. Astro punya bahasa komponennya sendiri; UI framework baru masuk saat kamu membuat file `.tsx`, `.vue`, atau `.svelte`.

Astro memegang lapisan framework — routing berbasis file dari `src/pages/`, proses build (Vite di dalamnya), server rendering, dan mekanisme island itu sendiri. React, Vue, dan Svelte tidak memegang apa pun kecuali komponen interaktif yang secara eksplisit kamu serahkan pada mereka.

```mermaid
flowchart TD
    A["<b>Astro</b> — framework-nya<br/>routing · build · SSR · islands"]
    S{"slot island"}
    R["<b>React</b><br/>/search"]
    V["<b>Vue</b><br/>/articles"]
    SV["<b>Svelte</b><br/>/"]
    SO["Solid · Preact<br/><i>tidak dipakai</i>"]

    A --> S
    S --> R
    S --> V
    S --> SV
    S -.-> SO
```

Slot itulah yang membedakan Astro dari meta-framework lain:

| Meta-framework | Terikat ke |
|---|---|
| Next.js | React saja |
| Nuxt | Vue saja |
| SvelteKit | Svelte saja |
| **Astro** | bebas — bahkan beberapa sekaligus |

Jadi hanya Astro yang benar-benar menopang arsitektur:

| Teknologi | Perannya | Bisa diganti? |
|---|---|---|
| **Astro** | Framework — routing, build, SSR, islands | Tidak — dia *adalah* arsitekturnya |
| **React / Vue / Svelte** | Library UI untuk island interaktif | Bisa — mana pun, atau tidak sama sekali |
| **TypeScript** | Bahasa, di `.astro` maupun komponen framework | — |
| **Tailwind** | Styling | Bisa |

### Satu framework per halaman

Tiga framework ini pilihan yang disengaja: keduanya mendemonstrasikan bahwa island Astro bersifat framework-agnostic. Demonstrasi itu baru layak dilakukan kalau tidak membebani pengunjung sama sekali.

> [!WARNING]
> Tiap framework mengirim runtime-nya **sendiri**, dan tidak ada yang dipakai bersama. Dua framework dalam satu halaman berarti pengunjung mengunduh keduanya. Island dari framework berbeda tidak boleh muncul di halaman yang sama.

| Halaman | Island | Framework | JS terkirim |
|---|---|---|---|
| `/` | Penjelajah topik populer | Svelte | Svelte saja |
| `/articles` | Filter kategori & tag | Vue | Vue saja |
| `/search` | Kotak pencarian + hasil langsung | React | React saja |
| `/articles/[slug]` | — | — | **0 kB** |
| `/categories/[slug]` | — | — | **0 kB** |
| `/tags/[slug]` | — | — | **0 kB** |
| `/authors/[slug]` | — | — | **0 kB** |

> [!CAUTION]
> Waspadai **island global**. Apa pun yang ada di header atau footer bersama — misalnya tombol navigasi mobile — akan muncul di semua halaman dan bertabrakan dengan ketiga framework sekaligus. Bangun interaktivitas di layout bersama sebagai komponen `.astro` dengan JavaScript biasa.

### Perbedaannya

| | `components/astro/*.astro` | komponen framework |
|---|---|---|
| Dirender | Hanya di server | Di server, lalu dihidupkan lagi di browser |
| JavaScript terkirim | **0 kB** | Runtime framework + kode komponen |
| State lokal / event handler | Tidak tersedia | Tersedia |
| Dipakai untuk | Menampilkan konten | Merespons aksi pengguna |

Komponen `.astro` adalah cetakan HTML. Dia jalan sekali di server, menghasilkan HTML jadi, dan kodenya sendiri tidak pernah sampai ke browser — persis itulah sebabnya dia tidak bisa punya state atau event handler.

### Komponen mana ditaruh di mana

```text
components/
├── astro/                    # mayoritas ada di sini
│   ├── BaseHead.astro        # meta tag SEO
│   ├── Header.astro
│   ├── ArticleCard.astro     # judul, gambar, excerpt, link
│   ├── AuthorBox.astro
│   ├── TagList.astro         # link biasa
│   ├── Pagination.astro      # <a href="/articles/2">, bukan tombol
│   └── EmptyState.astro
│
├── react/
│   └── SearchBox.tsx         # /search — user mengetik, hasil berubah langsung
│
├── vue/
│   └── ArticleFilter.vue     # /articles — pilih kategori, daftar menyempit
│
└── svelte/
    └── TopicExplorer.svelte  # / — menjelajah topik populer
```

Perhatikan `Pagination.astro`. Pagination cukup `<a href="/articles/2">` — link asli bisa di-crawl dan bisa dibuka di tab baru, jadi memakai framework justru memperburuk, bukan memperbaiki.

`SearchBox.tsx` adalah kasus sebaliknya: hasil harus berubah saat pengguna mengetik, tanpa reload halaman. Itu mustahil tanpa JavaScript di browser, jadi framework di sini memang beralasan.

### Cara keduanya bertemu

```astro
---
// src/pages/search.astro — frontmatter ini jalan di SERVER
import Layout from '../layouts/BaseLayout.astro';
import ArticleCard from '../components/astro/ArticleCard.astro';
import SearchBox from '../components/react/SearchBox.tsx';
import { getArticles } from '../services/strapi/articles';

const articles = await getArticles();   // hit Strapi dari server, bukan dari browser
---

<Layout title="Pencarian">
  <SearchBox client:visible />

  {articles.map((a) => <ArticleCard article={a} />)}
</Layout>
```

### Hydration, bukan client rendering

Komponen framework di sini **tidak** dirender dari nol di browser:

1. Astro merender komponen itu menjadi HTML jadi **di server**
2. HTML tersebut sampai ke browser dalam keadaan lengkap dan terlihat
3. Baru jika ada directive `client:*`, JavaScript-nya menyusul dan menghidupkannya

Jadi `<SearchBox client:visible />` sudah ada di HTML source sebelum JavaScript apa pun termuat — crawler dan pengguna langsung melihatnya. SPA yang benar-benar client-rendered justru mengirim `<div id="root"></div>` kosong, dan itulah yang merusak SEO.

> [!IMPORTANT]
> Komponen framework **tanpa** directive `client:*` tetap dirender jadi HTML statis dan **tidak** mengirim JavaScript sama sekali. Yang mengirim JavaScript adalah directive-nya, bukan ekstensi filenya.
>
> ```astro
> <SearchBox />                 <!-- HTML mati, 0 kB JS -->
> <SearchBox client:visible />  <!-- interaktif, JS dimuat saat masuk viewport -->
> ```

Tiap island adalah root yang berdiri sendiri dengan lifecycle-nya masing-masing. Hidrasinya terpisah dan secara default tidak berbagi state — dan antar framework berbeda, sama sekali tidak bisa berbagi state.

Untuk memilih antara `client:load`, `client:idle`, dan `client:visible`, lihat [Islands](../README.id.md#islands) di README root.

### Aturannya

Sebelum membuat komponen, tanyakan satu hal:

> Apakah ada yang harus berubah di layar tanpa berpindah halaman?

**Tidak → `.astro`. Ya → komponen framework, memakai framework yang sudah dipegang halaman itu.**

Perkiraannya sekitar selusin komponen Astro berbanding tiga komponen framework. Halaman detail artikel, kategori, tag, dan author seharusnya mengirim **0 kB JavaScript**.

## Routing

| File | URL | Dihasilkan dari |
|---|---|---|
| `pages/index.astro` | `/` | — |
| `pages/articles/index.astro` | `/articles` | halaman 1 daftar |
| `pages/articles/page/[page].astro` | `/articles/page/2`, … | halaman 2 ke atas |
| `pages/articles/[slug].astro` | `/articles/<slug>` | setiap slug artikel |
| `pages/categories/[slug].astro` | `/categories/<slug>` | setiap kategori |
| `pages/tags/[slug].astro` | `/tags/<slug>` | setiap tag |
| `pages/authors/[slug].astro` | `/authors/<slug>` | setiap author |
| `pages/404.astro` | `/404` | — |

Selain `/` dan `/404`, semuanya dihasilkan dari Strapi saat build — jadi jumlah halaman mengikuti isi konten.

> [!WARNING]
> **Pagination sengaja ditaruh di `/articles/page/`, bukan `/articles/[...page]`.**
>
> Rest route (`[...page].astro`) yang berada satu direktori dengan `[slug].astro` akan mengklaim seluruh wilayah `/articles/*`, termasuk slug artikel. Build statis menyembunyikan masalah ini — kedua path digenerate eksplisit dan tidak pernah berebut — tapi dev server mencocokkan route secara dinamis, dan di sana rest route yang menang. Gejalanya: setiap halaman detail artikel 404 di `npm run dev`, padahal `npm run build` menghasilkan halaman-halaman itu tanpa keluhan.
>
> Memisahkan keduanya ke direktori berbeda menghapus ambiguitasnya sama sekali.

---

## Tema

Situs ini adalah bagian blog dari portofolio Next.js yang sudah ada, jadi temanya disamakan dengan portofolio, bukan dirancang sendiri.

| Token | Nilai |
|---|---|
| Latar | `#030712` (gray-950) |
| Teks | `#f9fafb` (gray-50) |
| Font | Geist Variable / Geist Mono Variable, self-hosted |
| Kartu | `bg-gray-900`, `border-gray-700`, `rounded-lg` |
| Area konten | gradien `from-gray-900 to-gray-800` |

> [!IMPORTANT]
> Situs ini **dark-only**. Tidak ada varian `dark:` di mana pun, dan menambahkannya justru merusak keselarasan — portofolio tidak punya mode terang untuk disamakan.

Font di-*self-host* lewat `@fontsource-variable/geist`, bukan diambil dari Google Fonts, supaya tidak ada permintaan pihak ketiga yang memblokir render sebelum tampilan pertama muncul.

Tipografi artikel (`.prose-knowly` di `src/styles/global.css`) ditulis tangan alih-alih memakai `@tailwindcss/typography`. Yang butuh gaya hanya heading, list, blockquote, kode, dan gambar — tidak sepadan dengan satu dependensi lagi, mengikuti aturan minimal dependencies proyek ini.

---

## Fitur Utama

### Website Publik

<table>
<tr><td valign="top">

**Homepage**

- Hero section
- Featured articles
- Latest articles
- Kategori
- Topik populer

</td><td valign="top">

**Daftar Artikel**

- Article card
- Pagination
- Filter kategori
- Filter tag
- Search

</td><td valign="top">

**Detail Artikel**

- Judul
- Cover image
- Author
- Tanggal publikasi
- Kategori
- Tag
- Isi artikel
- Artikel terkait
- Metadata SEO

</td></tr>
<tr><td valign="top">

**Halaman Kategori**

- Informasi kategori
- Artikel yang termasuk dalam kategori tersebut

</td><td valign="top">

**Halaman Tag**

- Artikel yang terkait dengan tag tersebut

</td><td valign="top">

**Halaman Author**

- Informasi author
- Artikel milik author tersebut

</td></tr>
<tr><td valign="top" colspan="3">

**Search**

- Pencarian artikel
- Empty state
- Error state

</td></tr>
</table>

---

## SEO

Buat penanganan SEO Astro yang reusable.

**Dukung**

- Page title
- Meta description
- Canonical URL
- Open Graph title
- Open Graph description
- Open Graph image
- Metadata artikel

Hasilkan metadata dari komponen SEO milik Strapi.

Setiap halaman artikel harus memiliki metadata yang unik.

---

## Penanganan Error

Terapkan penanganan yang benar untuk:

- Strapi API tidak tersedia
- Network error
- Artikel tidak ditemukan
- Slug tidak valid
- Daftar artikel kosong
- Hasil pencarian kosong
- Gambar tidak tersedia
- Response API yang tidak terduga

**Buat**

- Halaman 404
- Error state yang ramah pengguna
- Komponen empty state

> [!CAUTION]
> Jangan menampilkan internal server error kepada pengguna.
