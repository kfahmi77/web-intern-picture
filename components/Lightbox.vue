<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import type { Photo } from '~/composables/usePhotos'

const props = defineProps<{
  photos: Photo[]
  index: number | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'navigate', index: number): void
}>()

const current = computed(() =>
  props.index === null ? null : props.photos[props.index] ?? null,
)

function prev() {
  if (props.index === null) return
  const next = (props.index - 1 + props.photos.length) % props.photos.length
  emit('navigate', next)
}

function next() {
  if (props.index === null) return
  const n = (props.index + 1) % props.photos.length
  emit('navigate', n)
}

function onKey(e: KeyboardEvent) {
  if (props.index === null) return
  if (e.key === 'Escape') emit('close')
  else if (e.key === 'ArrowLeft') prev()
  else if (e.key === 'ArrowRight') next()
}

watch(
  () => props.index,
  (val) => {
    if (import.meta.client) {
      document.body.style.overflow = val === null ? '' : 'hidden'
    }
  },
)

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  if (import.meta.client) document.body.style.overflow = ''
})

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}
</script>

<template>
  <Transition name="lb">
    <div
      v-if="current"
      class="lb"
      role="dialog"
      aria-modal="true"
      aria-label="Foto diperbesar"
      @click.self="emit('close')"
    >
      <button class="lb-close" aria-label="Tutup" @click="emit('close')">×</button>

      <button
        v-if="photos.length > 1"
        class="lb-nav lb-prev"
        aria-label="Sebelumnya"
        @click.stop="prev"
      >
        ‹
      </button>

      <figure class="lb-figure" @click.stop>
        <img :src="current.src" :alt="current.caption || 'Kenangan magang'" />
        <figcaption v-if="current.caption || current.takenAt">
          <span v-if="current.caption" class="lb-cap">{{ current.caption }}</span>
          <span v-if="current.takenAt" class="lb-date">{{ fmtDate(current.takenAt) }}</span>
        </figcaption>
      </figure>

      <button
        v-if="photos.length > 1"
        class="lb-nav lb-next"
        aria-label="Berikutnya"
        @click.stop="next"
      >
        ›
      </button>
    </div>
  </Transition>
</template>

<style scoped>
.lb {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(28, 22, 16, 0.92);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 4vw, 3rem);
}

.lb-figure {
  margin: 0;
  max-width: min(92vw, 1100px);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.lb-figure img {
  max-width: 100%;
  max-height: 78vh;
  object-fit: contain;
  background: #fffdf8;
  padding: clamp(8px, 1.4vw, 16px);
  padding-bottom: clamp(36px, 5vw, 60px);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
  border-radius: 2px;
  transform: rotate(-0.6deg);
}

figcaption {
  text-align: center;
  color: #f4ebde;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.lb-cap {
  font-family: var(--font-hand);
  font-size: clamp(1.4rem, 3vw, 2rem);
  line-height: 1.1;
  color: #fff;
}

.lb-date {
  font-family: var(--font-body);
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  opacity: 0.7;
}

.lb-close {
  position: absolute;
  top: clamp(0.8rem, 2vw, 1.6rem);
  right: clamp(0.8rem, 2vw, 1.6rem);
  width: 48px;
  height: 48px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 1.8rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease, transform 0.18s ease;
}

.lb-close:hover {
  background: rgba(255, 255, 255, 0.24);
  transform: scale(1.06);
}

.lb-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  border-radius: 999px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 2.2rem;
  line-height: 1;
  cursor: pointer;
  transition: background 0.18s ease;
}

.lb-nav:hover {
  background: rgba(255, 255, 255, 0.26);
}

.lb-prev {
  left: clamp(0.6rem, 2vw, 2rem);
}

.lb-next {
  right: clamp(0.6rem, 2vw, 2rem);
}

@media (max-width: 640px) {
  .lb-nav {
    width: 44px;
    height: 44px;
    font-size: 1.7rem;
  }
}

.lb-enter-active,
.lb-leave-active {
  transition: opacity 0.32s ease;
}

.lb-enter-from,
.lb-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .lb-figure img {
    transform: none;
  }
  .lb-enter-active,
  .lb-leave-active {
    transition: none;
  }
}
</style>
