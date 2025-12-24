"use client"

import { useState, useEffect } from "react"
import ConfirmModal from "@/components/ConfirmModal"

interface User {
    firstName: string
    lastName: string
    username: string
    panel: { name: string } | null
}

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
    approvedAt: string | null
    user: User
    approvedBy: { firstName: string; lastName: string } | null
    manuelYatirimlar: ManuelEntry[]
    manuelCekimler: ManuelEntry[]
}

export default function AdminApprovalsPage() {
    const [muts, setMuts] = useState<Mut[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("PENDING")
    const [showApproveModal, setShowApproveModal] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [selectedMutId, setSelectedMutId] = useState<string | null>(null)
    const [processing, setProcessing] = useState<string | null>(null)

    const fetchMuts = async () => {
        try {
            const response = await fetch(`/api/mut?status=${filter}`)
            const data = await response.json()
            setMuts(data)
        } catch (error) {
            console.error("Failed to fetch MUTs:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        setLoading(true)
        fetchMuts()
    }, [filter])

    const handleApprove = async () => {
        if (!selectedMutId) return
        setShowApproveModal(false)
        setProcessing(selectedMutId)

        try {
            await fetch(`/api/mut/${selectedMutId}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "approve" })
            })
            fetchMuts()
        } catch (error) {
            console.error("Failed to approve:", error)
        } finally {
            setProcessing(null)
            setSelectedMutId(null)
        }
    }

    const handleReject = async () => {
        if (!selectedMutId) return
        setShowRejectModal(false)
        setProcessing(selectedMutId)

        try {
            await fetch(`/api/mut/${selectedMutId}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "reject" })
            })
            fetchMuts()
        } catch (error) {
            console.error("Failed to reject:", error)
        } finally {
            setProcessing(null)
            setSelectedMutId(null)
        }
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY"
        }).format(value)
    }

    const calculateTotals = (mut: Mut) => {
        const manuelYatirimTotal = mut.manuelYatirimlar.reduce((sum, m) => sum + m.miktar, 0)
        const manuelCekimTotal = mut.manuelCekimler.reduce((sum, m) => sum + m.miktar, 0)
        const toplamYatirim = mut.panelYatirim + manuelYatirimTotal
        const toplamCekim = mut.panelCekim + manuelCekimTotal
        const kasa = toplamYatirim - toplamCekim + mut.devir
        return { kasa }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING":
                return <span className="badge badge-warning">Bekliyor</span>
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
        <div className="admin-page">
            <div className="page-header">
                <h1 className="page-title">MUT Onayları</h1>
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filter === "PENDING" ? "active" : ""}`}
                        onClick={() => setFilter("PENDING")}
                    >
                        Bekleyenler
                    </button>
                    <button
                        className={`filter-tab ${filter === "APPROVED" ? "active" : ""}`}
                        onClick={() => setFilter("APPROVED")}
                    >
                        Onaylananlar
                    </button>
                    <button
                        className={`filter-tab ${filter === "REJECTED" ? "active" : ""}`}
                        onClick={() => setFilter("REJECTED")}
                    >
                        Reddedilenler
                    </button>
                </div>
            </div>

            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Kullanıcı</th>
                            <th>Panel</th>
                            <th>Tarih</th>
                            <th>Kasa</th>
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {muts.length > 0 ? (
                            muts.map((mut) => {
                                const { kasa } = calculateTotals(mut)
                                return (
                                    <tr key={mut.id}>
                                        <td>
                                            <strong>{mut.user.firstName} {mut.user.lastName}</strong>
                                            <br />
                                            <small style={{ color: "var(--text-muted)" }}>
                                                @{mut.user.username}
                                            </small>
                                        </td>
                                        <td>{mut.user.panel?.name || "-"}</td>
                                        <td>
                                            {new Date(mut.createdAt).toLocaleDateString("tr-TR", {
                                                day: "2-digit",
                                                month: "short",
                                                year: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit"
                                            })}
                                        </td>
                                        <td>
                                            <strong style={{ color: kasa >= 0 ? "var(--success)" : "var(--danger)" }}>
                                                {formatCurrency(kasa)}
                                            </strong>
                                        </td>
                                        <td>
                                            {getStatusBadge(mut.status)}
                                            {mut.approvedBy && (
                                                <small style={{ display: "block", color: "var(--text-muted)", marginTop: "4px" }}>
                                                    {mut.approvedBy.firstName} {mut.approvedBy.lastName}
                                                </small>
                                            )}
                                        </td>
                                        <td>
                                            {mut.status === "PENDING" && (
                                                <div className="table-actions">
                                                    <button
                                                        className="action-btn view"
                                                        title="Onayla"
                                                        onClick={() => {
                                                            setSelectedMutId(mut.id)
                                                            setShowApproveModal(true)
                                                        }}
                                                        disabled={processing === mut.id}
                                                    >
                                                        ✅
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        title="Reddet"
                                                        onClick={() => {
                                                            setSelectedMutId(mut.id)
                                                            setShowRejectModal(true)
                                                        }}
                                                        disabled={processing === mut.id}
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })
                        ) : (
                            <tr>
                                <td colSpan={6}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📋</div>
                                        <p className="empty-state-title">
                                            {filter === "PENDING" ? "Bekleyen MUT yok" : "Kayıt bulunamadı"}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={showApproveModal}
                title="MUT Onayla"
                message="Bu MUT kaydını onaylamak istediğinizden emin misiniz?"
                confirmText="Onayla"
                cancelText="İptal"
                type="info"
                onConfirm={handleApprove}
                onCancel={() => setShowApproveModal(false)}
            />

            <ConfirmModal
                isOpen={showRejectModal}
                title="MUT Reddet"
                message="Bu MUT kaydını reddetmek istediğinizden emin misiniz?"
                confirmText="Reddet"
                cancelText="İptal"
                type="danger"
                onConfirm={handleReject}
                onCancel={() => setShowRejectModal(false)}
            />
        </div>
    )
}
