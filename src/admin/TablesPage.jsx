import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import {
  Armchair,
  Check,
  Download,
  Loader2,
  Pencil,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Users,
} from 'lucide-react'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { useToast } from '../context/toast'
import { api, getErrorMessage } from '../lib/api'
import { formatNumber } from '../lib/format'

const emptyForm = {
  code: '',
  name: '',
  capacity: 2,
  is_active: true,
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function TableQrCard({ table, onEdit, onDelete, onRegenerate, onToggle, busy, deleting }) {
  const qrRef = useRef(null)

  const getCanvas = () => qrRef.current?.querySelector('canvas') || null

  const handleDownload = () => {
    const canvas = getCanvas()

    if (!canvas) return

    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `QR-${table.code}-${table.name.replaceAll(' ', '-')}.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handlePrint = () => {
    const canvas = getCanvas()

    if (!canvas) return

    const image = canvas.toDataURL('image/png')
    const printWindow = window.open('', '_blank', 'width=720,height=900')

    if (!printWindow) return

    printWindow.document.write(`<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>QR ${escapeHtml(table.code)} · ${escapeHtml(table.name)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #faf6ef;
        color: #211b16;
        font-family: "Segoe UI", Arial, sans-serif;
        padding: 24px;
      }
      .card {
        width: 380px;
        border: 1px solid #e8ddca;
        border-radius: 28px;
        background: #fff;
        padding: 32px;
        text-align: center;
      }
      .brand { font-size: 11px; letter-spacing: .32em; text-transform: uppercase; color: #c2410c; font-weight: 700; }
      h1 { font-size: 26px; margin: 10px 0 2px; font-family: Georgia, serif; }
      .sub { color: #6b6055; font-size: 12px; margin: 0 0 20px; }
      .qr { display: inline-block; padding: 14px; border: 1px dashed #d6c9b6; border-radius: 20px; background: #fff; }
      .meta { display: flex; justify-content: center; gap: 10px; margin-top: 18px; font-size: 12px; color: #6b6055; }
      .meta span { border: 1px solid #e8ddca; border-radius: 999px; padding: 5px 12px; }
      .url { margin-top: 16px; font-size: 10px; color: #9a8f83; word-break: break-all; }
      .hint { margin-top: 18px; font-size: 11px; line-height: 1.6; color: #6b6055; }
      @media print {
        body { padding: 0; background: #fff; }
        .card { border: 0; width: 100%; }
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="brand">Rasa Nusantara</div>
      <h1>${escapeHtml(table.name)}</h1>
      <p class="sub">Pindai untuk melihat menu &amp; memesan</p>
      <div class="qr"><img src="${image}" width="220" height="220" alt="QR ${escapeHtml(table.code)}" /></div>
      <div class="meta">
        <span>${escapeHtml(table.code)}</span>
        <span>${Number(table.capacity) || '-'} kursi</span>
      </div>
      <p class="hint">Buka kamera ponsel, arahkan ke QR di atas, lalu pilih menu favorit Anda.<br />Tidak perlu install aplikasi.</p>
      <div class="url">${escapeHtml(table.menu_url)}</div>
    </div>
    <script>window.onload = function () { window.focus(); window.print(); }</script>
  </body>
</html>`)

    printWindow.document.close()
  }

  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="flex gap-4 p-5">
        <div ref={qrRef} className="shrink-0 rounded-2xl border border-ink/10 bg-white p-2 shadow-sm">
          <QRCodeCanvas
            value={table.menu_url}
            size={360}
            level="M"
            bgColor="#ffffff"
            fgColor="#211b16"
            marginSize={1}
            style={{ width: 112, height: 112 }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
                {table.code}
              </p>
              <h2 className="truncate font-display text-lg font-semibold leading-tight">
                {table.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onToggle(table)}
              disabled={busy}
              className={`chip shrink-0 transition ${
                table.is_active
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
              }`}
            >
              {busy ? <Loader2 className="size-3 animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}
              {table.is_active ? 'Aktif' : 'Nonaktif'}
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink-soft">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5 text-brand" /> {table.capacity} kursi
            </span>
            <span className="inline-flex items-center gap-1">
              <QrCode className="size-3.5 text-brand" /> {formatNumber(table.orders_count || 0)} pesanan
            </span>
          </div>

          <p className="mt-2 line-clamp-1 text-[10px] text-ink-soft/70" title={table.menu_url}>
            {table.menu_url}
          </p>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1 border-t border-ink/5 bg-cream/40 px-3 py-2.5">
        <button type="button" onClick={() => onEdit(table)} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">
          <Pencil className="size-3.5" /> Edit
        </button>
        <button type="button" onClick={handleDownload} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">
          <Download className="size-3.5" /> Unduh
        </button>
        <button type="button" onClick={handlePrint} className="btn-ghost !px-2.5 !py-1.5 text-[11px]">
          <Printer className="size-3.5" /> Cetak
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => onRegenerate(table)}
            disabled={busy}
            className="grid size-8 place-items-center rounded-lg text-ink-soft transition hover:bg-cream-dark hover:text-ink disabled:opacity-40"
            aria-label={`Buat ulang QR ${table.name}`}
            title="Buat ulang QR (QR lama tidak berlaku)"
          >
            <RotateCcw className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(table)}
            disabled={deleting}
            className="grid size-8 place-items-center rounded-lg text-ink-soft transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            aria-label={`Hapus meja ${table.name}`}
            title="Hapus meja"
          >
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function TablesPage() {
  const toast = useToast()

  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        const { data } = await api.get('/admin/tables')
        setTables(data.data || [])
        setError('')
      } catch (requestError) {
        if (!silent) setError(getErrorMessage(requestError, 'Meja gagal dimuat.'))
        else toast.error(getErrorMessage(requestError, 'Gagal menyegarkan daftar meja.'))
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
    if (!keyword) return tables

    return tables.filter(
      (table) =>
        table.code.toLowerCase().includes(keyword) ||
        table.name.toLowerCase().includes(keyword),
    )
  }, [tables, search])

  const activeCount = tables.filter((table) => table.is_active).length
  const totalCapacity = tables
    .filter((table) => table.is_active)
    .reduce((sum, table) => sum + Number(table.capacity || 0), 0)

  const openCreate = () => {
    setEditing(null)
    setForm({
      ...emptyForm,
      code: `T${String(tables.length + 1).padStart(2, '0')}`,
      name: `Meja ${String(tables.length + 1).padStart(2, '0')}`,
    })
    setModalOpen(true)
  }

  const openEdit = (table) => {
    setEditing(table)
    setForm({
      code: table.code || '',
      name: table.name || '',
      capacity: table.capacity ?? 2,
      is_active: Boolean(table.is_active),
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

    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Kode dan nama meja wajib diisi.')
      return
    }

    setSaving(true)

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      capacity: Number(form.capacity) || 1,
      is_active: form.is_active,
    }

    try {
      if (editing) {
        await api.patch(`/admin/tables/${editing.id}`, payload)
        toast.success('Meja berhasil diperbarui.')
      } else {
        await api.post('/admin/tables', payload)
        toast.success('Meja baru berhasil ditambahkan.')
      }

      setModalOpen(false)
      setEditing(null)
      await load({ silent: true })
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Meja gagal disimpan.'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (table) => {
    setBusyId(table.id)

    try {
      await api.patch(`/admin/tables/${table.id}`, {
        code: table.code,
        name: table.name,
        capacity: table.capacity,
        is_active: !table.is_active,
      })
      toast.success(`Meja ${table.name} ${table.is_active ? 'dinonaktifkan' : 'diaktifkan'}.`)
      await load({ silent: true })
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Status meja gagal diubah.'))
    } finally {
      setBusyId(null)
    }
  }

  const handleRegenerate = async (table) => {
    if (
      !window.confirm(
        `Buat ulang QR untuk ${table.name}? QR yang sudah dicetak tidak akan berlaku lagi.`,
      )
    ) {
      return
    }

    setBusyId(table.id)

    try {
      await api.post(`/admin/tables/${table.id}/regenerate`)
      toast.success('QR berhasil dibuat ulang. Cetak ulang QR untuk meja ini.')
      await load({ silent: true })
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'QR gagal dibuat ulang.'))
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (table) => {
    if (
      !window.confirm(
        `Hapus ${table.name}? Pesanan lama tetap tersimpan, namun meja ini tidak bisa lagi dipakai untuk memesan.`,
      )
    ) {
      return
    }

    setDeletingId(table.id)

    try {
      await api.delete(`/admin/tables/${table.id}`)
      toast.success('Meja berhasil dihapus.')
      await load({ silent: true })
    } catch (requestError) {
      toast.error(getErrorMessage(requestError, 'Meja gagal dihapus.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="section-eyebrow">
            <QrCode className="size-3.5" /> QR per meja
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Meja &amp; QR Code
          </h1>
          <p className="mt-1.5 text-xs text-ink-soft">
            {formatNumber(tables.length)} meja · {formatNumber(activeCount)} aktif ·{' '}
            {formatNumber(totalCapacity)} kursi tersedia
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
            <Plus className="size-4" /> Meja Baru
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-3xl border border-ink/10 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari kode atau nama meja..."
            className="field !py-2.5 !pl-10 text-xs"
            aria-label="Cari meja"
          />
        </div>

        <p className="text-[11px] leading-relaxed text-ink-soft">
          QR mengarah ke halaman menu tamu. Unduh PNG untuk dicetak, atau cetak langsung dari
          browser.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-3xl bg-cream-dark/60" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={Armchair}
          title="Meja tidak dapat dimuat"
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
          icon={Armchair}
          title={search ? 'Meja tidak ditemukan' : 'Belum ada meja'}
          description={
            search
              ? 'Coba kata kunci lain atau tampilkan seluruh meja.'
              : 'Tambahkan meja pertama dan cetak QR-nya untuk pelanggan.'
          }
          action={
            search ? (
              <button type="button" onClick={() => setSearch('')} className="btn-secondary">
                Hapus pencarian
              </button>
            ) : (
              <button type="button" onClick={openCreate} className="btn-brand">
                <Plus className="size-4" /> Tambah Meja
              </button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((table) => (
            <TableQrCard
              key={table.id}
              table={table}
              busy={busyId === table.id}
              deleting={deletingId === table.id}
              onEdit={openEdit}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit meja' : 'Meja baru'}
        description="Kode meja harus unik dan akan muncul pada QR yang dicetak."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeModal} disabled={saving} className="btn-secondary">
              Batal
            </button>
            <button type="submit" form="table-form" disabled={saving} className="btn-brand">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              {editing ? 'Simpan Perubahan' : 'Tambah Meja'}
            </button>
          </div>
        }
      >
        <form id="table-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="table-code" className="label">
                Kode meja <span className="text-brand">*</span>
              </label>
              <input
                id="table-code"
                type="text"
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                }
                placeholder="T01"
                maxLength={20}
                required
                className="field uppercase"
              />
              <p className="mt-1 text-[10px] text-ink-soft">Huruf, angka, strip, atau garis bawah.</p>
            </div>

            <div>
              <label htmlFor="table-name" className="label">
                Nama meja <span className="text-brand">*</span>
              </label>
              <input
                id="table-name"
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Meja 01"
                maxLength={80}
                required
                className="field"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="table-capacity" className="label">
                Kapasitas kursi <span className="text-brand">*</span>
              </label>
              <input
                id="table-capacity"
                type="number"
                min="1"
                max="100"
                value={form.capacity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, capacity: event.target.value }))
                }
                required
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
                Meja aktif
                <span className="block text-[10px] font-normal text-ink-soft">
                  QR dapat dipakai memesan.
                </span>
              </span>
            </label>
          </div>

          {editing && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-[11px] leading-relaxed text-amber-900">
              <RotateCcw className="mt-0.5 size-4 shrink-0" />
              Butuh QR baru? Tutup dialog ini dan gunakan tombol “Buat ulang QR” pada kartu meja.
            </div>
          )}
        </form>
      </Modal>
    </div>
  )
}
