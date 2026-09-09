<script lang="ts">
  interface Heading { depth: 2 | 3; text: string; id: string; }

  /**
   * Perkakas baca: daftar isi dengan penyorotan saat digulir, indikator progres,
   * dan tombol salin di tiap blok kode.
   *
   * Dipilih Svelte karena halaman inilah yang paling pantang berat — runtime-nya
   * dikompilasi habis, jadi biayanya beberapa kilobyte saja. React di posisi yang
   * sama akan berkali lipat.
   *
   * Daftar isinya dirender di server juga, jadi tautannya sudah berfungsi
   * sebelum JavaScript termuat. Hidrasi hanya menambahkan penyorotan.
   */
  let { headings = [] }: { headings: Heading[] } = $props();

  let progress = $state(0);
  let activeId = $state<string | null>(null);

  $effect(() => {
    const body = document.querySelector<HTMLElement>('[data-article-body]');
    if (!body) return;

    const onScroll = () => {
      const start = body.offsetTop;
      const scrollable = body.offsetHeight - window.innerHeight;
      if (scrollable <= 0) {
        progress = 100;
        return;
      }
      const passed = window.scrollY - start;
      progress = Math.min(100, Math.max(0, (passed / scrollable) * 100));
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  });

  $effect(() => {
    if (headings.length === 0) return;

    const targets = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    // rootMargin atas negatif: heading baru dianggap aktif setelah melewati
    // sepertiga atas layar, bukan tepat saat menyentuh tepi atas.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) activeId = visible[0].target.id;
      },
      { rootMargin: '-33% 0px -60% 0px', threshold: 0 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  });

  $effect(() => {
    const blocks = document.querySelectorAll<HTMLPreElement>('.prose-knowly pre');

    const cleanups: (() => void)[] = [];
    blocks.forEach((pre) => {
      if (pre.dataset.copyReady) return;
      pre.dataset.copyReady = 'true';
      pre.style.position = 'relative';

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Salin';
      button.className =
        'absolute right-2 top-2 rounded bg-gray-800 px-2 py-1 text-xs text-gray-400 opacity-0 transition hover:bg-gray-700 hover:text-gray-100 focus:opacity-100 group-hover:opacity-100';
      pre.classList.add('group');

      const onClick = async () => {
        const code = pre.querySelector('code')?.textContent ?? pre.textContent ?? '';
        try {
          await navigator.clipboard.writeText(code);
          button.textContent = 'Tersalin';
        } catch {
          button.textContent = 'Gagal';
        }
        setTimeout(() => (button.textContent = 'Salin'), 1500);
      };

      button.addEventListener('click', onClick);
      pre.appendChild(button);
      cleanups.push(() => {
        button.removeEventListener('click', onClick);
        button.remove();
        delete pre.dataset.copyReady;
      });
    });

    return () => cleanups.forEach((fn) => fn());
  });
</script>

<div class="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5">
  <div class="h-full bg-gray-100 transition-[width] duration-150" style="width:{progress}%"></div>
</div>

{#if headings.length > 0}
  <nav aria-label="Daftar isi" class="hidden lg:block">
    <p class="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">Daftar isi</p>
    <ul class="space-y-1 border-l border-gray-800 text-sm">
      {#each headings as h (h.id)}
        <li>
          <a
            href={`#${h.id}`}
            class="-ml-px block border-l py-1 transition-colors
              {h.depth === 3 ? 'pl-6' : 'pl-4'}
              {activeId === h.id
                ? 'border-gray-300 text-gray-100'
                : 'border-transparent text-gray-500 hover:text-gray-300'}"
          >
            {h.text}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}
