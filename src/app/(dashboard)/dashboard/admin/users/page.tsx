"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
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
    groupName?: string | null
    panelId: string | null
    panel: { name: string } | null
    createdBy: { firstName: string; lastName: string; role: string } | null
    createdAt: string
    _count: { muts: number }
}

export default function AdminUsersPage() {
    return (
        <Suspense fallback={<div className="loading-spinner"><div className="spinner"></div></div>}>
            <UsersPageContent />
        </Suspense>
    )
}

function UsersPageContent() {
    const { data: session } = useSession()
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
        panelId: "",
        groupName: ""
    })
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const searchParams = useSearchParams()

    const fetchData = async () => {
        try {
            const [usersRes, panelsRes] = await Promise.all([
                fetch("/api/admin/users"),
                fetch("/api/admin/panels")
            ])

            if (!usersRes.ok) {
                const errData = await usersRes.json().catch(() => ({}))
                if (usersRes.status === 403) throw new Error("Bu sayfayı görüntüleme yetkiniz yok (403).")
                throw new Error(errData.error || "Kullanıcılar yüklenemedi")
            }
            if (!panelsRes.ok && session?.user?.role !== "MANAGER") {
                // Panels are optional for manager, but if others fail, log it
                console.warn("Panels failed to load")
            }

            const usersData = usersRes.ok ? await usersRes.json() : []
            // IMPORTANT: If panelsRes is 401 (Manager), we get null/undefined or error object.
            // We MUST ensure panelsData is an array.
            let panelsData = []
            if (panelsRes.ok) {
                try {
                    panelsData = await panelsRes.json()
                } catch (e) { console.error("Panel JSON parse error", e) }
            }

            setUsers(Array.isArray(usersData) ? usersData : [])
            setPanels(Array.isArray(panelsData) ? panelsData : [])
        } catch (error: any) {
            console.error("Failed to fetch data:", error)
            setError(error.message || "Veriler yüklenirken bir hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Initialize form when opening
    useEffect(() => {
        if (showForm) {
            // Set default role based on current user role
            let targetRole = "USER"
            if (session?.user?.role === "SUPERADMIN") targetRole = "ADMIN"
            else if (session?.user?.role === "ADMIN") targetRole = "MANAGER"
            else if (session?.user?.role === "MANAGER") targetRole = "USER"

            setFormData(prev => ({
                ...prev,
                role: targetRole,
                password: "",
                confirmPassword: "",
                // Keep other fields if we are editing? No, this is for new creation usually.
                // But let's be safe and just update role.
            }))
        }
    }, [showForm, session?.user?.role])

    useEffect(() => {
        const action = searchParams.get("action")
        const panelId = searchParams.get("panelId")

        if (action === "create") {
            setShowForm(true)
            // panelId logic moved to the showForm effect or handled here?
            // Actually if we just set showForm(true), the effect above will trigger.
            if (panelId) {
                setFormData(prev => ({ ...prev, panelId: panelId }))
            }
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (formData.password !== formData.confirmPassword) {
            setError("Şifreler eşleşmiyor")
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
                    panelId: formData.panelId || null,
                    groupName: formData.groupName || null
                })
            })

            if (response.ok) {
                // Determine default role for next creation
                let defaultRole = "USER"
                if (session?.user?.role === "SUPERADMIN") defaultRole = "ADMIN"
                else if (session?.user?.role === "ADMIN") defaultRole = "MANAGER"

                setFormData({
                    username: "",
                    firstName: "",
                    lastName: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                    role: defaultRole,
                    panelId: "",
                    groupName: ""
                })
                setShowForm(false)
                fetchData()
            } else {
                let errorMessage = "Bir hata oluştu"
                try {
                    const data = await response.json()
                    errorMessage = data.error || errorMessage
                } catch (e) {
                    console.error("JSON parse error:", e)
                    errorMessage = "Sunucu hatası (JSON parse fail)"
                }
                setError(errorMessage)
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

            {/* Error Alert */}
            {error && (
                <div style={{
                    padding: "15px",
                    backgroundColor: "rgba(234, 77, 77, 0.1)",
                    color: "var(--danger)",
                    borderRadius: "8px",
                    marginBottom: "20px",
                    border: "1px solid var(--danger)"
                }}>
                    ❌ {error}
                </div>
            )}

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
                            {/* Role Selection Logic - Strict Hierarchy */}

                            {/* SUPERADMIN: Can create ADMIN or MANAGER or USER */}
                            {session?.user?.role === "SUPERADMIN" && (
                                <div className="form-group">
                                    <label className="form-label">Rol</label>
                                    <select
                                        className="form-input"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Rol Seçin --</option>
                                        <option value="ADMIN">Admin (Panel Yetkilisi)</option>
                                        <option value="MANAGER">Manager (Yönetici)</option>
                                        <option value="USER">Group Holder (Kayıt Yetkilisi)</option>
                                    </select>
                                </div>
                            )}

                            {/* ADMIN: Can ONLY create MANAGER (Locked) */}
                            {session?.user?.role === "ADMIN" && (
                                <div className="form-group">
                                    <label className="form-label">Rol</label>
                                    <input type="text" className="form-input" value="Manager (Yönetici)" disabled />
                                    {/* Enforce value in hidden input and formData */}
                                </div>
                            )}

                            {/* MANAGER: Can ONLY create USER (Locked) */}
                            {session?.user?.role === "MANAGER" && (
                                <div className="form-group">
                                    <label className="form-label">Rol</label>
                                    <input type="text" className="form-input" value="Group Holder (Kayıt Yetkilisi)" disabled />
                                </div>
                            )}

                            {/* Panel Selection Logic */}
                            {/* SUPERADMIN: Must select a panel */}
                            {session?.user?.role === "SUPERADMIN" && (
                                <div className="form-group">
                                    <label className="form-label">Panel</label>
                                    <select
                                        className="form-input"
                                        value={formData.panelId}
                                        onChange={(e) => setFormData({ ...formData, panelId: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Panel Seçin --</option>
                                        {Array.isArray(panels) && panels.length > 0 && panels.map((panel) => (
                                            <option key={panel.id} value={panel.id}>
                                                {panel.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* ADMIN & MANAGER: Panel is auto-assigned/hidden (Displayed as text for confirmation) */}
                            {(session?.user?.role === "ADMIN" || session?.user?.role === "MANAGER") && (
                                <div className="form-group">
                                    <label className="form-label">Panel</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={session?.user?.panelName || "Mevcut Panel"}
                                        disabled
                                    />
                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        Yeni kullanıcı bu panele eklenecektir.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Group Name - Only for Group Holders (USER) */}
                        {/* Only needed when creating a USER, which implies the creator is MANAGER or SUPERADMIN selecting USER */}
                        {/* Group Name - Only for Group Holders (USER) */}
                        {/* Only show if the selected role is explicitly USER */}
                        {formData.role === "USER" && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Grup Açıklaması <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Örn: B1 Destek"
                                        value={formData.groupName}
                                        onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        )}
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
                            <th>Rol / Grup</th>
                            <th>Panel</th>
                            <th>MUT Sayısı</th>
                            <th>Oluşturan</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(users) && users.length > 0 ? (
                            users.filter(user => user && user.id).map((user) => (
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
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <span className={`badge badge-role-${(user.role || 'USER').toLowerCase()}`}>
                                                {user.role === "USER" ? "GROUP_HOLDER" : (user.role || 'USER')}
                                            </span>
                                            {user.groupName && (
                                                <span className="badge badge-outline" style={{ fontSize: "10px" }}>
                                                    Grup: {user.groupName}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        {user.panel?.name || "-"}
                                    </td>
                                    <td>{user._count?.muts || 0}</td>
                                    <td>
                                        {user.createdBy
                                            ? `${user.createdBy.firstName || ''} ${user.createdBy.lastName || ''} (${user.createdBy.role || ''})`
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
                                                disabled={user.username === "hekimfinance"}
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
