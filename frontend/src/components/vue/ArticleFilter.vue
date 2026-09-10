<script setup lang="ts">
import { computed, ref } from 'vue';

/**
 * Filter arsip artikel.
 *
 * Tidak melakukan fetch sama sekali — seluruh artikel dioper sebagai props dari
 * server, lalu disaring di memori. Daftarnya juga dirender komponen ini, bukan
 * oleh Astro, supaya isinya tetap ada di HTML sebelum hidrasi (penting untuk SEO).
 */
interface Item {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string | null;
  category: { name: string; slug: string } | null;
  author: { name: string; slug: string; avatar: string | null } | null;
  tags: { name: string; slug: string }[];
  cover: string | null;
}

const props = defineProps<{
  articles: Item[];
  categories: { name: string; slug: string }[];
  tags: { name: string; slug: string }[];
}>();

const activeCategory = ref<string | null>(null);
const activeTag = ref<string | null>(null);

const filtered = computed(() =>
  props.articles.filter((a) => {
    if (activeCategory.value && a.category?.slug !== activeCategory.value) return false;
    if (activeTag.value && !a.tags.some((t) => t.slug === activeTag.value)) return false;
    return true;
  }),
);

const hasFilter = computed(() => activeCategory.value !== null || activeTag.value !== null);

function reset() {
  activeCategory.value = null;
  activeTag.value = null;
}

const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) : '';

const failedCovers = ref(new Set<string>());
const failedAvatars = ref(new Set<string>());
</script>

<template>
  <div>
    <div class="feed-tabs filter-tabs" aria-label="Filter kategori">
      <button type="button" :aria-pressed="activeCategory === null" @click="activeCategory = null">Semua artikel</button>
      <button v-for="c in categories" :key="c.slug" type="button" :aria-pressed="activeCategory === c.slug" @click="activeCategory = c.slug">{{ c.name }}</button>
    </div>
    <div v-if="tags.length" class="filter-topics" aria-label="Filter topik">
      <button v-for="t in tags" :key="t.slug" type="button" class="filter-chip" :aria-pressed="activeTag === t.slug" @click="activeTag = activeTag === t.slug ? null : t.slug">{{ t.name }}</button>
    </div>
    <p v-if="hasFilter" class="filter-summary" role="status">
      {{ filtered.length }} dari {{ articles.length }} tulisan
      <button type="button" @click="reset">Hapus filter</button>
    </p>
    <div v-if="filtered.length" class="story-list">
      <article v-for="a in filtered" :key="a.slug" :class="['story-row', { 'story-row--with-image': a.cover && !failedCovers.has(a.slug) }]">
        <div class="story-byline">
          <a v-if="a.author" :href="`/authors/${a.author.slug}`" class="story-author">
            <span class="story-avatar">
              {{ a.author.name.charAt(0) }}
              <img v-if="a.author.avatar && !failedAvatars.has(a.slug)" :src="a.author.avatar" alt="" width="24" height="24" loading="lazy" @error="failedAvatars.add(a.slug)" />
            </span>
            <span>{{ a.author.name }}</span>
          </a>
          <span v-if="a.author && a.publishedAt" aria-hidden="true">·</span>
          <time v-if="a.publishedAt" :datetime="a.publishedAt">{{ formatDate(a.publishedAt) }}</time>
        </div>
        <div class="story-copy">
          <h2 class="story-title"><a :href="`/articles/${a.slug}`">{{ a.title }}</a></h2>
          <p class="story-excerpt">{{ a.excerpt }}</p>
        </div>
        <a v-if="a.cover && !failedCovers.has(a.slug)" :href="`/articles/${a.slug}`" class="story-thumbnail" tabindex="-1" aria-hidden="true">
          <img :src="a.cover" alt="" width="240" height="160" loading="lazy" @error="failedCovers.add(a.slug)" />
        </a>
        <div class="story-footer">
          <div class="story-details">
            <a v-if="a.category" :href="`/categories/${a.category.slug}`" class="story-category">{{ a.category.name }}</a>
            <a v-for="t in a.tags.slice(0, 2)" :key="t.slug" :href="`/tags/${t.slug}`">{{ t.name }}</a>
          </div>
          <a :href="`/articles/${a.slug}`" class="story-read" :aria-label="`Baca ${a.title}`" title="Baca artikel"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" /></svg></a>
        </div>
      </article>
    </div>
    <div v-else class="feed-state"><strong>Tidak ada tulisan yang cocok</strong><p>Coba lepas salah satu filter.</p></div>
  </div>
</template>
