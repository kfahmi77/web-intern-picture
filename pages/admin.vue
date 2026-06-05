<script setup lang="ts">
useHead({ title: 'Admin · Kelola Kenangan' })

const { photos, refresh } = usePhotos()

const authed = ref(false)
const checking = ref(true)
const password = ref('')
const loginError = ref<string | null>(null)
const loggingIn = ref(false)

const editingId = ref<string | null>(null)
const editCaption = ref('')

async function checkAuth() {
  checking.value = true
  try {
    const res = await $fetch<{ authed: boolean }>('/api/auth/status')
    authed.value = res.authed
    if (authed.value) await refresh()
  } finally {
    checking.value = false
  }
}

async function doLogin() {
  loginError.value = null
  loggingIn.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password: password.value },
    })
    password.value = ''
    authed.value = true
    await refresh()
  } catch (e: any) {
    loginError.value = e?.statusMessage || 'Gagal masuk.'
  } finally {
    loggingIn.value = false
  }
}

async function doLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  authed.value = false
}

function startEdit(id: string, current: string) {
  editingId.value = id
  editCaption.value = current
}

async function saveCaption(id: string) {
  try {
    await $fetch(`/api/photos/${id}`, {
      method: 'PATCH',
      body: { caption: editCaption.value },
    })
    editingId.value = null
    await refresh()
  } catch (e: any) {
    alert(e?.statusMessage || 'Gagal menyimpan keterangan.')
  }
}

async function remove(id: string) {
  if (!confirm('Hapus foto ini? Tindakan ini tidak bisa dibatalkan.')) return
  try {
    await $fetch(`/api/photos/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e: any) {
    alert(e?.statusMessage || 'Gagal menghapus.')
  }
}

onMounted(checkAuth)
</script>

<template>
  <div class="admin wrap">
    <div class="bar">
      <NuxtLink to="/" class="back">← Galeri</NuxtLink>
      <h1>Kelola Kenangan</h1>
      <button v-if="authed" class="btn btn-ghost" @click="doLogout">Keluar</button>
    </div>

    <div v-if="checking" class="state">Memeriksa sesi…</div>

    <!-- Login -->
    <form v-else-if="!authed" class="login" @submit.prevent="doLogin">
      <label for="pw">Kata sandi admin</label>
      <input
        id="pw"
        v-model="password"
        type="password"
        placeholder="Masukkan kata sandi"
        autocomplete="current-password"
        required
      />
      <p v-if="loginError" class="login-err">{{ loginError }}</p>
      <button class="btn btn-primary" :disabled="loggingIn" type="submit">
        {{ loggingIn ? 'Masuk…' : 'Masuk' }}
      </button>
    </form>

    <!-- Authed -->
    <template v-else>
      <section class="panel">
        <h2>Unggah foto</h2>
        <UploadDrop @uploaded="refresh" />
      </section>

      <section class="panel">
        <h2>
          Semua foto
          <span class="counter">{{ photos.length }}</span>
        </h2>

        <p v-if="photos.length === 0" class="state empty">
          Belum ada foto. Unggah yang pertama di atas.
        </p>

        <div v-else class="grid">
          <div v-for="p in photos" :key="p.id" class="item">
            <img :src="p.thumb" :alt="p.caption || 'foto'" loading="lazy" />

            <div v-if="editingId === p.id" class="edit">
              <textarea
                v-model="editCaption"
                rows="2"
                maxlength="280"
                placeholder="Tulis keterangan…"
              />
              <div class="edit-actions">
                <button class="btn btn-primary sm" @click="saveCaption(p.id)">
                  Simpan
                </button>
                <button class="btn btn-ghost sm" @click="editingId = null">
                  Batal
                </button>
              </div>
            </div>

            <div v-else class="meta">
              <p class="cap">{{ p.caption || 'tanpa keterangan' }}</p>
              <div class="actions">
                <button class="icon-btn" title="Edit" @click="startEdit(p.id, p.caption)">
                  Edit
                </button>
                <button class="icon-btn danger" title="Hapus" @click="remove(p.id)">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.admin {
  padding: clamp(1.5rem, 4vw, 3rem) 0 5rem;
}

.bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2.5rem;
  flex-wrap: wrap;
}

.bar h1 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  margin: 0;
  flex: 1;
}

.back {
  text-decoration: none;
  color: var(--ink-soft);
  font-weight: 600;
  font-size: 0.95rem;
}

.back:hover {
  color: var(--accent);
}

.login {
  max-width: 380px;
  margin: 3rem auto;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  background: var(--card);
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 14px 40px var(--shadow);
}

.login label {
  font-weight: 600;
  font-size: 0.9rem;
}

.login input {
  padding: 0.8rem 1rem;
  border: 1.5px solid rgba(110, 93, 77, 0.3);
  border-radius: 8px;
  font-size: 1rem;
  font-family: var(--font-body);
  background: #fffefb;
  color: var(--ink);
}

.login input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(194, 86, 47, 0.15);
}

.login-err {
  color: var(--accent-deep);
  font-size: 0.88rem;
  margin: 0;
}

.login .btn {
  margin-top: 0.5rem;
  justify-content: center;
}

.panel {
  margin-bottom: 3rem;
}

.panel h2 {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.4rem;
  margin: 0 0 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.counter {
  font-family: var(--font-body);
  font-size: 0.8rem;
  background: var(--accent);
  color: #fff;
  border-radius: 999px;
  padding: 0.15rem 0.6rem;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.4rem;
}

@media (max-width: 520px) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

.item {
  background: var(--card);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 22px var(--shadow);
  display: flex;
  flex-direction: column;
}

.item img {
  width: 100%;
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

.meta,
.edit {
  padding: 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}

.cap {
  font-family: var(--font-hand);
  font-size: 1.15rem;
  color: var(--ink-soft);
  margin: 0;
  flex: 1;
  word-break: break-word;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  flex: 1;
  border: 1px solid rgba(110, 93, 77, 0.25);
  background: transparent;
  border-radius: 6px;
  padding: 0.4rem;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--ink-soft);
  font-family: var(--font-body);
  transition: background 0.15s ease, color 0.15s ease;
}

.icon-btn:hover {
  background: rgba(110, 93, 77, 0.08);
  color: var(--ink);
}

.icon-btn.danger:hover {
  background: rgba(194, 86, 47, 0.12);
  color: var(--accent-deep);
}

.edit textarea {
  width: 100%;
  border: 1.5px solid rgba(110, 93, 77, 0.3);
  border-radius: 6px;
  padding: 0.5rem;
  font-family: var(--font-body);
  font-size: 0.9rem;
  resize: vertical;
  background: #fffefb;
  color: var(--ink);
}

.edit textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.edit-actions {
  display: flex;
  gap: 0.5rem;
}

.btn.sm {
  padding: 0.45rem 0.9rem;
  font-size: 0.85rem;
}

.state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--ink-soft);
}
</style>
