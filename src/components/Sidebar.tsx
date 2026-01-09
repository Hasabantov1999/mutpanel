"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

const userMenuItems = [
    {
        title: "Dashboard",
        icon: "📊",
        href: "/dashboard",
    },
    {
        title: "MUT Kayıtları",
        icon: "💰",
        href: "/dashboard/mut",
    },
]

const managementMenuItems = [
    {
        section: "Yönetim",
    },
    {
        title: "Kullanıcılar",
        icon: "👥",
        href: "/dashboard/admin/users",
        roles: ["SUPERADMIN", "ADMIN", "MANAGER"]
    },
    {
        title: "Paneller",
        icon: "📁",
        href: "/dashboard/admin/panels",
        roles: ["SUPERADMIN"]
    },
    {
        title: "MUT Onayları",
        icon: "✅",
        href: "/dashboard/admin/approvals",
        roles: ["SUPERADMIN", "ADMIN", "MANAGER"]
    },
]

export default function Sidebar() {
    const pathname = usePathname()
    const { data: session } = useSession()

    const role = session?.user?.role || "USER"

    const menuItems = [
        ...userMenuItems,
        ...managementMenuItems.filter(item => {
            if ('section' in item) return true
            return item.roles?.includes(role)
        })
    ].filter((item, index, array) => {
        // Eğer bir section'dan sonra hiç yetkili menü kalmadıysa section'ı da gizle
        if ('section' in item) {
            const nextItems = array.slice(index + 1)
            return nextItems.some(next => !('section' in next))
        }
        return true
    })

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <svg width="40" height="40" viewBox="0 0 50 50">
                        <defs>
                            <linearGradient id="sidebarLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{ stopColor: '#3454d1' }} />
                                <stop offset="100%" style={{ stopColor: '#17c666' }} />
                            </linearGradient>
                        </defs>
                        <rect width="50" height="50" rx="12" fill="url(#sidebarLogoGrad)" />
                        <text x="25" y="33" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">M</text>
                    </svg>
                </div>
                {session?.user?.role && (
                    <span className="sidebar-role-badge">
                        {session.user.role === "SUPERADMIN" ? "SuperAdmin" :
                            session.user.role === "ADMIN" ? "Admin" :
                                session.user.role === "MANAGER" ? "Manager" : "Group Holder"}
                    </span>
                )}
            </div>

            <nav className="sidebar-nav">
                <ul className="sidebar-menu">
                    {menuItems.map((item, index) => {
                        if ('section' in item) {
                            return (
                                <li key={index} className="sidebar-section-title">
                                    {item.section}
                                </li>
                            )
                        }

                        const isActive = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href))

                        return (
                            <li key={item.href} className="sidebar-menu-item">
                                <Link
                                    href={item.href}
                                    className={`sidebar-menu-link ${isActive ? "active" : ""}`}
                                >
                                    <span className="sidebar-menu-icon">{item.icon}</span>
                                    <span className="sidebar-menu-text">{item.title}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user-info">
                    {session?.user?.role === "SUPERADMIN" ? (
                        <span className="sidebar-panel-name">
                            🌐 Genel Yönetim
                        </span>
                    ) : session?.user?.panelName ? (
                        <span className="sidebar-panel-name">
                            📁 {session.user.panelName}
                        </span>
                    ) : null}
                </div>
                <div className="sidebar-version">v2.0.0</div>
            </div>
        </aside>
    )
}
