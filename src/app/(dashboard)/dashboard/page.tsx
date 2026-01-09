"use client"

import { useState, useEffect, useCallback } from "react"
import DateRangePicker from "@/components/DateRangePicker"
import StatsCards from "@/components/StatsCards"
import Charts from "@/components/Charts"
import Link from "next/link"
import { useSession } from "next-auth/react"

interface Panel {
    id: string
    name: string
}

interface DashboardData {
    stats: {
        toplamYatirim: number
        toplamCekim: number
        devir: number
        komisyon: number
        araciKomisyon: number
        kasa: number
    }
    chartData: {
        labels: string[]
        yatirim: number[]
        cekim: number[]
    }
    recentMuts: Array<{
        id: string
        panelYatirim: number
        panelCekim: number
        createdAt: string
    }>
}

export default function DashboardPage() {
    const today = new Date().toISOString().split("T")[0]
    const { data: session } = useSession()
    const [startDate, setStartDate] = useState(today)
    const [endDate, setEndDate] = useState(today)
    const [selectedPanelId, setSelectedPanelId] = useState("")
    const [panels, setPanels] = useState<Panel[]>([])
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchPanels = useCallback(async () => {
        if (session?.user?.role === "SUPERADMIN") {
            try {
                const response = await fetch("/api/admin/panels")
                const result = await response.json()
                setPanels(result)
            } catch (error) {
                console.error("Failed to fetch panels:", error)
            }
        }
    }, [session?.user?.role])

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            let url = `/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`
            if (selectedPanelId) {
                url += `&panelId=${selectedPanelId}`
            }
            const response = await fetch(url)
            const result = await response.json()
            setData(result)
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }, [startDate, endDate, selectedPanelId])

    useEffect(() => {
        fetchPanels()
    }, [fetchPanels])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleDateChange = (start: string, end: string) => {
        setStartDate(start)
        setEndDate(end)
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            minimumFractionDigits: 2,
        }).format(value)
    }

    if (loading) {
        return (
            <div className="loading-spinner">
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="dashboard-page">
            {/* Page Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    {session?.user?.role === "SUPERADMIN" && (
                        <div style={{ marginTop: "10px" }}>
                            <select
                                className="form-input"
                                style={{ width: "auto", minWidth: "200px" }}
                                value={selectedPanelId}
                                onChange={(e) => setSelectedPanelId(e.target.value)}
                            >
                                <option value="">Tüm Paneller</option>
                                {panels.map((panel) => (
                                    <option key={panel.id} value={panel.id}>
                                        {panel.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <DateRangePicker onDateChange={handleDateChange} />
            </div>

            {/* Stats Cards */}
            <StatsCards
                stats={
                    data?.stats || {
                        toplamYatirim: 0,
                        toplamCekim: 0,
                        devir: 0,
                        komisyon: 0,
                        araciKomisyon: 0,
                        kasa: 0,
                    }
                }
                userRole={session?.user?.role}
            />

            {/* Charts */}
            <Charts
                data={
                    data?.chartData || {
                        labels: ["Veri Yok"],
                        yatirim: [0],
                        cekim: [0],
                    }
                }
            />

            {/* Recent Activity - SuperAdmin için opsiyonel veya daha sade */}
            {(!session?.user?.role || session.user.role !== "SUPERADMIN" || selectedPanelId) && (
                <div className="chart-card">
                    <div className="chart-header">
                        <h3 className="chart-title">{selectedPanelId ? "Panel Son İşlemleri" : "Son İşlemler"}</h3>
                        <Link href="/dashboard/mut" className="btn btn-secondary">
                            Tümünü Gör →
                        </Link>
                    </div>
                    <div className="data-table-wrapper" style={{ border: "none" }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Tarih</th>
                                    <th>Panel Yatırım</th>
                                    <th>Panel Çekim</th>
                                    <th>İşlem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.recentMuts && data.recentMuts.length > 0 ? (
                                    data.recentMuts.map((mut) => (
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
                                            <td>
                                                <Link
                                                    href={`/dashboard/mut/${mut.id}/edit`}
                                                    className="action-btn view"
                                                >
                                                    👁️
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>
                                            <div className="empty-state" style={{ padding: "20px" }}>
                                                <div className="empty-state-icon">📋</div>
                                                <p className="empty-state-title">Henüz kayıt yok</p>
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
                </div>
            )}
        </div>
    )
}
