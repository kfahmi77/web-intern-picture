<script setup lang="ts">
import type { Photo } from '~/composables/usePhotos'

defineProps<{
  photo: Photo
  rotate: number
}>()

const emit = defineEmits<{ (e: 'open'): void }>()
</script>

<template>
  <figure
    class="polaroid"
    :style="{ '--rot': rotate + 'deg' }"
    tabindex="0"
    role="button"
    :aria-label="photo.caption || 'Lihat foto kenangan'"
    @click="emit('open')"
    @keydown.enter="emit('open')"
    @keydown.space.prevent="emit('open')"
  >
    <span class="tape" aria-hidden="true" />
    <div class="frame">
      <img
        :src="photo.thumb"
        :alt="photo.caption || 'Kenangan magang'"
        loading="lazy"
        decoding="async"
      />
    </div>
    <figcaption>
      {{ photo.caption || 'tanpa keterangan' }}
    </figcaption>
  </figure>
</template>

<style scoped>
.polaroid {
  margin: 0;
  background: var(--card);
  padding: 12px 12px 0;
  box-shadow: 0 10px 26px var(--shadow);
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  transform: rotate(var(--rot));
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s ease;
  break-inside: avoid;
  margin-bottom: clamp(1rem, 2.4vw, 1.8rem);
  outline: none;
}

.polaroid:hover,
.polaroid:focus-visible {
  transform: rotate(0deg) translateY(-6px) scale(1.02);
  box-shadow: 0 22px 48px var(--shadow);
  z-index: 2;
}

.polaroid:focus-visible {
  box-shadow: 0 0 0 3px var(--accent), 0 22px 48px var(--shadow);
}

.frame {
  background: #ded2bd;
  overflow: hidden;
  border-radius: 1px;
}

.frame img {
  width: 100%;
  height: auto;
  display: block;
}

figcaption {
  font-family: var(--font-hand);
  font-size: 1.35rem;
  line-height: 1.15;
  color: var(--ink-soft);
  text-align: center;
  padding: 0.55rem 0.4rem 0.85rem;
  min-height: 2.6rem;
  word-break: break-word;
}

.tape {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%) rotate(-3deg);
  width: 92px;
  height: 26px;
  background: var(--tape);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
}

.tape::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0));
}

@media (prefers-reduced-motion: reduce) {
  .polaroid {
    transition: none;
  }
  .polaroid:hover,
  .polaroid:focus-visible {
    transform: rotate(0deg);
  }
}
</style>
