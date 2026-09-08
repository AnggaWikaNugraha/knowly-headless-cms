/**
 * Mengisi konten contoh supaya frontend punya data untuk dirender.
 *
 * Idempoten: kalau sudah ada artikel, script berhenti tanpa mengubah apa pun.
 * Jalankan dengan: npm run seed
 */
const { compileStrapi, createStrapi } = require('@strapi/strapi');

const AUTHOR = {
  name: 'Angga Wika Nugraha',
  slug: 'angga-wika-nugraha',
  bio: 'Full-Stack Developer. Menulis tentang arsitektur web, performa, dan hal-hal yang biasanya baru terasa saat deploy.',
};

const CATEGORIES = [
  { name: 'Arsitektur', slug: 'arsitektur', description: 'Keputusan struktural dan alasan di baliknya.' },
  { name: 'Engineering', slug: 'engineering', description: 'Catatan implementasi dari kode yang benar-benar jalan.' },
  { name: 'Performa', slug: 'performa', description: 'Kecepatan, ukuran bundle, dan hal yang dirasakan pengunjung.' },
];

const TAGS = [
  { name: 'Astro', slug: 'astro' },
  { name: 'Strapi', slug: 'strapi' },
  { name: 'SEO', slug: 'seo' },
  { name: 'TypeScript', slug: 'typescript' },
  { name: 'PostgreSQL', slug: 'postgresql' },
];

const ARTICLES = [
  {
    title: 'Memahami Islands Architecture di Astro',
    slug: 'memahami-islands-architecture-di-astro',
    category: 'engineering',
    tags: ['astro', 'typescript'],
    featured: true,
    excerpt: 'Astro merender halaman jadi HTML di server, lalu menghidupkan hanya bagian yang benar-benar butuh interaksi. Sisanya tidak mengirim JavaScript sama sekali.',
    content: `## Halaman sebagai lautan HTML

Di Astro, sebuah halaman pada dasarnya HTML statis. Komponen \`.astro\` dijalankan sekali di server, menghasilkan markup jadi, lalu kodenya tidak ikut terkirim ke browser.

Yang membuatnya berbeda dari static site generator biasa adalah **island**: potongan kecil yang boleh hidup.

## Kapan sebuah island dibenarkan

Satu pertanyaan sudah cukup:

> Apakah ada yang harus berubah di layar tanpa berpindah halaman?

Kotak pencarian yang hasilnya berubah saat diketik — ya. Pagination yang cukup dengan \`<a href>\` — tidak. Godaan terbesar justru pada komponen yang *terlihat* interaktif padahal sebenarnya cuma tautan.

## Directive menentukan biayanya

\`\`\`astro
<SearchBox />                 <!-- HTML mati, 0 kB JS -->
<SearchBox client:visible />  <!-- hidup, JS dimuat saat terlihat -->
\`\`\`

Yang mengirim JavaScript adalah directive-nya, bukan ekstensi filenya. Komponen React tanpa \`client:*\` tetap dirender jadi HTML statis dan tidak menambah satu byte pun.`,
    seo: {
      metaTitle: 'Memahami Islands Architecture di Astro',
      metaDescription: 'Bagaimana Astro merender HTML di server dan hanya menghidupkan bagian yang butuh interaksi, sehingga halaman konten tidak mengirim JavaScript.',
      keywords: 'astro, islands architecture, hydration, performa web',
    },
  },
  {
    title: 'Kenapa Headless CMS, Bukan WordPress',
    slug: 'kenapa-headless-cms-bukan-wordpress',
    category: 'arsitektur',
    tags: ['strapi', 'astro'],
    featured: true,
    excerpt: 'WordPress punya frontend sendiri dan kamu boleh memilih tidak memakainya. Headless CMS bahkan tidak punya pilihan itu — dan justru di situ keuntungannya.',
    content: `## Perbedaan yang sering disalahpahami

WordPress adalah CMS terkopel: dia punya theme, template, dan bisa membangun situs utuh sendirian. Strapi tidak punya lapisan itu sama sekali.

Jadi "tidak memakai frontend Strapi" bukan keputusan — memang tidak ada yang bisa dipakai.

## Yang didapat dari pemisahan

Backend berhenti di JSON. Dia tidak tahu situsmu berwarna apa, berapa halamannya, atau apakah pengunjungnya browser atau aplikasi mobile.

Konsekuensinya: mengganti seluruh frontend tidak menyentuh backend sedikit pun.

## Harganya

Dua aplikasi untuk dijalankan, dua tempat untuk dideploy, dan satu lapisan API yang harus dirawat. Untuk blog pribadi lima halaman, ini berlebihan. Untuk sistem yang frontend-nya mungkin berubah, ini murah.`,
    seo: {
      metaTitle: 'Kenapa Headless CMS, Bukan WordPress',
      metaDescription: 'Perbedaan CMS terkopel dan headless, apa yang didapat dari memisahkan backend dari tampilan, dan kapan pemisahan itu tidak sepadan.',
      keywords: 'headless cms, strapi, wordpress, arsitektur',
    },
  },
  {
    title: 'SSG dan SSR: Kapan Memilih yang Mana',
    slug: 'ssg-dan-ssr-kapan-memilih-yang-mana',
    category: 'performa',
    tags: ['astro', 'seo'],
    featured: false,
    excerpt: 'Keduanya mengirim HTML lengkap ke browser. Yang membedakan cuma satu hal: kapan HTML itu dibuat.',
    content: `## Bedanya satu hal saja

**SSG** membuat HTML sekali, saat build. Semua pengunjung menerima file yang sama.

**SSR** membuatnya tiap kali diminta. Selalu terbaru, tapi setiap kunjungan menuntut kerja server.

Keduanya mengirim HTML utuh — itu yang memisahkan keduanya dari client-side rendering.

## Aturan memilihnya

> Bisa ditentukan saat build → SSG. Baru diketahui saat request → SSR.

"Baru diketahui saat request" artinya query parameter, cookie, siapa yang login, atau jam berapa sekarang. Halaman pencarian jelas masuk kategori itu: tidak mungkin mem-build halaman untuk semua kemungkinan kata kunci.

## Yang tidak langsung terlihat

Kalau halaman konten sudah statis, backend praktis menganggur. Dia hanya dihubungi saat build. Itu berarti server bisa turun ke nol instance, dan biayanya ikut turun.

Harganya: menerbitkan artikel tidak langsung tayang — harus menunggu build berikutnya.`,
    seo: {
      metaTitle: 'SSG dan SSR: Kapan Memilih yang Mana',
      metaDescription: 'Perbedaan static site generation dan server-side rendering, aturan sederhana untuk memilih, dan konsekuensi biaya yang jarang dibahas.',
      keywords: 'ssg, ssr, rendering, astro, performa',
    },
  },
  {
    title: 'Menghubungkan Astro ke Strapi lewat REST API',
    slug: 'menghubungkan-astro-ke-strapi-lewat-rest-api',
    category: 'engineering',
    tags: ['astro', 'strapi', 'typescript'],
    featured: false,
    excerpt: 'Satu service layer, satu tempat memanggil fetch, dan komponen yang tidak perlu tahu bentuk respons Strapi.',
    content: `## Jangan sebar fetch

Godaan pertama saat menyambungkan CMS adalah memanggil \`fetch()\` langsung di komponen yang membutuhkannya. Itu terasa cepat, sampai bentuk respons berubah dan kamu harus mencarinya di dua belas tempat.

Semua panggilan lewat satu lapisan:

\`\`\`text
src/services/strapi/
├── client.ts        satu-satunya fetch() di seluruh codebase
├── articles.ts
├── categories.ts
└── tags.ts
\`\`\`

## Yang dipegang client

Base URL dari environment, penyusunan query string, timeout lewat \`AbortSignal\`, pemetaan respons non-2xx menjadi error bertipe, dan normalisasi envelope \`data\`/\`meta\`.

Setelah itu komponen cukup menerima objek biasa.

## Populate secukupnya

\`populate=*\` menarik semua relasi dan semua ukuran gambar pada setiap request. Halaman daftar biasanya cuma butuh gambar sampul, nama penulis, dan slug kategori.

Tiap fungsi mendeklarasikan populate-nya sendiri.`,
    seo: {
      metaTitle: 'Menghubungkan Astro ke Strapi lewat REST API',
      metaDescription: 'Menyusun service layer yang rapi untuk Strapi REST API di Astro, dan kenapa populate harus selalu eksplisit.',
      keywords: 'astro, strapi, rest api, service layer',
    },
  },
  {
    title: 'Nol Kilobyte JavaScript, dan Cara Membuktikannya',
    slug: 'nol-kilobyte-javascript-dan-cara-membuktikannya',
    category: 'performa',
    tags: ['astro', 'seo', 'postgresql'],
    featured: false,
    excerpt: 'Klaim "tanpa JavaScript" gampang diucapkan. Lebih baik dibuka HTML hasil build-nya dan dihitung sendiri.',
    content: `## Jangan percaya, periksa

Setelah build, buka file HTML yang dihasilkan dan cari tag \`<script>\`. Kalau tidak ada, klaimnya benar.

\`\`\`html
<head><link rel="stylesheet" href="/_astro/index.css"></head>
<body><h1>Judul artikel</h1></body>
\`\`\`

Tidak ada script sama sekali. Framework memang ikut dikompilasi ke folder aset, tapi tidak ada halaman yang memuatnya selama tidak ada island di sana.

## Kenapa ini berpengaruh

Pengunjung dengan jaringan lambat melihat teks begitu HTML sampai, bukan setelah menunggu bundle diunduh dan dieksekusi.

Crawler pun begitu. Bot preview tautan di aplikasi pesan umumnya tidak menjalankan JavaScript sama sekali — halaman yang bergantung padanya tampil kosong saat dibagikan.

## Batasnya

Nol kilobyte hanya berlaku untuk halaman tanpa island. Halaman pencarian tetap membawa runtime framework-nya, dan itu memang harga yang dibayar untuk interaksi.`,
    seo: {
      metaTitle: 'Nol Kilobyte JavaScript, dan Cara Membuktikannya',
      metaDescription: 'Cara memverifikasi klaim nol JavaScript dari HTML hasil build, kenapa itu penting untuk SEO dan jaringan lambat, serta batasnya.',
      keywords: 'performa web, javascript, astro, core web vitals',
    },
  },
];

async function seed(strapi) {
  const existing = await strapi.documents('api::article.article').count();
  if (existing > 0) {
    strapi.log.info(`[seed] Sudah ada ${existing} artikel — dilewati, tidak ada yang diubah.`);
    return;
  }

  const author = await strapi.documents('api::author.author').create({ data: AUTHOR });
  strapi.log.info(`[seed] Author: ${author.name}`);

  const categoryBySlug = {};
  for (const c of CATEGORIES) {
    categoryBySlug[c.slug] = await strapi.documents('api::category.category').create({ data: c });
  }
  strapi.log.info(`[seed] Kategori: ${CATEGORIES.length}`);

  const tagBySlug = {};
  for (const t of TAGS) {
    tagBySlug[t.slug] = await strapi.documents('api::tag.tag').create({ data: t });
  }
  strapi.log.info(`[seed] Tag: ${TAGS.length}`);

  for (const a of ARTICLES) {
    await strapi.documents('api::article.article').create({
      status: 'published',
      data: {
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        content: a.content,
        featured: a.featured,
        author: author.documentId,
        category: categoryBySlug[a.category].documentId,
        tags: a.tags.map((s) => tagBySlug[s].documentId),
        seo: a.seo,
      },
    });
    strapi.log.info(`[seed] Artikel: ${a.title}`);
  }

  strapi.log.info('[seed] Selesai.');
}

(async () => {
  const context = await compileStrapi();
  const app = await createStrapi(context).load();
  try {
    await seed(app);
  } finally {
    // Penutupan connection pool kadang melempar "aborted" pada koneksi yang
    // sudah tidak dipakai. Seluruh penulisan sudah selesai di titik ini, jadi
    // error saat teardown tidak boleh membuat exit code jadi gagal.
    await app.destroy().catch(() => {});
  }
})().catch((err) => {
  console.error('[seed] GAGAL:', err.message);
  process.exit(1);
});
