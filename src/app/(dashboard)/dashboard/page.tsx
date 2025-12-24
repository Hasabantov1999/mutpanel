"use client"

import { useState, useEffect, useCallback } from "react"
import DateRangePicker from "@/components/DateRangePicker"
import StatsCards from "@/components/StatsCards"
import Charts from "@/components/Charts"
import Link from "next/link"

interface DashboardData {
    stats: {
        toplamYatirim: number
        toplamCekim: number
        devir: number
        komisyon: number
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
    const [startDate, setStartDate] = useState(today)
    const [endDate, setEndDate] = useState(today)
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch(
                `/api/dashboard/stats?startDate=${startDate}&endDate=${endDate}`
            )
            const result = await response.json()
            setData(result)
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }, [startDate, endDate])

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
                <h1 className="page-title">Dashboard</h1>
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
                    }
                }
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

            {/* Recent Activity */}
            <div className="chart-card">
                <div className="chart-header">
                    <h3 className="chart-title">Son İşlemler</h3>
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
        </div>
    )
}
