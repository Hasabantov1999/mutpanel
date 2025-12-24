"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ManuelEntry {
    id: string
    isim: string
    miktar: string
}

export default function EditMutPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        panelYatirim: "",
        panelCekim: "",
        devir: "",
        komisyonOrani: "1.25",
    })

    const [manuelYatirimlar, setManuelYatirimlar] = useState<ManuelEntry[]>([])
    const [manuelCekimler, setManuelCekimler] = useState<ManuelEntry[]>([])

    useEffect(() => {
        const fetchMut = async () => {
            try {
                const response = await fetch(`/api/mut/${id}`)
                if (!response.ok) {
                    router.push("/dashboard/mut")
                    return
                }
                const data = await response.json()

                setFormData({
                    panelYatirim: data.panelYatirim.toString(),
                    panelCekim: data.panelCekim.toString(),
                    devir: data.devir.toString(),
                    komisyonOrani: data.komisyonOrani.toString(),
                })

                setManuelYatirimlar(
                    data.manuelYatirimlar.map((m: { id: string; isim: string; miktar: number }) => ({
                        id: m.id,
                        isim: m.isim,
                        miktar: m.miktar.toString(),
                    }))
                )

                setManuelCekimler(
                    data.manuelCekimler.map((m: { id: string; isim: string; miktar: number }) => ({
                        id: m.id,
                        isim: m.isim,
                        miktar: m.miktar.toString(),
                    }))
                )
            } catch {
                router.push("/dashboard/mut")
            } finally {
                setLoading(false)
            }
        }

        fetchMut()
    }, [id, router])

    const addManuelYatirim = () => {
        setManuelYatirimlar([
            ...manuelYatirimlar,
            { id: Date.now().toString(), isim: "", miktar: "" },
        ])
    }

    const addManuelCekim = () => {
        setManuelCekimler([
            ...manuelCekimler,
            { id: Date.now().toString(), isim: "", miktar: "" },
        ])
    }

    const updateManuelYatirim = (entryId: string, field: "isim" | "miktar", value: string) => {
        setManuelYatirimlar(
            manuelYatirimlar.map((m) => (m.id === entryId ? { ...m, [field]: value } : m))
        )
    }

    const updateManuelCekim = (entryId: string, field: "isim" | "miktar", value: string) => {
        setManuelCekimler(
            manuelCekimler.map((m) => (m.id === entryId ? { ...m, [field]: value } : m))
        )
    }

    const removeManuelYatirim = (entryId: string) => {
        setManuelYatirimlar(manuelYatirimlar.filter((m) => m.id !== entryId))
    }

    const removeManuelCekim = (entryId: string) => {
        setManuelCekimler(manuelCekimler.filter((m) => m.id !== entryId))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSaving(true)

        try {
            const response = await fetch(`/api/mut/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    manuelYatirimlar: manuelYatirimlar
                        .filter((m) => m.isim && m.miktar)
                        .map((m) => ({ isim: m.isim, miktar: parseFloat(m.miktar) })),
                    manuelCekimler: manuelCekimler
                        .filter((m) => m.isim && m.miktar)
                        .map((m) => ({ isim: m.isim, miktar: parseFloat(m.miktar) })),
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                setError(data.error || "Bir hata oluştu")
                return
            }

            router.push("/dashboard/mut")
        } catch {
            setError("Bir hata oluştu")
        } finally {
            setSaving(false)
        }
    }

    // Calculate totals for preview
    const panelYatirim = parseFloat(formData.panelYatirim) || 0
    const panelCekim = parseFloat(formData.panelCekim) || 0
    const devir = parseFloat(formData.devir) || 0
    const komisyonOrani = parseFloat(formData.komisyonOrani) || 0
    const manuelYatirimTotal = manuelYatirimlar.reduce(
        (sum, m) => sum + (parseFloat(m.miktar) || 0),
        0
    )
    const manuelCekimTotal = manuelCekimler.reduce(
        (sum, m) => sum + (parseFloat(m.miktar) || 0),
        0
    )
    const toplamYatirim = panelYatirim + manuelYatirimTotal
    const toplamCekim = panelCekim + manuelCekimTotal
    const kasa = toplamYatirim - toplamCekim + devir
    const komisyon = toplamYatirim * (komisyonOrani / 100)

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
        <div className="edit-mut-page">
            <div className="page-header">
                <h1 className="page-title">MUT Kaydını Düzenle</h1>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
                {/* Form */}
                <div className="form-card">
                    {error && (
                        <div className="alert alert-soft-danger-message mb-4">{error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <h3 style={{ marginBottom: "20px", color: "var(--text-dark)" }}>
                            Panel İşlemleri
                        </h3>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Panel Yatırım (₺)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    placeholder="0.00"
                                    value={formData.panelYatirim}
                                    onChange={(e) =>
                                        setFormData({ ...formData, panelYatirim: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Panel Çekim (₺)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    placeholder="0.00"
                                    value={formData.panelCekim}
                                    onChange={(e) =>
                                        setFormData({ ...formData, panelCekim: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Devir (₺)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    placeholder="0.00"
                                    value={formData.devir}
                                    onChange={(e) =>
                                        setFormData({ ...formData, devir: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Komisyon Oranı (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    placeholder="1.25"
                                    value={formData.komisyonOrani}
                                    onChange={(e) =>
                                        setFormData({ ...formData, komisyonOrani: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {/* Manuel Yatırımlar */}
                        <h3 style={{ marginTop: "30px", marginBottom: "15px", color: "var(--text-dark)" }}>
                            Manuel Yatırımlar
                        </h3>
                        <div className="manuel-entries">
                            {manuelYatirimlar.map((entry) => (
                                <div key={entry.id} className="manuel-entry-row">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="İsim"
                                        value={entry.isim}
                                        onChange={(e) =>
                                            updateManuelYatirim(entry.id, "isim", e.target.value)
                                        }
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        placeholder="Miktar (₺)"
                                        value={entry.miktar}
                                        onChange={(e) =>
                                            updateManuelYatirim(entry.id, "miktar", e.target.value)
                                        }
                                        style={{ maxWidth: "150px" }}
                                    />
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => removeManuelYatirim(entry.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="add-entry-btn" onClick={addManuelYatirim}>
                                + Manuel Yatırım Ekle
                            </button>
                        </div>

                        {/* Manuel Çekimler */}
                        <h3 style={{ marginTop: "30px", marginBottom: "15px", color: "var(--text-dark)" }}>
                            Manuel Çekimler
                        </h3>
                        <div className="manuel-entries">
                            {manuelCekimler.map((entry) => (
                                <div key={entry.id} className="manuel-entry-row">
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="İsim"
                                        value={entry.isim}
                                        onChange={(e) =>
                                            updateManuelCekim(entry.id, "isim", e.target.value)
                                        }
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        placeholder="Miktar (₺)"
                                        value={entry.miktar}
                                        onChange={(e) =>
                                            updateManuelCekim(entry.id, "miktar", e.target.value)
                                        }
                                        style={{ maxWidth: "150px" }}
                                    />
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => removeManuelCekim(entry.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="add-entry-btn" onClick={addManuelCekim}>
                                + Manuel Çekim Ekle
                            </button>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? "Kaydediliyor..." : "💾 Güncelle"}
                            </button>
                            <Link href="/dashboard/mut" className="btn btn-secondary">
                                İptal
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Preview */}
                <div className="form-card" style={{ position: "sticky", top: "100px", height: "fit-content" }}>
                    <h3 style={{ marginBottom: "20px", color: "var(--text-dark)" }}>
                        📊 Özet
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>Panel Yatırım:</span>
                            <span style={{ color: "var(--success)", fontWeight: 600 }}>
                                {formatCurrency(panelYatirim)}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>Manuel Yatırım:</span>
                            <span style={{ color: "var(--success)", fontWeight: 600 }}>
                                {formatCurrency(manuelYatirimTotal)}
                            </span>
                        </div>
                        <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: "5px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>Panel Çekim:</span>
                            <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                                {formatCurrency(panelCekim)}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>Manuel Çekim:</span>
                            <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                                {formatCurrency(manuelCekimTotal)}
                            </span>
                        </div>
                        <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: "5px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>Devir:</span>
                            <span style={{ fontWeight: 600 }}>{formatCurrency(devir)}</span>
                        </div>
                        <hr style={{ border: "none", borderTop: "2px solid var(--border)", margin: "10px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 700, color: "var(--text-dark)" }}>KASA:</span>
                            <span
                                style={{
                                    fontWeight: 800,
                                    fontSize: "18px",
                                    color: kasa >= 0 ? "var(--success)" : "var(--danger)",
                                }}
                            >
                                {formatCurrency(kasa)}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 700, color: "var(--text-dark)" }}>
                                Komisyon ({komisyonOrani}%):
                            </span>
                            <span style={{ fontWeight: 800, fontSize: "18px", color: "var(--warning)" }}>
                                {formatCurrency(komisyon)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
