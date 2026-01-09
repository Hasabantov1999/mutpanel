"use client"

import { useRef, useState } from "react"
import html2canvas from "html2canvas"
import { useSession } from "next-auth/react"
import { calculateMutFinances } from "@/lib/calculations"

interface ManuelEntry {
    id: string
    isim: string
    miktar: number
    komisyonOrani?: number | null
}

interface Mut {
    id: string
    panelYatirim: number
    panelCekim: number
    devir: number
    komisyonOrani: number
    araciKomisyonOrani?: number | null
    status: string
    createdAt: string
    userId: string
    user: {
        id?: string
        firstName: string
        lastName: string
        username: string
        panelId?: string | null
        createdById?: string | null
    }
    manuelYatirimlar: ManuelEntry[]
    manuelCekimler: ManuelEntry[]
    teslimatlar?: ManuelEntry[]
}

interface MutViewModalProps {
    mut: Mut | null
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export default function MutViewModal({ mut, isOpen, onClose, onSuccess }: MutViewModalProps) {
    const { data: session } = useSession()
    const contentRef = useRef<HTMLDivElement>(null)
    const [copying, setCopying] = useState(false)
    const [copied, setCopied] = useState(false)
    const [processing, setProcessing] = useState(false)
    const [error, setError] = useState("")

    if (!isOpen || !mut) return null

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            minimumFractionDigits: 2,
        }).format(value)
    }

    const finances = calculateMutFinances({
        panelYatirim: mut.panelYatirim,
        panelCekim: mut.panelCekim,
        devir: mut.devir,
        komisyonOrani: mut.komisyonOrani,
        araciKomisyonOrani: mut.araciKomisyonOrani,
        manuelYatirimlar: mut.manuelYatirimlar,
        manuelCekimler: mut.manuelCekimler,
        teslimatlar: mut.teslimatlar || []
    })

    const {
        manuelYatirimTotal,
        manuelCekimTotal,
        teslimatTotal,
        teslimatMasrafiTotal,
        toplamYatirim,
        toplamCekim,
        komisyon,
        araciKomisyon,
        kasa
    } = finances

    const canApprove = () => {
        if (!session?.user || mut.status !== "PENDING") return false

        const userRole = session.user.role
        if (userRole === "SUPERADMIN") return true
        if (userRole === "ADMIN") return mut.user.panelId === session.user.panelId
        if (userRole === "MANAGER") return mut.user.createdById === session.user.id

        return false
    }

    const handleAction = async (action: "approve" | "reject") => {
        setProcessing(true)
        setError("")
        try {
            const response = await fetch(`/api/mut/${mut.id}/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action })
            })

            if (response.ok) {
                if (onSuccess) onSuccess()
                onClose()
            } else {
                const data = await response.json()
                setError(data.error || "İşlem sırasında bir hata oluştu")
            }
        } catch {
            setError("Sunucuya bağlanılamadı")
        } finally {
            setProcessing(false)
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case "PENDING": return "Onay Bekliyor"
            case "APPROVED": return "Onaylandı"
            case "REJECTED": return "Reddedildi"
            default: return status
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING": return "#f59e0b"
            case "APPROVED": return "#10b981"
            case "REJECTED": return "#ef4444"
            default: return "#6b7280"
        }
    }

    const handleCopyAsImage = async () => {
        if (!contentRef.current) return

        setCopying(true)
        try {
            const canvas = await html2canvas(contentRef.current, {
                backgroundColor: "#1a1a2e",
                scale: 2,
                logging: false,
            })

            canvas.toBlob(async (blob: Blob | null) => {
                if (!blob) return

                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ "image/png": blob })
                    ])
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                } catch {
                    // Fallback: download as image
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `mut-${mut.id.slice(0, 8)}.png`
                    a.click()
                    URL.revokeObjectURL(url)
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                }
            }, "image/png")
        } catch (error) {
            console.error("Failed to copy as image:", error)
        } finally {
            setCopying(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content mut-view-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>MUT Detayları</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div ref={contentRef} className="mut-view-content" style={{ padding: "20px", backgroundColor: "#1a1a2e", borderRadius: "12px" }}>
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "15px" }}>
                        <div>
                            <h3 style={{ margin: 0, color: "#fff", fontSize: "18px" }}>MUT Raporu</h3>
                            <p style={{ margin: "5px 0 0", color: "#9ca3af", fontSize: "13px" }}>
                                {mut.user.firstName} {mut.user.lastName} - {new Date(mut.createdAt).toLocaleDateString("tr-TR", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                            </p>
                        </div>
                        <span style={{
                            padding: "6px 12px",
                            borderRadius: "20px",
                            backgroundColor: getStatusColor(mut.status) + "20",
                            color: getStatusColor(mut.status),
                            fontSize: "12px",
                            fontWeight: 600
                        }}>
                            {getStatusText(mut.status)}
                        </span>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                        <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "15px", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                            <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 5px" }}>Panel Yatırım</p>
                            <p style={{ color: "#10b981", fontSize: "20px", fontWeight: 700, margin: 0 }}>{formatCurrency(mut.panelYatirim)}</p>
                        </div>
                        <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: "15px", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                            <p style={{ color: "#9ca3af", fontSize: "12px", margin: "0 0 5px" }}>Panel Çekim</p>
                            <p style={{ color: "#ef4444", fontSize: "20px", fontWeight: 700, margin: 0 }}>{formatCurrency(mut.panelCekim)}</p>
                        </div>
                    </div>

                    {/* Manuel Entries */}
                    {(mut.manuelYatirimlar.length > 0 || mut.manuelCekimler.length > 0 || (mut.teslimatlar && mut.teslimatlar.length > 0)) && (
                        <div style={{ marginBottom: "20px" }}>
                            <h4 style={{ color: "#fff", fontSize: "14px", marginBottom: "10px" }}>Manuel İşlemler & Teslimatlar</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px" }}>
                                {mut.manuelYatirimlar.length > 0 && (
                                    <div>
                                        <p style={{ color: "#10b981", fontSize: "12px", marginBottom: "8px" }}>Yatırımlar ({formatCurrency(manuelYatirimTotal)})</p>
                                        {mut.manuelYatirimlar.map((item) => (
                                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", marginBottom: "5px" }}>
                                                <span style={{ color: "#d1d5db", fontSize: "13px" }}>{item.isim}</span>
                                                <span style={{ color: "#10b981", fontSize: "13px" }}>{formatCurrency(item.miktar)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {mut.manuelCekimler.length > 0 && (
                                    <div>
                                        <p style={{ color: "#ef4444", fontSize: "12px", marginBottom: "8px" }}>Çekimler ({formatCurrency(manuelCekimTotal)})</p>
                                        {mut.manuelCekimler.map((item) => (
                                            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", marginBottom: "5px" }}>
                                                <span style={{ color: "#d1d5db", fontSize: "13px" }}>{item.isim}</span>
                                                <span style={{ color: "#ef4444", fontSize: "13px" }}>{formatCurrency(item.miktar)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {mut.teslimatlar && mut.teslimatlar.length > 0 && (
                                    <div>
                                        <p style={{ color: "#f59e0b", fontSize: "12px", marginBottom: "8px" }}>Teslimatlar ({formatCurrency(teslimatTotal)})</p>
                                        {mut.teslimatlar.map((item) => (
                                            <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "2px", background: "rgba(255,255,255,0.05)", borderRadius: "6px", marginBottom: "5px", padding: "8px" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                    <span style={{ color: "#d1d5db", fontSize: "13px" }}>{item.isim}</span>
                                                    <span style={{ color: "#f59e0b", fontSize: "13px" }}>{formatCurrency(item.miktar)}</span>
                                                </div>
                                                {item.komisyonOrani !== null && item.komisyonOrani !== undefined && item.komisyonOrani > 0 && (
                                                    <div style={{ textAlign: "right", fontSize: "10px", color: "var(--text-muted)" }}>
                                                        Masraf (%{item.komisyonOrani}): {formatCurrency(item.miktar * (item.komisyonOrani / 100))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div style={{ background: "rgba(255,255,255,0.05)", padding: "15px", borderRadius: "10px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "15px" }}>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ color: "#9ca3af", fontSize: "11px", margin: "0 0 5px" }}>Toplam Yatırım</p>
                                <p style={{ color: "#10b981", fontSize: "16px", fontWeight: 600, margin: 0 }}>{formatCurrency(toplamYatirim)}</p>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ color: "#9ca3af", fontSize: "11px", margin: "0 0 5px" }}>Toplam Çekim</p>
                                <p style={{ color: "#ef4444", fontSize: "16px", fontWeight: 600, margin: 0 }}>{formatCurrency(toplamCekim)}</p>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ color: "#9ca3af", fontSize: "11px", margin: "0 0 5px" }}>Teslimat</p>
                                <p style={{ color: "#f59e0b", fontSize: "16px", fontWeight: 600, margin: 0 }}>{formatCurrency(teslimatTotal)}</p>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "15px", marginBottom: "15px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "15px" }}>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ color: "#9ca3af", fontSize: "11px", margin: "0 0 5px" }}>Devir</p>
                                <p style={{ color: mut.devir >= 0 ? "#10b981" : "#ef4444", fontSize: "16px", fontWeight: 600, margin: 0 }}>{formatCurrency(mut.devir)}</p>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ color: "#9ca3af", fontSize: "11px", margin: "0 0 5px" }}>Komisyon (%{mut.komisyonOrani})</p>
                                <p style={{ color: "#8b5cf6", fontSize: "16px", fontWeight: 600, margin: 0 }}>{formatCurrency(komisyon)}</p>
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ color: "#9ca3af", fontSize: "11px", margin: "0 0 5px" }}>Teslimat Masrafı</p>
                                <p style={{ color: "#ef4444", fontSize: "16px", fontWeight: 600, margin: 0 }}>{formatCurrency(teslimatMasrafiTotal)}</p>
                            </div>
                            {(session?.user?.role === "SUPERADMIN" || session?.user?.role === "ADMIN") && mut.araciKomisyonOrani && mut.araciKomisyonOrani > 0 ? (
                                <div style={{ textAlign: "center" }}>
                                    <p style={{ color: "#9ca3af", fontSize: "11px", margin: "0 0 5px" }}>Aracı Kom. (%{mut.araciKomisyonOrani})</p>
                                    <p style={{ color: "#3dc7be", fontSize: "16px", fontWeight: 600, margin: 0 }}>{formatCurrency(araciKomisyon)}</p>
                                </div>
                            ) : <div style={{ textAlign: "center" }}></div>}
                        </div>
                        <div style={{ borderTop: "2px solid rgba(255,255,255,0.2)", paddingTop: "15px", textAlign: "center" }}>
                            <p style={{ color: "#9ca3af", fontSize: "11px", margin: "0 0 5px" }}>GENEL KASA</p>
                            <p
                                style={{
                                    color: kasa >= 0 ? "#10b981" : "#ef4444",
                                    fontSize: "24px",
                                    fontWeight: 800,
                                    margin: 0,
                                    textShadow: "0 2px 10px rgba(0,0,0,0.3)",
                                }}
                            >
                                {formatCurrency(kasa)}
                            </p>
                        </div>
                    </div>
                </div>

                {error && <p className="error-text" style={{ marginTop: "15px" }}>{error}</p>}

                <div className="modal-actions" style={{ marginTop: "20px", display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "flex-end" }}>
                    <button
                        className="btn btn-primary"
                        onClick={handleCopyAsImage}
                        disabled={copying}
                        style={{ display: "flex", alignItems: "center", gap: "8px" }}
                    >
                        {copying ? "Kopyalanıyor..." : copied ? "✓ Kopyalandı!" : "📷 Resim Olarak Kopyala"}
                    </button>

                    {canApprove() && (
                        <>
                            <button
                                className="btn btn-success"
                                onClick={() => handleAction("approve")}
                                disabled={processing}
                            >
                                {processing ? "..." : "Onayla"}
                            </button>
                            <button
                                className="btn btn-danger"
                                onClick={() => handleAction("reject")}
                                disabled={processing}
                            >
                                {processing ? "..." : "Reddet"}
                            </button>
                        </>
                    )}

                    <button className="btn btn-secondary" onClick={onClose}>
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    )
}
