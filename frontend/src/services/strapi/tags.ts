import { fetchCollection, fetchFirst } from './client';
import type { Paginated, Tag } from '../../types/strapi';

const PATH = '/tags';

export function getTags(limit = 50): Promise<Paginated<Tag>> {
  return fetchCollection<Tag>(PATH, {
    sort: ['name:asc'],
    pagination: { limit },
  });
}

export function getTagBySlug(slug: string): Promise<Tag | null> {
  return fetchFirst<Tag>(PATH, { filters: { slug: { $eq: slug } } });
}
