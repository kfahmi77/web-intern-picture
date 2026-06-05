<script setup lang="ts">
const { photos, pending, error, refresh } = usePhotos()
await useAsyncData('photos-init', () => refresh())

const lightboxIndex = ref<number | null>(null)

function openAt(i: number) {
  lightboxIndex.value = i
}

// Deterministic gentle rotation per card, stable across renders.
function rotateFor(i: number) {
  const seq = [-2.4, 1.6, -1.1, 2.2, -1.8, 0.9, 2.6, -2.1, 1.2]
  return seq[i % seq.length]
}

const count = computed(() => photos.value.length)

onMounted(() => {
  if (!import.meta.client) return
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        }
      }
    },
    { threshold: 0.08 },
  )
  watchEffect(() => {
    if (count.value >= 0) {
      nextTick(() => {
        document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => io.observe(el))
      })
    }
  })
  onBeforeUnmount(() => io.disconnect())
})
</script>

<template>
  <div>
    <header class="hero">
      <div class="wrap hero-inner">
        <p class="hero-eyebrow">Batch Magang 2026</p>
        <h1 class="hero-title">
          Sampai jumpa,<br />
          <em>dan terima kasih.</em>
        </h1>
        <p class="hero-sub">
          Kumpulan momen, tawa, dan kenangan kecil yang kita rekam sepanjang
          perjalanan magang. Geser ke bawah, kenang lagi satu per satu.
        </p>
        <a href="#galeri" class="btn btn-primary">Lihat kenangan</a>
      </div>
      <div class="hero-deco" aria-hidden="true">
        <span class="d d1" />
        <span class="d d2" />
        <span class="d d3" />
      </div>
    </header>

    <main id="galeri" class="wrap gallery-section">
      <div v-if="pending && count === 0" class="state">Memuat kenangan…</div>

      <div v-else-if="error" class="state state-error">
        {{ error }}
        <button class="btn btn-ghost" @click="refresh">Coba lagi</button>
      </div>

      <div v-else-if="count === 0" class="state empty">
        <p class="empty-hand">Belum ada foto di sini.</p>
        <p class="empty-sub">
          Kenangan pertama menunggu untuk ditambahkan lewat halaman
          <NuxtLink to="/admin" class="link">admin</NuxtLink>.
        </p>
      </div>

      <template v-else>
        <div class="masonry">
          <PolaroidCard
            v-for="(photo, i) in photos"
            :key="photo.id"
            class="reveal"
            :photo="photo"
            :rotate="rotateFor(i)"
            @open="openAt(i)"
          />
        </div>
      </template>
    </main>

    <footer class="foot">
      <div class="wrap">
        <p class="foot-hand">dibuat dengan rindu</p>
        <p class="foot-meta">
          Untuk semua anak magang. <NuxtLink to="/admin" class="link">Kelola</NuxtLink>
        </p>
      </div>
    </footer>

    <Lightbox
      :photos="photos"
      :index="lightboxIndex"
      @close="lightboxIndex = null"
      @navigate="(i) => (lightboxIndex = i)"
    />
  </div>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: min(86dvh, 760px);
  display: flex;
  align-items: center;
  overflow: hidden;
}

.hero-inner {
  position: relative;
  z-index: 2;
  padding-top: 4rem;
  padding-bottom: 4rem;
  max-width: 760px;
}

.hero-eyebrow {
  font-family: var(--font-body);
  text-transform: uppercase;
  letter-spacing: 0.32em;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent-deep);
  margin: 0 0 1.4rem;
}

.hero-title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2.8rem, 8vw, 5.6rem);
  line-height: 1.02;
  letter-spacing: -0.02em;
  margin: 0 0 1.6rem;
  color: var(--ink);
}

.hero-title em {
  font-style: italic;
  font-weight: 500;
  color: var(--accent);
}

.hero-sub {
  font-size: clamp(1.02rem, 2vw, 1.2rem);
  line-height: 1.7;
  color: var(--ink-soft);
  max-width: 52ch;
  margin: 0 0 2.2rem;
}

.hero-deco {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.hero-deco .d {
  position: absolute;
  border-radius: 50%;
  filter: blur(2px);
  opacity: 0.5;
}

.d1 {
  width: 220px;
  height: 220px;
  right: 6%;
  top: 14%;
  background: radial-gradient(circle, rgba(194, 86, 47, 0.22), transparent 70%);
}

.d2 {
  width: 320px;
  height: 320px;
  right: 22%;
  bottom: 2%;
  background: radial-gradient(circle, rgba(214, 188, 148, 0.4), transparent 70%);
}

.d3 {
  width: 140px;
  height: 140px;
  right: 38%;
  top: 8%;
  background: radial-gradient(circle, rgba(154, 63, 31, 0.18), transparent 70%);
}

.gallery-section {
  padding: clamp(2.5rem, 6vw, 5rem) 0 clamp(3rem, 8vw, 6rem);
}

.masonry {
  column-count: 4;
  column-gap: clamp(1rem, 2.4vw, 1.8rem);
}

@media (max-width: 1100px) {
  .masonry {
    column-count: 3;
  }
}

@media (max-width: 760px) {
  .masonry {
    column-count: 2;
  }
}

@media (max-width: 460px) {
  .masonry {
    column-count: 1;
  }
}

.state {
  text-align: center;
  padding: 4rem 1rem;
  color: var(--ink-soft);
  font-size: 1.05rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.state-error {
  color: var(--accent-deep);
}

.empty {
  padding: 5rem 1rem;
}

.empty-hand {
  font-family: var(--font-hand);
  font-size: clamp(2rem, 5vw, 3rem);
  color: var(--ink);
  margin: 0;
}

.empty-sub {
  font-size: 1.05rem;
  margin: 0;
}

.link {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  font-weight: 600;
}

.foot {
  border-top: 1px dashed rgba(110, 93, 77, 0.4);
  padding: 3rem 0 4rem;
  text-align: center;
}

.foot-hand {
  font-family: var(--font-hand);
  font-size: 1.8rem;
  color: var(--accent);
  margin: 0 0 0.3rem;
}

.foot-meta {
  font-size: 0.92rem;
  color: var(--ink-soft);
  margin: 0;
}
</style>
