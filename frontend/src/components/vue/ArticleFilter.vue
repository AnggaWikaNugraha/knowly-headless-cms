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

const chip = 'rounded-full px-3 py-1.5 text-sm transition-colors';
const chipOff = 'bg-gray-800/70 text-gray-400 hover:bg-gray-700 hover:text-gray-100';
const chipOn = 'bg-gray-100 text-gray-900';
</script>

<template>
  <div>
    <div class="mb-8 space-y-4">
      <div v-if="categories.length" class="flex flex-wrap items-center gap-2">
        <span class="mr-1 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Kategori</span>
        <button
          v-for="c in categories"
          :key="c.slug"
          type="button"
          :class="[chip, activeCategory === c.slug ? chipOn : chipOff]"
          :aria-pressed="activeCategory === c.slug"
          @click="activeCategory = activeCategory === c.slug ? null : c.slug"
        >
          {{ c.name }}
        </button>
      </div>

      <div v-if="tags.length" class="flex flex-wrap items-center gap-2">
        <span class="mr-1 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Topik</span>
        <button
          v-for="t in tags"
          :key="t.slug"
          type="button"
          :class="[chip, activeTag === t.slug ? chipOn : chipOff]"
          :aria-pressed="activeTag === t.slug"
          @click="activeTag = activeTag === t.slug ? null : t.slug"
        >
          {{ t.name }}
        </button>
      </div>

      <p v-if="hasFilter" class="text-sm text-gray-400">
        {{ filtered.length }} dari {{ articles.length }} tulisan
        <button type="button" class="ml-2 text-gray-300 underline underline-offset-4 hover:text-gray-100" @click="reset">
          Hapus filter
        </button>
      </p>
    </div>

    <div v-if="filtered.length" class="divide-y divide-gray-800 border-t border-gray-800">
      <article v-for="a in filtered" :key="a.slug" class="flex items-start gap-5 py-7 sm:gap-8">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 text-xs text-gray-400">
            <img v-if="a.author?.avatar" :src="a.author.avatar" alt="" width="20" height="20" class="h-5 w-5 rounded-full object-cover" />
            <span v-else-if="a.author" class="grid h-5 w-5 place-items-center rounded-full bg-gray-700 text-[10px] font-semibold text-gray-300">
              {{ a.author.name.charAt(0) }}
            </span>
            <a v-if="a.author" :href="`/authors/${a.author.slug}`" class="text-gray-300 hover:text-gray-100">{{ a.author.name }}</a>
            <span aria-hidden="true">·</span>
            <time :datetime="a.publishedAt ?? undefined">{{ formatDate(a.publishedAt) }}</time>
          </div>

          <h3 class="mt-2 text-lg font-bold leading-snug text-gray-50 sm:text-xl">
            <a :href="`/articles/${a.slug}`" class="line-clamp-2 hover:underline">{{ a.title }}</a>
          </h3>

          <p class="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-400">{{ a.excerpt }}</p>

          <div class="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <a
              v-if="a.category"
              :href="`/categories/${a.category.slug}`"
              class="rounded-full bg-gray-800/70 px-2.5 py-1 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-100"
            >
              {{ a.category.name }}
            </a>
            <a v-for="t in a.tags.slice(0, 2)" :key="t.slug" :href="`/tags/${t.slug}`" class="transition-colors hover:text-gray-300">
              #{{ t.name }}
            </a>
          </div>
        </div>

        <a :href="`/articles/${a.slug}`" class="hidden shrink-0 sm:block">
          <img v-if="a.cover" :src="a.cover" alt="" width="200" height="134" loading="lazy" class="h-[9rem] w-[13rem] rounded object-cover" />
          <div v-else class="h-[9rem] w-[13rem] rounded bg-gradient-to-br from-gray-800 to-gray-900" />
        </a>
      </article>
    </div>

    <div v-else class="rounded-lg border border-dashed border-gray-700 px-6 py-12 text-center">
      <p class="font-medium text-gray-100">Tidak ada tulisan yang cocok</p>
      <p class="mt-2 text-sm text-gray-400">Coba lepas salah satu filter.</p>
    </div>
  </div>
</template>
