"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import ConfirmModal from "@/components/ConfirmModal"
import MutViewModal from "@/components/MutViewModal"
import { calculateMutFinances } from "@/lib/calculations"

interface ManuelEntry {
    id: string
    isim: string
    miktar: number
    komisyonOrani?: number | null
}

interface Mut {
    id: string
    isim?: string | null
    panelYatirim: number
    panelCekim: number
    devir: number
    komisyonOrani: number
    araciKomisyonOrani?: number | null
    status: string
    createdAt: string
    userId: string
    manuelYatirimlar: ManuelEntry[]
    manuelCekimler: ManuelEntry[]
    teslimatlar: ManuelEntry[]
    user: {
        id?: string
        firstName: string
        lastName: string
        username: string
        groupName?: string | null
        panelId?: string | null
        createdById?: string | null
        panel?: { name: string } | null
    }
}

export default function MutPage() {
    const { data: session } = useSession()
    const [muts, setMuts] = useState<Mut[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedMutId, setSelectedMutId] = useState<string | null>(null)
    const [showViewModal, setShowViewModal] = useState(false)
    const [viewMut, setViewMut] = useState<Mut | null>(null)
    const [search, setSearch] = useState("")

    const fetchMuts = async (searchTerm = "") => {
        try {
            setLoading(true)
            const url = new URL("/api/mut", window.location.origin)
            if (searchTerm) {
                url.searchParams.append("search", searchTerm)
            }
            const response = await fetch(url.toString())
            const data = await response.json()
            setMuts(data)
        } catch (error) {
            console.error("Failed to fetch MUTs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMuts()
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchMuts(search)
    }

    const openDeleteModal = (id: string) => {
        setSelectedMutId(id)
        setShowDeleteModal(true)
    }

    const handleDelete = async () => {
        if (!selectedMutId) return

        setShowDeleteModal(false)
        setDeleteId(selectedMutId)
        try {
            await fetch(`/api/mut/${selectedMutId}`, { method: "DELETE" })
            setMuts(muts.filter((m) => m.id !== selectedMutId))
        } catch (error) {
            console.error("Failed to delete:", error)
        } finally {
            setDeleteId(null)
            setSelectedMutId(null)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            minimumFractionDigits: 2,
        }).format(value)
    }

    const calculateTotals = (mut: Mut) => {
        const finances = calculateMutFinances({
            panelYatirim: mut.panelYatirim,
            panelCekim: mut.panelCekim,
            devir: mut.devir,
            komisyonOrani: mut.komisyonOrani,
            araciKomisyonOrani: mut.araciKomisyonOrani,
            manuelYatirimlar: mut.manuelYatirimlar,
            manuelCekimler: mut.manuelCekimler,
            teslimatlar: mut.teslimatlar || []
        })

        return {
            ...finances
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span className="badge badge-warning">Onay Bekliyor</span>
            case "APPROVED":
                return <span className="badge badge-success">Onaylandı</span>
            case "REJECTED":
                return <span className="badge badge-danger">Reddedildi</span>
            default:
                return <span className="badge">{status}</span>
        }
    }

    return (
        <div className="mut-list-page">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">MUT Kayıtları</h1>
                <div className="header-actions">
                    <form onSubmit={handleSearch} className="search-form" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="İsim, Kullanıcı veya Grup ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            // Using inline styles to force the look requested
                            style={{
                                padding: "10px 16px",
                                borderRadius: "20px",
                                border: "1px solid #e2e8f0",
                                fontSize: "14px",
                                width: "260px",
                                outline: "none",
                                transition: "all 0.2s",
                                backgroundColor: "white"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#3454d1"}
                            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                        />
                        <button type="submit" className="btn btn-secondary" style={{ borderRadius: "20px", padding: "8px 20px" }}>Ara</button>
                    </form>
                    <Link href="/dashboard/mut/create" className="btn btn-primary">
                        + Yeni Kayıt
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Tarih</th>
                            <th>İsim / Kullanıcı</th>
                            <th>Grup</th>
                            <th>Panel Yatırım</th>
                            <th>Panel Çekim</th>
                            <th>Eklenecek</th>
                            <th>Düşülecek</th>
                            <th>GENEL KASA</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={10}>
                                    <div className="loading-state">
                                        <div className="spinner"></div>
                                        <p>Yükleniyor...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : muts.length > 0 ? (
                            muts.map((mut) => {
                                const totals = calculateTotals(mut)
                                return (
                                    <tr key={mut.id}>
                                        <td>
                                            {new Date(mut.createdAt).toLocaleDateString("tr-TR", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </td>
                                        <td>
                                            <div className="mut-name-cell">
                                                <span className="mut-isim">{mut.isim || "İsimsiz Kayıt"}</span>
                                                <small className="mut-user">{mut.user.firstName} {mut.user.lastName}</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-outline">{mut.user.groupName || "-"}</span>
                                        </td>
                                        <td>
                                            <span className="badge badge-success">
                                                {formatCurrency(mut.panelYatirim)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="badge badge-danger">
                                                {formatCurrency(mut.panelCekim)}
                                            </span>
                                        </td>
                                        <td>{formatCurrency(totals.manuelYatirimTotal)}</td>
                                        <td>{formatCurrency(totals.manuelCekimTotal)}</td>
                                        <td>
                                            <strong
                                                style={{
                                                    color: totals.kasa >= 0 ? "var(--success)" : "var(--danger)",
                                                }}
                                            >
                                                {formatCurrency(totals.kasa)}
                                            </strong>
                                        </td>
                                        <td>{getStatusBadge(mut.status)}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button
                                                    className="action-btn view"
                                                    title="Görüntüle"
                                                    onClick={() => {
                                                        setViewMut(mut)
                                                        setShowViewModal(true)
                                                    }}
                                                >
                                                    👁️
                                                </button>

                                                {/* Only allow Edit/Delete if not approved or if user is not a regular USER (Manager/Admin can always edit unless restricted otherwise, but prompt focuses on Group Holder) */}
                                                {/* Logic: Group Holder (USER role) can ONLY edit/delete if status is PENDING (not confirmed) */}
                                                {/* If Status is not PENDING (i.e. APPROVED/REJECTED), USER cannot edit/delete */}
                                                {/* For Safe side: hide actions if status != PENDING for everyone or specific role? */}
                                                {/* Prompt: "group holderlar... onaylanmış ise düzenliyemez silemez" */}
                                                {(session?.user?.role !== "USER" || mut.status === "PENDING") && (
                                                    <>
                                                        <Link
                                                            href={`/dashboard/mut/${mut.id}/edit`}
                                                            className="action-btn edit"
                                                            title="Düzenle"
                                                        >
                                                            ✏️
                                                        </Link>
                                                        <button
                                                            className="action-btn delete"
                                                            title="Sil"
                                                            onClick={() => openDeleteModal(mut.id)}
                                                            disabled={deleteId === mut.id}
                                                        >
                                                            {deleteId === mut.id ? "..." : "🗑️"}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={10}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📋</div>
                                        <p className="empty-state-title">Kayıt bulunamadı</p>
                                        <p className="empty-state-desc">
                                            Arama kriterlerinize uygun kayıt bulunamadı veya henüz kayıt yok.
                                        </p>
                                        <Link href="/dashboard/mut/create" className="btn btn-primary">
                                            + Yeni Kayıt Oluştur
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Kaydı Sil"
                message="Bu kaydı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                confirmText="Sil"
                cancelText="İptal"
                type="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />

            <MutViewModal
                mut={viewMut}
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false)
                    setViewMut(null)
                }}
                onSuccess={() => fetchMuts(search)}
            />
        </div>
    )
}
