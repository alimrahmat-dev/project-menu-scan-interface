import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Clock,
  Flame,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
  UtensilsCrossed,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import MenuImage from '../components/MenuImage'
import Modal from '../components/Modal'
import { useToast } from '../context/toast'
import { api, getErrorMessage } from '../lib/api'
import { formatCurrency, formatNumber } from '../lib/format'

const emptyForm = {
  name: '',
  category_id: '',
  price: '',
  description: '',
  image_url: '',
  prep_time: 15,
  calories: '',
  badge: '',
  is_available: true,
  is_featured: false,
}

function toForm(menu) {
  return {
    name: menu.name || '',
    category_id: String(menu.category_id || ''),
    price: String(menu.price ?? ''),
    description: menu.description || '',
    image_url: menu.image_url || '',
    prep_time: menu.prep_time ?? 15,
    calories: menu.calories ? String(menu.calories) : '',
    badge: menu.badge || '',
    is_available: Boolean(menu.is_available),
    is_featured: Boolean(menu.is_featured),
  }
}

function buildPayload(form) {
  return {
    category_id: Number(form.category_id),
    name: form.name.trim(),
    price: Number(form.price) || 0,
    description: form.description.trim() || null,
    image_url: form.image_url.trim() || null,
    prep_time: Number(form.prep_time) || 1,
    calories: form.calories === '' ? null : Number(form.calories),
    badge: form.badge.trim() || null,
    is_available: Boolean(form.is_available),
    is_featured: Boolean(form.is_featured),
  }
}

export default function MenusPage() {
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [menus, setMenus] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [availabilityFilter, setAvailabilityFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const [menuResponse, categoryResponse] = await Promise.all([
          api.get('/admin/menus'),
          api.get('/admin/categories'),
        ])

        setMenus(menuResponse.data.data || [])
        setCategories(categoryResponse.data.data || [])
        setError('')
      } catch (requestError) {
        if (!silent) setError(getErrorMessage(requestError, 'Menu gagal dimuat.'))
        else toast.error(getErrorMessage(requestError, 'Gagal menyegarkan menu.'))
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

    return menus.filter((menu) => {
      const matchesSearch =
        !keyword ||
        menu.name.toLowerCase().includes(keyword) ||
        (menu.description || '').toLowerCase().includes(keyword) ||
        (menu.category?.name || '').toLowerCase().includes(keyword)
      const matchesCategory =
        categoryFilter === 'all' || String(menu.category_id) === String(categoryFilter)
      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' ? menu.is_available : !menu.is_available)

      return matchesSearch && matchesCategory && matchesAvailability
    })
  }, [menus, search, categoryFilter, availabilityFilter])

  const availableCount = menus.filter((menu) => menu.is_available).length
  const featuredCount = menus.filter((menu) => menu.is_featured).length
  const hasFilters = search.trim() || categoryFilter !== 'all' || availabilityFilter !== 'all'

  const resetFilters = () => {
    setSearch('')
    setCategoryFilter('all')
    setAvailabilityFilter('all')
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, category_id: categories[0]?.id ? String(categories[0].id) : '' })
    setModalOpen(true)
  }

  const openEdit = (menu) => {
    setEditing(menu)
    setForm(toForm(menu))
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving || uploading) return
    setModalOpen(false)
    setEditing(null)
  }

  const handleImageFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Format gambar harus JPG, PNG, atau WEBP.')
      return
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 3 MB.')
      return
    }

    setUploading(true)

    try {
      const payload = new FormData()
      payload.append('image', file)

      const { data } = await api.post('/admin/uploads', payload, {
        headers: { 'Content-Type': undefined },
      })

      setForm((current) => ({ ...current, image_url: data.url }))
      toast.success('Foto menu berhasil diunggah.')
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Gagal mengunggah gambar.'))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error('Nama menu wajib diisi.')
      return
    }

    if (!form.category_id) {
      toast.error('Pilih kategori untuk menu ini.')
      return
    }

    if (form.price === '' || Number(form.price) < 0) {
      toast.error('Harga menu wajib diisi dengan benar.')
      return
    }

    setSaving(true)

    try {
      if (editing) {
        await api.patch(`/admin/menus/${editing.id}`, buildPayload(form))
        toast.success('Menu berhasil diperbarui.')
      } else {
        await api.post('/admin/menus', buildPayload(form))
        toast.success('Menu baru berhasil ditambahkan.')
      }

      setModalOpen(false)
      setEditing(null)
      await load({ silent: true })
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Menu gagal disimpan.'))
    } finally {
      setSaving(false)
    }
  }

  const quickUpdate = async (menu, changes, message) => {
    setBusyId(menu.id)

    try {
      await api.patch(`/admin/menus/${menu.id}`, {
        category_id: menu.category_id,
        name: menu.name,
        price: Number(menu.price) || 0,
        description: menu.description || null,
        image_url: menu.image_url || null,
        prep_time: menu.prep_time || 1,
        calories: menu.calories ?? null,
        badge: menu.badge || null,
        is_available: menu.is_available,
        is_featured: menu.is_featured,
        ...changes,
      })
      toast.success(message)
      await load({ silent: true })
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Menu gagal diperbarui.'))
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (menu) => {
    if (!window.confirm(`Hapus menu "${menu.name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return
    }

    setDeletingId(menu.id)

    try {
      await api.delete(`/admin/menus/${menu.id}`)
      toast.success('Menu berhasil dihapus.')
      await load({ silent: true })
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Menu gagal dihapus.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="section-eyebrow">
            <UtensilsCrossed className="size-3.5" /> Katalog hidangan
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Manajemen Menu
          </h1>
          <p className="mt-1.5 text-xs text-ink-soft">
            {formatNumber(menus.length)} menu · {formatNumber(availableCount)} tersedia ·{' '}
            {formatNumber(featuredCount)} unggulan
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
          <button
            type="button"
            onClick={openCreate}
            disabled={categories.length === 0}
            className="btn-primary !py-2.5"
          >
            <Plus className="size-4" /> Menu Baru
          </button>
        </div>
      </header>

      <div className="grid gap-3 rounded-3xl border border-ink/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama menu, deskripsi, atau kategori..."
            className="field !py-2.5 !pl-10 text-xs"
            aria-label="Cari menu"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="field !py-2.5 text-xs sm:w-52"
          aria-label="Filter kategori"
        >
          <option value="all">Semua kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.icon ? `${category.icon} ` : ''}
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={availabilityFilter}
          onChange={(event) => setAvailabilityFilter(event.target.value)}
          className="field !py-2.5 text-xs sm:w-44"
          aria-label="Filter ketersediaan"
        >
          <option value="all">Semua status</option>
          <option value="available">Tersedia</option>
          <option value="unavailable">Habis / nonaktif</option>
        </select>
      </div>

      {hasFilters && (
        <div className="flex items-center justify-between text-[11px] text-ink-soft">
          <p>
            Menampilkan <span className="font-bold text-ink">{filtered.length}</span> dari{' '}
            {menus.length} menu
          </p>
          <button type="button" onClick={resetFilters} className="font-semibold text-brand hover:underline">
            Reset filter
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-80 animate-pulse rounded-3xl bg-cream-dark/60" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={UtensilsCrossed}
          title="Menu tidak dapat dimuat"
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
          icon={UtensilsCrossed}
          title={hasFilters ? 'Menu tidak ditemukan' : 'Belum ada menu'}
          description={
            hasFilters
              ? 'Coba ubah kata kunci atau filter yang dipakai.'
              : categories.length === 0
                ? 'Buat kategori terlebih dahulu sebelum menambahkan menu.'
                : 'Tambahkan hidangan pertama untuk ditampilkan ke pelanggan.'
          }
          action={
            hasFilters ? (
              <button type="button" onClick={resetFilters} className="btn-secondary">
                Reset filter
              </button>
            ) : categories.length > 0 ? (
              <button type="button" onClick={openCreate} className="btn-brand">
                <Plus className="size-4" /> Tambah Menu
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((menu) => {
            const busy = busyId === menu.id

            return (
              <article
                key={menu.id}
                className={`card group flex flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 ${
                  menu.is_available ? '' : 'opacity-75'
                }`}
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-cream-dark">
                  <MenuImage
                    src={menu.image_url}
                    alt={menu.name}
                    emoji={menu.category?.icon || '🍽️'}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />

                  <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-cream/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                      {menu.category?.icon} {menu.category?.name || 'Tanpa kategori'}
                    </span>
                    {menu.is_featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sun px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ink">
                        <Star className="size-3 fill-current" /> Unggulan
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-cream">
                    <div className="min-w-0">
                      <h2 className="truncate font-display text-lg font-semibold leading-tight">
                        {menu.name}
                      </h2>
                      <p className="text-[11px] text-cream/70">
                        {formatCurrency(menu.price)}
                        {menu.badge ? ` · ${menu.badge}` : ''}
                      </p>
                    </div>
                    <span
                      className={`chip shrink-0 ${
                        menu.is_available
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-ink/80 text-cream/80'
                      }`}
                    >
                      {menu.is_available ? 'Tersedia' : 'Habis'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <p className="line-clamp-2 min-h-8 text-[11px] leading-relaxed text-ink-soft">
                    {menu.description || 'Belum ada deskripsi menu.'}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-ink-soft">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5 text-brand" /> {menu.prep_time || 15} menit
                    </span>
                    {menu.calories ? (
                      <span className="inline-flex items-center gap-1">
                        <Flame className="size-3.5 text-brand" /> {formatNumber(menu.calories)} kkal
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-ink/5 pt-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(menu)}
                        className="btn-ghost !px-2.5 !py-1.5 text-[11px]"
                      >
                        <Pencil className="size-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          quickUpdate(
                            menu,
                            { is_available: !menu.is_available },
                            `Menu ${menu.name} ${menu.is_available ? 'ditandai habis' : 'kembali tersedia'}.`,
                          )
                        }
                        disabled={busy}
                        className="btn-ghost !px-2.5 !py-1.5 text-[11px]"
                      >
                        {busy ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                        {menu.is_available ? 'Tandai habis' : 'Aktifkan'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          quickUpdate(
                            menu,
                            { is_featured: !menu.is_featured },
                            menu.is_featured
                              ? 'Menu dihapus dari unggulan.'
                              : 'Menu ditambahkan ke unggulan.',
                          )
                        }
                        disabled={busy}
                        className={`grid size-8 place-items-center rounded-lg transition ${
                          menu.is_featured
                            ? 'bg-amber-100 text-amber-600'
                            : 'text-ink-soft hover:bg-cream-dark hover:text-ink'
                        }`}
                        aria-label={menu.is_featured ? 'Hapus dari unggulan' : 'Jadikan unggulan'}
                        title={menu.is_featured ? 'Hapus dari unggulan' : 'Jadikan unggulan'}
                      >
                        <Star className={`size-3.5 ${menu.is_featured ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(menu)}
                        disabled={deletingId === menu.id}
                        className="grid size-8 place-items-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        aria-label={`Hapus menu ${menu.name}`}
                        title="Hapus menu"
                      >
                        {deletingId === menu.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        size="xl"
        title={editing ? 'Edit menu' : 'Menu baru'}
        description={
          editing
            ? 'Perbarui detail hidangan, foto, dan ketersediaannya.'
            : 'Lengkapi detail hidangan yang akan tampil pada menu pelanggan.'
        }
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-ink-soft">
              Perubahan langsung terlihat di menu tamu setelah disimpan.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal} disabled={saving} className="btn-secondary">
                Batal
              </button>
              <button type="submit" form="menu-form" disabled={saving || uploading} className="btn-brand">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                {editing ? 'Simpan Perubahan' : 'Tambah Menu'}
              </button>
            </div>
          </div>
        }
      >
        <form id="menu-form" onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <div>
            <span className="label">Foto menu</span>
            <div className="overflow-hidden rounded-2xl border border-dashed border-ink/20 bg-cream/60">
              <div className="relative aspect-square">
                <MenuImage
                  src={form.image_url}
                  alt="Pratinjau foto menu"
                  className="h-full w-full object-cover"
                />

                {uploading && (
                  <div className="absolute inset-0 grid place-items-center bg-ink/60 backdrop-blur-sm">
                    <Loader2 className="size-7 animate-spin text-cream" />
                  </div>
                )}
              </div>

              <div className="space-y-2 border-t border-ink/10 p-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary w-full !px-3 !py-2 text-[11px]"
                >
                  <Upload className="size-3.5" /> Unggah foto
                </button>
                <p className="text-center text-[9px] text-ink-soft">JPG, PNG, WEBP · maks. 3 MB</p>
              </div>
            </div>

            <div className="mt-3">
              <label htmlFor="menu-image-url" className="label">
                Atau tautan gambar
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ImagePlus className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
                  <input
                    id="menu-image-url"
                    type="url"
                    value={form.image_url}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, image_url: event.target.value }))
                    }
                    placeholder="https://..."
                    className="field !py-2 !pl-9 text-[11px]"
                  />
                </div>
                {form.image_url && (
                  <button
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, image_url: '' }))}
                    className="btn-icon !size-9 shrink-0 !border-red-200 !text-red-500 hover:!bg-red-50"
                    aria-label="Hapus foto"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink/10 bg-cream/60 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, is_available: event.target.checked }))
                  }
                  className="size-4 accent-brand"
                />
                <span className="text-[11px] font-semibold">
                  Tersedia
                  <span className="block text-[9px] font-normal text-ink-soft">
                    Bisa dipesan pelanggan
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-ink/10 bg-cream/60 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, is_featured: event.target.checked }))
                  }
                  className="size-4 accent-brand"
                />
                <span className="text-[11px] font-semibold">
                  Menu unggulan
                  <span className="block text-[9px] font-normal text-ink-soft">
                    Tampil di rekomendasi
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="menu-name" className="label">
                  Nama menu <span className="text-brand">*</span>
                </label>
                <input
                  id="menu-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Contoh: Nasi Goreng Kampung"
                  maxLength={100}
                  required
                  className="field"
                />
              </div>

              <div>
                <label htmlFor="menu-category" className="label">
                  Kategori <span className="text-brand">*</span>
                </label>
                <select
                  id="menu-category"
                  value={form.category_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, category_id: event.target.value }))
                  }
                  required
                  className="field"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon ? `${category.icon} ` : ''}
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="menu-price" className="label">
                  Harga (Rp) <span className="text-brand">*</span>
                </label>
                <input
                  id="menu-price"
                  type="number"
                  min="0"
                  max="100000000"
                  step="500"
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, price: event.target.value }))
                  }
                  placeholder="38000"
                  required
                  className="field"
                />
                <p className="mt-1 text-[10px] text-ink-soft">
                  Pratinjau: <span className="font-semibold text-ink">{formatCurrency(Number(form.price) || 0)}</span>
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="menu-description" className="label">
                  Deskripsi
                </label>
                <textarea
                  id="menu-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  maxLength={1000}
                  placeholder="Jelaskan bahan, rasa, dan keunikan hidangan..."
                  className="field resize-none"
                />
              </div>

              <div>
                <label htmlFor="menu-prep" className="label">
                  Waktu penyajian (menit)
                </label>
                <input
                  id="menu-prep"
                  type="number"
                  min="1"
                  max="240"
                  value={form.prep_time}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, prep_time: event.target.value }))
                  }
                  className="field"
                />
              </div>

              <div>
                <label htmlFor="menu-calories" className="label">
                  Kalori (kkal)
                </label>
                <input
                  id="menu-calories"
                  type="number"
                  min="0"
                  max="10000"
                  value={form.calories}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, calories: event.target.value }))
                  }
                  placeholder="Opsional"
                  className="field"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="menu-badge" className="label">
                  Label khusus
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    id="menu-badge"
                    type="text"
                    value={form.badge}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, badge: event.target.value }))
                    }
                    maxLength={40}
                    placeholder="Contoh: Best Seller, Pedas, Baru"
                    className="field flex-1"
                  />
                  {['Best Seller', 'Favorit', 'Pedas', 'Baru'].map((badge) => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, badge }))}
                      className="chip border border-ink/10 bg-cream text-ink-soft transition hover:border-brand/30 hover:text-brand"
                    >
                      <Sparkles className="size-3" /> {badge}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
