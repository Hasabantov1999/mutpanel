"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"

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
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { data: session } = useSession()
    const [panels, setPanels] = useState<Panel[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, panelsRes] = await Promise.all([
                    fetch(`/api/admin/users/${id}`),
                    fetch("/api/admin/panels")
                ])

                const userData = userRes.ok ? await userRes.json() : null
                const panelsData = panelsRes.ok ? await panelsRes.json() : []

                if (!userData) {
                    setError("Kullanıcı bulunamadı")
                    return
                }

                setFormData({
                    username: userData.username || "",
                    firstName: userData.firstName || "",
                    lastName: userData.lastName || "",
                    email: userData.email || "",
                    password: "",
                    confirmPassword: "",
                    role: userData.role || "USER",
                    panelId: userData.panelId || "",
                    groupName: userData.groupName || ""
                })
                setPanels(Array.isArray(panelsData) ? panelsData : [])
            } catch {
                setError("Veriler yüklenirken bir hata oluştu")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")

        if (formData.password && formData.password !== formData.confirmPassword) {
            setError("Şifreler eşleşmiyor")
            return
        }

        setSubmitting(true)

        try {
            const updateData: Record<string, string | null> = {
                username: formData.username,
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: formData.role,
                panelId: formData.panelId || null,
                groupName: formData.groupName || null
            }

            if (formData.password) {
                updateData.password = formData.password
            }

            const response = await fetch(`/api/admin/users/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateData)
            })

            if (response.ok) {
                setSuccess("Kullanıcı başarıyla güncellendi")
                setTimeout(() => router.push("/dashboard/admin/users"), 1500)
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
                <h1 className="page-title">Kullanıcı Düzenle</h1>
                <Link href="/dashboard/admin/users" className="btn btn-secondary">
                    ← Geri Dön
                </Link>
            </div>

            <div className="form-card">
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
                                disabled={formData.username === "hekimfinance"}
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
                            <label className="form-label">Yeni Şifre (opsiyonel)</label>
                            <input
                                type="password"
                                className="form-input"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="Değiştirmek için doldurun"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Şifre Tekrar</label>
                            <input
                                type="password"
                                className="form-input"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                placeholder="Şifre tekrar"
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
                                disabled={formData.username === "hekimfinance"}
                            >
                                {/* Role Selection strictly by Hierarchy */}
                                {session?.user?.role === "SUPERADMIN" && (
                                    <option value="ADMIN">Admin (Panel Yetkilisi)</option>
                                )}
                                {session?.user?.role === "ADMIN" && (
                                    <option value="MANAGER">Manager (Yönetici)</option>
                                )}
                                {session?.user?.role === "MANAGER" && (
                                    <option value="USER">Group Holder (Kayıt Yetkilisi)</option>
                                )}

                                {/* Fallback: If editing an existing user whose role is NOT allowed by current session heirarchy 
                                    (e.g duplicate/old data), still show their role so form doesn't break */}
                                {!["ADMIN", "MANAGER", "USER"].includes(formData.role) && (
                                    <option value={formData.role}>{formData.role}</option>
                                )}
                            </select>
                        </div>
                        {session?.user?.role !== "MANAGER" && (
                            <div className="form-group">
                                <label className="form-label">Panel</label>
                                <select
                                    className="form-input"
                                    value={formData.panelId}
                                    onChange={(e) => setFormData({ ...formData, panelId: e.target.value })}
                                >
                                    <option value="">-- Panel Seçin --</option>
                                    {Array.isArray(panels) && panels.map((panel) => (
                                        <option key={panel.id} value={panel.id}>
                                            {panel.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    {formData.role === "USER" && (
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Grup Açıklaması <span style={{ color: 'var(--danger)' }}>*</span> <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(B1 Destek vb.)</span></label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Örn: B1 Destek"
                                    value={formData.groupName}
                                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                                    required={formData.role === "USER"}
                                />
                            </div>
                            <div className="form-group"></div>
                        </div>
                    )}
                    {error && <p className="error-text">{error}</p>}
                    {success && <p className="success-text" style={{ color: "var(--success)", marginBottom: "15px" }}>{success}</p>}
                    <div className="form-actions">
                        <Link href="/dashboard/admin/users" className="btn btn-secondary">
                            İptal
                        </Link>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
