import { fetchCollection, fetchFirst } from './client';
import type { Author, Paginated } from '../../types/strapi';

const PATH = '/authors';

export function getAuthors(limit = 50): Promise<Paginated<Author>> {
  return fetchCollection<Author>(PATH, {
    populate: { avatar: { fields: ['url', 'alternativeText'] } },
    sort: ['name:asc'],
    pagination: { limit },
  });
}

export function getAuthorBySlug(slug: string): Promise<Author | null> {
  return fetchFirst<Author>(PATH, {
    filters: { slug: { $eq: slug } },
    populate: { avatar: { fields: ['url', 'alternativeText'] } },
  });
}
