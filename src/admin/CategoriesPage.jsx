import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Tags,
  Trash2,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { useToast } from '../context/toast'
import { api, getErrorMessage } from '../lib/api'
import { formatNumber } from '../lib/format'

const ICON_CHOICES = ['🍚', '🍜', '🍢', '🥗', '🍤', '🍰', '🥤', '☕', '🍲', '🥘', '🍧', '🌿']

const emptyForm = {
  name: '',
  icon: '🍚',
  description: '',
  sort_order: 0,
  is_active: true,
}

export default function CategoriesPage() {
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const { data } = await api.get('/admin/categories')
        setCategories(data.data || [])
        setError('')
      } catch (requestError) {
        if (!silent) setError(getErrorMessage(requestError, 'Kategori gagal dimuat.'))
        else toast.error(getErrorMessage(requestError, 'Gagal menyegarkan kategori.'))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [toast],
  )

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- Muat data awal dari API.
    load()
  }, [load])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return categories

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(keyword) ||
        (category.description || '').toLowerCase().includes(keyword),
    )
  }, [categories, search])

  const totalMenus = categories.reduce((sum, category) => sum + Number(category.menus_count || 0), 0)

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, sort_order: categories.length })
    setModalOpen(true)
  }

  const openEdit = (category) => {
    setEditing(category)
    setForm({
      name: category.name || '',
      icon: category.icon || '🍚',
      description: category.description || '',
      sort_order: category.sort_order ?? 0,
      is_active: Boolean(category.is_active),
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setEditing(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Nama kategori wajib diisi.')
      return
    }

    setSaving(true)

    const payload = {
      name: form.name.trim(),
      icon: form.icon || null,
      description: form.description.trim() || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    }

    try {
      if (editing) {
        await api.patch(`/admin/categories/${editing.id}`, payload)
        toast.success('Kategori berhasil diperbarui.')
      } else {
        await api.post('/admin/categories', payload)
        toast.success('Kategori baru berhasil ditambahkan.')
      }

      setModalOpen(false)
      setEditing(null)
      await load({ silent: true })
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Kategori gagal disimpan.'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (category) => {
    setTogglingId(category.id)

    try {
      await api.patch(`/admin/categories/${category.id}`, {
        name: category.name,
        icon: category.icon || null,
        description: category.description || null,
        sort_order: category.sort_order ?? 0,
        is_active: !category.is_active,
      })
      toast.success(
        `Kategori ${category.name} ${category.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`,
      )
      await load({ silent: true })
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Status kategori gagal diubah.'))
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (category) => {
    if (
      !window.confirm(
        `Hapus kategori "${category.name}"? Kategori yang masih memiliki menu tidak dapat dihapus.`,
      )
    ) {
      return
    }

    setDeletingId(category.id)

    try {
      await api.delete(`/admin/categories/${category.id}`)
      toast.success('Kategori berhasil dihapus.')
      await load({ silent: true })
    } catch (requestError) {
      toast.error(
        getErrorMessage(
          requestError,
          'Kategori gagal dihapus. Pastikan tidak ada menu yang masih memakainya.',
        ),
      )
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="section-eyebrow">
            <Tags className="size-3.5" /> Struktur menu
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Kategori Menu
          </h1>
          <p className="mt-1.5 text-xs text-ink-soft">
            {formatNumber(categories.length)} kategori · {formatNumber(totalMenus)} menu terdaftar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true)
              load({ silent: true })
            }}
            disabled={refreshing}
            className="btn-secondary !py-2.5"
          >
            {refreshing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Segarkan
          </button>
          <button type="button" onClick={openCreate} className="btn-primary !py-2.5">
            <Plus className="size-4" /> Kategori Baru
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-3xl border border-ink/10 bg-white p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari kategori..."
            className="field !py-2.5 !pl-10 text-xs"
            aria-label="Cari kategori"
          />
        </div>
        <p className="text-[11px] text-ink-soft">
          Urutan tampil mengikuti <span className="font-semibold text-ink">sort order</span> terkecil.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-3xl bg-cream-dark/60" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Tags}
          title="Kategori tidak dapat dimuat"
          description={error}
          action={
            <button
              type="button"
              onClick={() => {
                setLoading(true)
                load()
              }}
              className="btn-brand"
            >
              <RefreshCw className="size-4" /> Coba Lagi
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={search ? 'Kategori tidak ditemukan' : 'Belum ada kategori'}
          description={
            search
              ? 'Coba kata kunci lain atau tampilkan seluruh kategori.'
              : 'Buat kategori pertama agar menu lebih mudah dijelajahi pelanggan.'
          }
          action={
            search ? (
              <button type="button" onClick={() => setSearch('')} className="btn-secondary">
                Hapus pencarian
              </button>
            ) : (
              <button type="button" onClick={openCreate} className="btn-brand">
                <Plus className="size-4" /> Tambah Kategori
              </button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((category) => (
            <article
              key={category.id}
              className={`card group relative flex flex-col p-5 transition duration-300 hover:-translate-y-0.5 ${
                category.is_active ? '' : 'opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-cream-dark text-2xl">
                  {category.icon || '🍽️'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(category)}
                    className="grid size-8 place-items-center rounded-lg text-ink-soft transition hover:bg-cream-dark hover:text-ink"
                    aria-label={`Edit kategori ${category.name}`}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(category)}
                    disabled={deletingId === category.id}
                    className="grid size-8 place-items-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    aria-label={`Hapus kategori ${category.name}`}
                  >
                    {deletingId === category.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <h2 className="mt-4 font-display text-lg font-semibold leading-tight">{category.name}</h2>
              <p className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-relaxed text-ink-soft">
                {category.description || 'Belum ada deskripsi kategori.'}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                <span className="chip bg-brand-soft text-brand">
                  {formatNumber(category.menus_count || 0)} menu
                </span>
                <span className="chip bg-cream-dark text-ink-soft">Urutan {category.sort_order ?? 0}</span>
                <button
                  type="button"
                  onClick={() => handleToggle(category)}
                  disabled={togglingId === category.id}
                  className={`chip transition ${
                    category.is_active
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                  }`}
                >
                  {togglingId === category.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : category.is_active ? (
                    <Check className="size-3" />
                  ) : (
                    <ArrowUpRight className="size-3" />
                  )}
                  {category.is_active ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit kategori' : 'Kategori baru'}
        description={
          editing
            ? 'Perbarui nama, ikon, atau urutan tampil kategori.'
            : 'Kelompokkan menu agar pelanggan lebih mudah menemukan hidangan.'
        }
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeModal} disabled={saving} className="btn-secondary">
              Batal
            </button>
            <button
              type="submit"
              form="category-form"
              disabled={saving}
              className="btn-brand"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {editing ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </button>
          </div>
        }
      >
        <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category-name" className="label">
              Nama kategori <span className="text-brand">*</span>
            </label>
            <input
              id="category-name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Contoh: Makanan Utama"
              maxLength={60}
              required
              className="field"
            />
          </div>

          <div>
            <span className="label">Ikon kategori</span>
            <div className="flex flex-wrap gap-2">
              {ICON_CHOICES.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, icon }))}
                  className={`grid size-10 place-items-center rounded-xl border text-lg transition ${
                    form.icon === icon
                      ? 'border-brand bg-brand-soft ring-2 ring-brand/15'
                      : 'border-ink/10 bg-white hover:border-ink/25'
                  }`}
                  aria-label={`Pilih ikon ${icon}`}
                  aria-pressed={form.icon === icon}
                >
                  {icon}
                </button>
              ))}
              <input
                type="text"
                value={form.icon}
                onChange={(event) => setForm((current) => ({ ...current, icon: event.target.value }))}
                maxLength={16}
                className="field !w-20 text-center"
                aria-label="Ikon kustom"
              />
            </div>
          </div>

          <div>
            <label htmlFor="category-description" className="label">
              Deskripsi singkat
            </label>
            <textarea
              id="category-description"
              rows={2}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              maxLength={500}
              placeholder="Contoh: Pilihan hidangan utama khas Nusantara."
              className="field resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category-sort" className="label">
                Urutan tampil
              </label>
              <input
                id="category-sort"
                type="number"
                min="0"
                max="999"
                value={form.sort_order}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sort_order: event.target.value }))
                }
                className="field"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 self-end rounded-2xl border border-ink/10 bg-cream/60 px-4 py-3">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_active: event.target.checked }))
                }
                className="size-4 accent-brand"
              />
              <span className="text-xs font-semibold">
                Tampilkan di menu tamu
                <span className="block text-[10px] font-normal text-ink-soft">
                  Nonaktifkan untuk menyembunyikan kategori.
                </span>
              </span>
            </label>
          </div>
        </form>
      </Modal>
    </div>
  )
}
