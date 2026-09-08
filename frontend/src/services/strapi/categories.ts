import { fetchCollection, fetchFirst } from './client';
import type { Category, Paginated } from '../../types/strapi';

const PATH = '/categories';

export function getCategories(limit = 50): Promise<Paginated<Category>> {
  return fetchCollection<Category>(PATH, {
    sort: ['name:asc'],
    pagination: { limit },
  });
}

export function getCategoryBySlug(slug: string): Promise<Category | null> {
  return fetchFirst<Category>(PATH, { filters: { slug: { $eq: slug } } });
}
