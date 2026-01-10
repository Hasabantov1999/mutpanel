"use client"

import { useState, useEffect, useCallback } from "react"
import { signOut, useSession } from "next-auth/react"
import { useTheme } from "./ThemeProvider"
import Link from "next/link"
import ConfirmModal from "./ConfirmModal"

interface Notification {
    id: string
    message: string
    type: string
    read: boolean
    createdAt: string
}

export default function Header() {
    const { theme, toggleTheme } = useTheme()
    const { data: session } = useSession()
    const [showNotifications, setShowNotifications] = useState(false)
    const [showProfile, setShowProfile] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch("/api/notifications")
            const data = await response.json()
            setNotifications(data.notifications || [])
            setUnreadCount(data.unreadCount || 0)
        } catch (error) {
            console.error("Failed to fetch notifications:", error)
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAll: true })
            })
            setNotifications(notifications.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Failed to mark notifications as read:", error)
        }
    }

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return "Az önce"
        if (diffMins < 60) return `${diffMins} dk önce`
        if (diffHours < 24) return `${diffHours} saat önce`
        return `${diffDays} gün önce`
    }

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "MUT_APPROVED": return "✅"
            case "MUT_REJECTED": return "❌"
            case "USER_CREATED": return "👤"
            default: return "📌"
        }
    }

    return (
        <>
            <header className="dashboard-header">
                <div className="header-left">
                    <h1 className="header-title">
                        {session?.user?.role === "ADMIN" ? "Admin Panel" : "Dashboard"}
                    </h1>
                </div>

                <div className="header-right">
                    {/* Theme Toggle */}
                    <button
                        className="header-btn"
                        onClick={toggleTheme}
                        title={theme === "light" ? "Karanlık Mod" : "Aydınlık Mod"}
                    >
                        {theme === "light" ? "🌙" : "☀️"}
                    </button>

                    {/* Notifications */}
                    <div className="header-dropdown">
                        <button
                            className="header-btn notification-btn"
                            onClick={() => {
                                setShowNotifications(!showNotifications)
                                setShowProfile(false)
                            }}
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="dropdown-menu notifications-menu">
                                <div className="dropdown-header">
                                    <h3>Bildirimler</h3>
                                    {unreadCount > 0 && (
                                        <button className="mark-all-read" onClick={markAllAsRead}>
                                            Tümünü Okundu İşaretle
                                        </button>
                                    )}
                                </div>
                                <div className="dropdown-body">
                                    {notifications.length > 0 ? (
                                        notifications.slice(0, 5).map((notif) => (
                                            <div key={notif.id} className={`notification-item ${!notif.read ? "unread" : ""}`}>
                                                <div className="notification-icon">{getNotificationIcon(notif.type)}</div>
                                                <div className="notification-content">
                                                    <p className="notification-text">{notif.message}</p>
                                                    <span className="notification-time">{getTimeAgo(notif.createdAt)}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="notification-item">
                                            <div className="notification-content" style={{ textAlign: "center", width: "100%" }}>
                                                <p className="notification-text" style={{ color: "var(--text-muted)" }}>
                                                    Henüz bildirim yok
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {notifications.length > 5 && (
                                    <div className="dropdown-footer">
                                        <Link href="/dashboard/notifications">Tüm Bildirimleri Gör</Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Profile */}
                    <div className="header-dropdown">
                        <button
                            className="header-btn profile-btn"
                            onClick={() => {
                                setShowProfile(!showProfile)
                                setShowNotifications(false)
                            }}
                        >
                            <div className="avatar-sm">
                                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <span className="profile-name">{session?.user?.name || "Kullanıcı"}</span>
                            <span className="dropdown-arrow">▼</span>
                        </button>

                        {showProfile && (
                            <div className="dropdown-menu profile-menu">
                                <div className="dropdown-header profile-header">
                                    <div className="avatar-md">
                                        {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                                    </div>
                                    <div className="profile-info">
                                        <h4>{session?.user?.name || "Kullanıcı"}</h4>
                                        <p>{session?.user?.email || "email@example.com"}</p>
                                        {session?.user?.role && (
                                            <span className={`badge ${session.user.role === "ADMIN" ? "badge-primary" : "badge-success"}`}>
                                                {session.user.role}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="dropdown-body">
                                    <Link href="/dashboard/profile" className="dropdown-item">
                                        <span>👤</span> Profilim
                                    </Link>
                                </div>
                                <div className="dropdown-footer">
                                    <button
                                        className="logout-btn"
                                        onClick={() => {
                                            setShowProfile(false)
                                            setShowLogoutModal(true)
                                        }}
                                    >
                                        🚪 Çıkış Yap
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <ConfirmModal
                isOpen={showLogoutModal}
                title="Çıkış Yap"
                message="Oturumunuzu kapatmak istediğinizden emin misiniz?"
                confirmText="Çıkış Yap"
                cancelText="İptal"
                type="warning"
                onConfirm={async () => {
                    await signOut({ redirect: false })
                    window.location.href = "/login"
                }}
                onCancel={() => setShowLogoutModal(false)}
            />
        </>
    )
}
