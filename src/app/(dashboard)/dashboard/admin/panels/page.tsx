"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import ConfirmModal from "@/components/ConfirmModal"

interface Panel {
    id: string
    name: string
    createdAt: string
    _count: { users: number }
}

export default function AdminPanelsPage() {
    const [panels, setPanels] = useState<Panel[]>([])
    const [loading, setLoading] = useState(true)
    const [newPanelName, setNewPanelName] = useState("")
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState("")
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState("")

    const fetchPanels = async () => {
        try {
            const response = await fetch("/api/admin/panels")
            const data = await response.json()
            setPanels(data)
        } catch (error) {
            console.error("Failed to fetch panels:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPanels()
    }, [])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newPanelName.trim()) return

        setCreating(true)
        setError("")

        try {
            const response = await fetch("/api/admin/panels", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newPanelName })
            })

            if (response.ok) {
                setNewPanelName("")
                fetchPanels()
            } else {
                const data = await response.json()
                setError(data.error || "Bir hata oluştu")
            }
        } catch {
            setError("Bir hata oluştu")
        } finally {
            setCreating(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedPanelId) return
        setShowDeleteModal(false)

        try {
            const response = await fetch(`/api/admin/panels/${selectedPanelId}`, {
                method: "DELETE"
            })

            if (response.ok) {
                fetchPanels()
            } else {
                const data = await response.json()
                alert(data.error || "Silinemedi")
            }
        } catch {
            alert("Bir hata oluştu")
        } finally {
            setSelectedPanelId(null)
        }
    }

    const handleEdit = async (id: string) => {
        if (!editName.trim()) return

        try {
            const response = await fetch(`/api/admin/panels/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editName })
            })

            if (response.ok) {
                setEditingId(null)
                setEditName("")
                fetchPanels()
            } else {
                const data = await response.json()
                alert(data.error || "Güncellenemedi")
            }
        } catch {
            alert("Bir hata oluştu")
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
                <h1 className="page-title">Panel Yönetimi</h1>
            </div>

            {/* Create Panel Form */}
            <div className="form-card" style={{ marginBottom: "30px" }}>
                <h3 style={{ marginBottom: "20px" }}>Yeni Panel Oluştur</h3>
                <form onSubmit={handleCreate} className="inline-form">
                    <input
                        type="text"
                        className="form-input"
                        placeholder="Panel adı (örn: Panel-1)"
                        value={newPanelName}
                        onChange={(e) => setNewPanelName(e.target.value)}
                        disabled={creating}
                        style={{ flex: 1, marginRight: "10px" }}
                    />
                    <button type="submit" className="btn btn-primary" disabled={creating}>
                        {creating ? "Oluşturuluyor..." : "+ Oluştur"}
                    </button>
                </form>
                {error && <p className="error-text" style={{ marginTop: "10px" }}>{error}</p>}
            </div>

            {/* Panels Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Panel Adı</th>
                            <th>Kullanıcı Sayısı</th>
                            <th>Oluşturulma Tarihi</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {panels.length > 0 ? (
                            panels.map((panel) => (
                                <tr key={panel.id}>
                                    <td>
                                        {editingId === panel.id ? (
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                style={{ width: "200px" }}
                                            />
                                        ) : (
                                            <strong>{panel.name}</strong>
                                        )}
                                    </td>
                                    <td>
                                        <span className="badge badge-info">
                                            {panel._count.users} kullanıcı
                                        </span>
                                    </td>
                                    <td>
                                        {new Date(panel.createdAt).toLocaleDateString("tr-TR")}
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            {editingId === panel.id ? (
                                                <>
                                                    <button
                                                        className="action-btn view"
                                                        title="Kaydet"
                                                        onClick={() => handleEdit(panel.id)}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        title="İptal"
                                                        onClick={() => {
                                                            setEditingId(null)
                                                            setEditName("")
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Link
                                                        href={`/dashboard/admin/users?panelId=${panel.id}&action=create`}
                                                        className="action-btn view"
                                                        title="Hesap Ekle"
                                                        style={{ textDecoration: "none", fontSize: "14px" }}
                                                    >
                                                        ➕👤
                                                    </Link>
                                                    <button
                                                        className="action-btn edit"
                                                        title="Düzenle"
                                                        onClick={() => {
                                                            setEditingId(panel.id)
                                                            setEditName(panel.name)
                                                        }}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="action-btn delete"
                                                        title="Sil"
                                                        onClick={() => {
                                                            setSelectedPanelId(panel.id)
                                                            setShowDeleteModal(true)
                                                        }}
                                                        disabled={panel._count.users > 0}
                                                    >
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📁</div>
                                        <p className="empty-state-title">Henüz panel yok</p>
                                        <p className="empty-state-desc">
                                            Yukarıdaki formu kullanarak ilk panelinizi oluşturun.
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={showDeleteModal}
                title="Paneli Sil"
                message="Bu paneli silmek istediğinizden emin misiniz?"
                confirmText="Sil"
                cancelText="İptal"
                type="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    )
}
