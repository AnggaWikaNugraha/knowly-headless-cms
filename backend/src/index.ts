import type { Core } from '@strapi/strapi';

/**
 * Content type yang boleh dibaca publik, beserta aksi yang diizinkan.
 *
 * Hanya find & findOne — create, update, dan delete tetap tertutup.
 * Situs publik hanya membaca; penulisan konten lewat admin panel.
 */
const PUBLIC_READ: Record<string, string[]> = {
  'api::article.article': ['find', 'findOne'],
  'api::author.author': ['find', 'findOne'],
  'api::category.category': ['find', 'findOne'],
  'api::tag.tag': ['find', 'findOne'],
};

/**
 * Permission Strapi disimpan di database, bukan di file. Kalau hanya diatur
 * lewat klik di admin panel, setelannya tertinggal di database itu saja —
 * dan produksi (Cloud SQL) akan start dengan permission kosong, sehingga
 * Astro kena 403. Menyalakannya di bootstrap membuat setelan ini ikut
 * ter-commit dan berlaku di environment mana pun tanpa langkah manual.
 *
 * Fungsi ini idempoten: baris yang sudah ada tidak dibuat ulang.
 */
async function grantPublicReadAccess(strapi: Core.Strapi) {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.warn('[bootstrap] Role "public" tidak ditemukan — permission dilewati.');
    return;
  }

  const granted: string[] = [];

  for (const [uid, actions] of Object.entries(PUBLIC_READ)) {
    for (const action of actions) {
      const permission = `${uid}.${action}`;

      const existing = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action: permission, role: publicRole.id } });

      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: { action: permission, role: publicRole.id },
        });
        granted.push(permission);
      }
    }
  }

  if (granted.length > 0) {
    strapi.log.info(`[bootstrap] Permission publik dinyalakan: ${granted.join(', ')}`);
  } else {
    strapi.log.info('[bootstrap] Permission publik sudah sesuai — tidak ada perubahan.');
  }
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicReadAccess(strapi);
  },
};
