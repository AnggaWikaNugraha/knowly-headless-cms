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
];

const TAGS = [
  { name: 'Microfrontend', slug: 'microfrontend' },
  { name: 'Module Federation', slug: 'module-federation' },
  { name: 'Next.js', slug: 'nextjs' },
  { name: 'React', slug: 'react' },
  { name: 'TypeScript', slug: 'typescript' },
];

const ARTICLE_MICROFRONTEND = "## Kenapa satu frontend akhirnya terasa sesak\n\nAplikasi frontend yang tumbuh bersama produknya cepat atau lambat sampai di titik yang sama: satu repositori, belasan area fitur, dan satu pipeline build yang harus dilewati semua orang.\n\nGejalanya khas. Build makin lama sampai terasa di setiap perubahan kecil. Tim yang menggarap area berbeda saling menunggu di antrean rilis. Menaikkan versi satu library berarti menguji ulang seluruh aplikasi, jadi upgrade ditunda, lalu menumpuk.\n\nMicrofrontend menjawab persoalan itu dengan cara yang sederhana diucapkan tapi tidak sederhana dijalankan: **pecah aplikasinya, lalu satukan lagi di browser saat runtime.**\n\n## Host dan remote\n\nModule Federation punya dua peran.\n\n**Remote** adalah aplikasi yang menerbitkan sebagian dirinya untuk dipakai orang lain. **Host** adalah aplikasi yang memuat bagian itu saat dijalankan.\n\n```js\n// di sisi remote — mengumumkan apa yang boleh dipakai\nexposes: {\n  './base': './containers/reports/index.tsx',\n  './globals': './styles/global.exposes.ts',\n}\n\n// di sisi host — menyatakan dari mana mengambilnya\nremotes: {\n  designSystem: 'designSystem@https://…/remoteEntry.js',\n}\n```\n\nYang jarang disebut: **satu aplikasi bisa menjadi keduanya sekaligus.** Modul fitur mengekspos dirinya untuk dipasang di shell, sekaligus mengonsumsi design system sebagai remote. Yang terbentuk bukan pohon host-remote yang rapi, melainkan jaring.\n\nKonsekuensinya perlu disadari sejak awal: begitu topologinya jadi jaring, tidak ada lagi satu tempat yang tahu keseluruhan sistem. Diagram arsitektur berhenti jadi dokumen dan mulai jadi kebutuhan.\n\n## Yang sebaiknya diekspos\n\nGodaan pertama adalah mengekspos banyak hal — komponen ini, util itu, hook satu lagi. Setiap yang diekspos adalah kontrak publik, dan setiap kontrak publik harus dijaga kompatibilitasnya.\n\nYang bertahan baik biasanya berbentuk satu pintu masuk per modul:\n\n```js\nexposes: {\n  './base': './containers/laporan/index.tsx',\n}\n```\n\nSatu komponen container, satu tanggung jawab. Isinya boleh berubah bebas selama bentuk pintunya tetap. Semakin sedikit yang diekspos, semakin longgar keterikatannya.\n\n## Shared dependency: bagian yang paling sering salah\n\nIni sumber bug paling membingungkan di microfrontend.\n\nKalau host dan remote sama-sama membawa React sendiri, browser memuat **dua salinan React**. Hook langsung rusak dengan pesan yang tidak menunjuk ke akar masalahnya — biasanya \"invalid hook call\", yang membuat orang mencari-cari di komponennya padahal masalahnya di konfigurasi build.\n\nKarena itu React wajib singleton:\n\n```js\nshared: {\n  react: { singleton: true, requiredVersion: false },\n  'react-dom': { singleton: true, requiredVersion: false },\n  i18next: { singleton: true, requiredVersion: false },\n  'react-i18next': { singleton: true, requiredVersion: false },\n}\n```\n\nAturan praktisnya: **apa pun yang menyimpan state global harus singleton.** React dan React DOM karena hook-nya. Library i18n karena instance bahasanya. Provider autentikasi karena sesinya. Router karena riwayat navigasinya.\n\nLibrary tanpa state — pemformat tanggal, util validasi — tidak masalah punya dua salinan. Boros beberapa kilobyte, tapi tidak merusak apa pun.\n\n## `requiredVersion: false`, dan apa yang sebenarnya ditukar\n\nIni setelan yang perlu dipahami betul sebelum dipakai.\n\nSecara default, Module Federation memeriksa apakah versi dependensi bersama itu cocok, dan memperingatkan kalau tidak. Menyetel `requiredVersion: false` **mematikan pemeriksaan itu**.\n\nDampaknya nyata: build berhenti rewel, dan tiap modul bisa naik versi mengikuti jadwalnya sendiri tanpa memblokir yang lain. Untuk banyak tim yang berjalan paralel, itu bukan kemewahan — itu syarat supaya rilis tidak saling mengunci.\n\nTapi yang ditukar juga nyata. Ketidakcocokan versi tidak hilang, cuma **pindah dari waktu build ke waktu runtime**. Kalau satu modul mengandalkan API yang belum ada di versi yang akhirnya dimuat, kegagalannya baru muncul di browser pengguna, dan pesannya tidak akan menyebut soal versi.\n\nSetelan ini masuk akal saat versi dependensi bersama benar-benar dijaga selaras lewat cara lain — konvensi tim, dependabot terpusat, atau paket internal yang mengunci versinya. Tanpa itu, yang terjadi adalah menunda masalah, bukan menyelesaikannya.\n\n## Berbagi tipe antar microfrontend\n\nBagian yang menurut saya paling kurang dibicarakan.\n\nModul remote dimuat saat runtime, jadi TypeScript tidak punya cara alami mengetahui bentuknya saat kompilasi. Tanpa penanganan khusus, impor lintas microfrontend berakhir sebagai `any` — dan seluruh keuntungan TypeScript hilang persis di batas yang paling rawan.\n\nModule Federation versi baru bisa menerbitkan berkas deklarasi tipe bersama bundle-nya, lalu host mengunduhnya:\n\n```js\ndts: {\n  consumeTypes: {\n    consumeAPITypes: true,\n    remoteTypeUrls: {\n      designSystem: {\n        api: 'https://…/static/@mf-types.d.ts',\n        zip: 'https://…/static/@mf-types.zip',\n      },\n    },\n  },\n}\n```\n\nHasilnya, mengubah props sebuah komponen di design system langsung memunculkan error di modul yang memakainya — sebelum di-deploy, bukan setelah.\n\nAda harganya: tipe itu diambil lewat jaringan saat build, jadi remote yang sedang mati membuat build lokal ikut terganggu. Perlu ada jalur cadangan agar developer tidak terblokir.\n\n## Yang jarang disebut brosur\n\n**Debugging melintasi batas aplikasi.** Stack trace berhenti di tepi bundle remote. Source map harus benar di setiap aplikasi, kalau tidak yang terlihat cuma kode terminifikasi.\n\n**Versi yang menyimpang diam-diam.** Dua modul bisa berjalan berbulan-bulan dengan versi library berbeda tanpa gejala, sampai satu perilaku halus berubah dan tidak ada yang menghubungkannya dengan versi.\n\n**Batas jaringan.** Tiap remote adalah permintaan HTTP tambahan. Terlalu banyak modul kecil dan waktu muat justru memburuk dibanding monolit yang ditinggalkan.\n\n**Duplikasi CSS.** Kalau tiap remote membawa styling-nya sendiri, aturan yang sama terkirim berkali-kali — dan bisa saling menimpa dengan urutan yang sulit ditebak.\n\nTak satu pun dari ini alasan untuk tidak memakai microfrontend. Tapi semuanya biaya nyata, dan sebaiknya dipilih sadar, bukan ditemukan belakangan.\n\n## Kapan ini sepadan\n\nMicrofrontend menyelesaikan **masalah organisasi**, bukan masalah teknis. Dia layak ketika beberapa tim harus merilis secara independen, dan koordinasi rilis sudah jadi hambatan nyata.\n\nUntuk satu tim yang mengerjakan satu produk, dia menambah lapisan build, lapisan deployment, dan seluruh kelas bug baru — tanpa memberi apa pun sebagai gantinya. Monorepo dengan build cache biasanya jauh lebih tepat.\n\nPertanyaan yang benar bukan \"apakah aplikasi saya cukup besar\", melainkan **\"apakah tim saya saling menunggu\"**. Kalau jawabannya belum, tunggu sampai iya.\n";

const SEO_MICROFRONTEND = {"metaTitle": "Microfrontend dengan Module Federation", "metaDescription": "Cara Module Federation membagi satu frontend jadi banyak aplikasi: host dan remote, shared dependency, berbagi tipe, dan biaya yang jarang disebut.", "keywords": "microfrontend, module federation, arsitektur frontend, react, next.js"};

const ARTICLES = [
  {
    title: 'Microfrontend dengan Module Federation: Membagi Satu Frontend Jadi Banyak Aplikasi',
    slug: 'microfrontend-dengan-module-federation',
    category: 'arsitektur',
    tags: ['microfrontend', 'module-federation', 'nextjs', 'react', 'typescript'],
    featured: true,
    excerpt: "Catatan arsitektur dari sistem microfrontend yang sedang saya bangun. Implementasinya masih berjalan, tapi keputusan arsitekturnya sudah mengendap — termasuk bagian yang baru terasa setelah dijalankan.",
    content: ARTICLE_MICROFRONTEND,
    seo: SEO_MICROFRONTEND,
  },
];

async function seed(strapi) {
  const reset = process.argv.includes('--reset');

  if (reset) {
    // Hapus artikel, kategori, dan tag. Author dan media sengaja dipertahankan.
    for (const uid of ['api::article.article', 'api::category.category', 'api::tag.tag']) {
      const docs = await strapi.documents(uid).findMany({ fields: ['documentId'], limit: 500 });
      for (const d of docs) await strapi.documents(uid).delete({ documentId: d.documentId });
      strapi.log.info(`[seed] reset: ${docs.length} dokumen dihapus dari ${uid}`);
    }
  }

  const existing = await strapi.documents('api::article.article').count();
  if (existing > 0) {
    strapi.log.info(`[seed] Sudah ada ${existing} artikel — dilewati. Pakai --reset untuk menimpa.`);
    return;
  }

  const existingAuthors = await strapi.documents('api::author.author').findMany({ limit: 1 });
  const author = existingAuthors.length
    ? existingAuthors[0]
    : await strapi.documents('api::author.author').create({ data: AUTHOR });
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
    // Menutup connection pool melempar "aborted" pada koneksi yang masih
    // menunggu. Rejection itu mengambang di dalam tarn — bukan dari promise
    // destroy() — jadi .catch() tidak bisa menjangkaunya dan Node mencetak
    // stack trace yang terlihat seperti crash padahal seed sudah berhasil.
    //
    // Handler dipasang di sini saja, bukan di awal script, supaya error
    // sungguhan selama proses seed tetap muncul.
    process.on('unhandledRejection', () => {});
    await app.destroy().catch(() => {});
    process.exit(0);
  }
})().catch((err) => {
  console.error('[seed] GAGAL:', err.message);
  process.exit(1);
});
