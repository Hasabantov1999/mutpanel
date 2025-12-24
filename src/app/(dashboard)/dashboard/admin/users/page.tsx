"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import ConfirmModal from "@/components/ConfirmModal"

interface Panel {
    id: string
    name: string
}

interface User {
    id: string
    username: string
    firstName: string
    lastName: string
    email: string
    role: string
    panelId: string | null
    panel: { name: string } | null
    createdBy: { firstName: string; lastName: string } | null
    createdAt: string
    _count: { muts: number }
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [panels, setPanels] = useState<Panel[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        username: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "USER",
        panelId: ""
    })
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const fetchData = async () => {
        try {
            const [usersRes, panelsRes] = await Promise.all([
                fetch("/api/admin/users"),
                fetch("/api/admin/panels")
            ])
            const usersData = await usersRes.json()
            const panelsData = await panelsRes.json()
            setUsers(usersData)
            setPanels(panelsData)
        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (formData.password !== formData.confirmPassword) {
            setError("Şifreler eşleşmiyor")
            return
        }

        if (formData.role === "USER" && !formData.panelId) {
            setError("USER rolü için panel seçimi zorunludur")
            return
        }

        setSubmitting(true)

        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    panelId: formData.role === "USER" ? formData.panelId : null
                })
            })

            if (response.ok) {
                setFormData({
                    username: "",
                    firstName: "",
                    lastName: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                    role: "USER",
                    panelId: ""
                })
                setShowForm(false)
                fetchData()
            } else {
                const data = await response.json()
                setError(data.error || "Bir hata oluştu")
            }
        } catch {
            setError("Bir hata oluştu")
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!selectedUserId) return
        setShowDeleteModal(false)

        try {
            const response = await fetch(`/api/admin/users/${selectedUserId}`, {
                method: "DELETE"
            })

            if (response.ok) {
                fetchData()
            } else {
                const data = await response.json()
                alert(data.error || "Silinemedi")
            }
        } catch {
            alert("Bir hata oluştu")
        } finally {
            setSelectedUserId(null)
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
                <h1 className="page-title">Kullanıcı Yönetimi</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? "İptal" : "+ Yeni Kullanıcı"}
                </button>
            </div>

            {/* Create User Form */}
            {showForm && (
                <div className="form-card" style={{ marginBottom: "30px" }}>
                    <h3 style={{ marginBottom: "20px" }}>Yeni Kullanıcı Oluştur</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Kullanıcı Adı</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Ad</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Soyad</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Şifre</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Şifre Tekrar</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Rol</label>
                                <select
                                    className="form-input"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Panel {formData.role === "USER" && "*"}</label>
                                <select
                                    className="form-input"
                                    value={formData.panelId}
                                    onChange={(e) => setFormData({ ...formData, panelId: e.target.value })}
                                    disabled={formData.role === "ADMIN"}
                                >
                                    <option value="">-- Panel Seçin --</option>
                                    {panels.map((panel) => (
                                        <option key={panel.id} value={panel.id}>
                                            {panel.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {error && <p className="error-text">{error}</p>}
                        <div className="form-actions">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setShowForm(false)}
                            >
                                İptal
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Kullanıcı</th>
                            <th>Rol</th>
                            <th>Panel</th>
                            <th>MUT Sayısı</th>
                            <th>Oluşturan</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length > 0 ? (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div>
                                            <strong>{user.firstName} {user.lastName}</strong>
                                            <br />
                                            <small style={{ color: "var(--text-muted)" }}>
                                                @{user.username} • {user.email}
                                            </small>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${user.role === "ADMIN" ? "badge-primary" : "badge-success"}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        {user.panel?.name || "-"}
                                    </td>
                                    <td>{user._count.muts}</td>
                                    <td>
                                        {user.createdBy
                                            ? `${user.createdBy.firstName} ${user.createdBy.lastName}`
                                            : "-"}
                                    </td>
                                    <td>
                                        <div className="table-actions">
                                            <Link
                                                href={`/dashboard/admin/users/${user.id}/edit`}
                                                className="action-btn edit"
                                                title="Düzenle"
                                            >
                                                ✏️
                                            </Link>
                                            <button
                                                className="action-btn delete"
                                                title="Sil"
                                                onClick={() => {
                                                    setSelectedUserId(user.id)
                                                    setShowDeleteModal(true)
                                                }}
                                                disabled={user.username === "admin"}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6}>
                                    <div className="empty-state">
                                        <div className="empty-state-icon">👥</div>
                                        <p className="empty-state-title">Henüz kullanıcı yok</p>
                                        <p className="empty-state-desc">
                                            Yeni bir kullanıcı oluşturmak için butona tıklayın.
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
                title="Kullanıcıyı Sil"
                message="Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
                confirmText="Sil"
                cancelText="İptal"
                type="danger"
                onConfirm={handleDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </div>
    )
}
