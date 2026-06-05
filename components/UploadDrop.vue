<script setup lang="ts">
const emit = defineEmits<{ (e: 'uploaded'): void }>()

const dragOver = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const message = ref<string | null>(null)
const messageType = ref<'ok' | 'err'>('ok')

function pick() {
  fileInput.value?.click()
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length) upload(files)
}

function onChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length) upload(files)
}

async function upload(files: FileList) {
  uploading.value = true
  message.value = null
  const form = new FormData()
  for (const f of Array.from(files)) form.append('files', f)

  try {
    const res = await $fetch<{ count: number; errors: any[] }>('/api/photos', {
      method: 'POST',
      body: form,
    })
    messageType.value = 'ok'
    const skipped = res.errors?.length
      ? ` (${res.errors.length} dilewati)`
      : ''
    message.value = `${res.count} foto terunggah${skipped}.`
    emit('uploaded')
  } catch (e: any) {
    messageType.value = 'err'
    message.value = e?.statusMessage || 'Gagal mengunggah.'
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}
</script>

<template>
  <div
    class="drop"
    :class="{ over: dragOver, busy: uploading }"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop.prevent="onDrop"
    @click="pick"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/*,.heic,.heif"
      multiple
      hidden
      @change="onChange"
    />
    <div v-if="uploading" class="drop-inner">
      <span class="spinner" aria-hidden="true" />
      <p>Mengunggah & membuat thumbnail…</p>
    </div>
    <div v-else class="drop-inner">
      <p class="drop-hand">Seret foto ke sini</p>
      <p class="drop-sub">atau klik untuk memilih. Bisa banyak sekaligus.</p>
    </div>
  </div>

  <p v-if="message" class="msg" :class="messageType">{{ message }}</p>
</template>

<style scoped>
.drop {
  border: 2px dashed rgba(110, 93, 77, 0.45);
  border-radius: 10px;
  padding: clamp(2rem, 6vw, 3.5rem);
  text-align: center;
  cursor: pointer;
  background: rgba(255, 253, 248, 0.6);
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.drop.over {
  border-color: var(--accent);
  background: rgba(194, 86, 47, 0.07);
  transform: scale(1.01);
}

.drop.busy {
  cursor: progress;
}

.drop-hand {
  font-family: var(--font-hand);
  font-size: clamp(1.6rem, 4vw, 2.2rem);
  color: var(--ink);
  margin: 0 0 0.3rem;
}

.drop-sub {
  color: var(--ink-soft);
  margin: 0;
  font-size: 0.95rem;
}

.spinner {
  width: 34px;
  height: 34px;
  border: 3px solid rgba(110, 93, 77, 0.25);
  border-top-color: var(--accent);
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.8rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.msg {
  text-align: center;
  margin: 1rem 0 0;
  font-weight: 600;
}

.msg.ok {
  color: #3d7a3d;
}

.msg.err {
  color: var(--accent-deep);
}

@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation-duration: 2s;
  }
  .drop {
    transition: none;
  }
}
</style>
