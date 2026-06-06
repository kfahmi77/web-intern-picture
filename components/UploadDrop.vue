<script setup lang="ts">
const emit = defineEmits<{ (e: 'uploaded'): void }>()

const dragOver = ref(false)
const uploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const message = ref<string | null>(null)
const messageType = ref<'ok' | 'err'>('ok')

const MAX_UPLOAD_BYTES = 3.8 * 1024 * 1024
const MAX_IMAGE_SIDE = 2200

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

function fileExt(name: string): string {
  return (name.split('.').pop() || '').toLowerCase()
}

function isHeic(file: File): boolean {
  const ext = fileExt(file.name)
  return file.type === 'image/heic' || file.type === 'image/heif' || ext === 'heic' || ext === 'heif'
}

function errorMessage(err: any): string {
  return err?.data?.statusMessage || err?.statusMessage || err?.message || 'Gagal mengunggah.'
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
  if (!blob) throw new Error('Browser gagal memproses gambar.')
  return blob
}

async function compressImage(file: File): Promise<File> {
  if (isHeic(file)) {
    try {
      const converted = await convertHeicToJpeg(file)
      if (converted.size <= MAX_UPLOAD_BYTES) return converted
      return transcodeImage(converted)
    } catch {
      throw new Error('HEIC gagal dikonversi di browser ini. Ubah foto ke JPEG dulu lalu upload ulang.')
    }
  }
  if (file.size <= MAX_UPLOAD_BYTES) return file

  return transcodeImage(file)
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const { default: heic2any } = await import('heic2any')
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.82,
  })
  const blob = Array.isArray(converted) ? converted[0] : converted
  if (!blob) throw new Error('HEIC kosong setelah dikonversi.')

  return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
    type: 'image/jpeg',
    lastModified: file.lastModified,
  })
}

async function transcodeImage(file: File): Promise<File> {
  const img = await loadImage(file)
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Browser tidak mendukung kompresi gambar.')
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  for (const quality of [0.82, 0.72, 0.62, 0.52]) {
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    if (blob.size <= MAX_UPLOAD_BYTES || isHeic(file)) {
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      })
    }
  }

  throw new Error('File terlalu besar untuk Vercel setelah dikompres. Pilih foto yang lebih kecil.')
}

async function upload(files: FileList) {
  uploading.value = true
  message.value = null
  const selected = Array.from(files)
  let uploaded = 0
  const errors: Array<{ file: string; reason: string }> = []

  try {
    for (const file of selected) {
      try {
        const prepared = await compressImage(file)
        const form = new FormData()
        form.append('files', prepared)
        const res = await $fetch<{ count: number; errors: any[] }>('/api/photos', {
          method: 'POST',
          body: form,
        })
        uploaded += res.count
        if (res.errors?.length) errors.push(...res.errors)
      } catch (err: any) {
        errors.push({ file: file.name, reason: errorMessage(err) })
      }
    }

    if (uploaded === 0) {
      throw new Error(errors[0]?.reason || 'Gagal mengunggah.')
    }

    messageType.value = errors.length ? 'err' : 'ok'
    const skipped = errors.length ? ` (${errors.length} dilewati)` : ''
    message.value = `${uploaded} foto terunggah${skipped}.`
    emit('uploaded')
  } catch (e: any) {
    messageType.value = 'err'
    message.value = errorMessage(e)
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
