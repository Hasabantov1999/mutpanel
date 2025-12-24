"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import ConfirmModal from "@/components/ConfirmModal"

interface ManuelEntry {
    id: string
    isim: string
    miktar: number
}

interface Mut {
    id: string
    panelYatirim: number
    panelCekim: number
    devir: number
    komisyonOrani: number
    status: string
    createdAt: string
    manuelYatirimlar: ManuelEntry[]
    manuelCekimler: ManuelEntry[]
}

export default function MutListPage() {
    const [muts, setMuts] = useState<Mut[]>([])
    const [loading, setLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedMutId, setSelectedMutId] = useState<string | null>(null)

    const fetchMuts = async () => {
        try {
            const response = await fetch("/api/mut")
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
        const manuelYatirimTotal = mut.manuelYatirimlar.reduce((sum, m) => sum + m.miktar, 0)
        const manuelCekimTotal = mut.manuelCekimler.reduce((sum, m) => sum + m.miktar, 0)
        const toplamYatirim = mut.panelYatirim + manuelYatirimTotal
        const toplamCekim = mut.panelCekim + manuelCekimTotal
        const kasa = toplamYatirim - toplamCekim + mut.devir
        const komisyon = toplamYatirim * (mut.komisyonOrani / 100)

        return { manuelYatirimTotal, manuelCekimTotal, toplamYatirim, toplamCekim, kasa, komisyon }
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

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="mut-list-page">
            {/* Page Header */}
            <div className="page-header">
                <h1 className="page-title">MUT Kayıtları</h1>
                <Link href="/dashboard/mut/create" className="btn btn-primary">
                    + Yeni Kayıt
                </Link>
            </div>

            {/* Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Tarih</th>
                            <th>Panel Yatırım</th>
                            <th>Panel Çekim</th>
                            <th>Manuel Yatırım</th>
                            <th>Manuel Çekim</th>
                            <th>Kasa</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {muts.length > 0 ? (
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
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={8}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📋</div>
                                        <p className="empty-state-title">Henüz kayıt yok</p>
                                        <p className="empty-state-desc">
                                            İlk MUT kaydınızı oluşturmak için butona tıklayın.
                                        </p>
                                        <Link href="/dashboard/mut/create" className="btn btn-primary">
                                            + İlk Kaydı Oluştur
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
        </div>
    )
}
