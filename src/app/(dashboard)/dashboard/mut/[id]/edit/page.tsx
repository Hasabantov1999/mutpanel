"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { calculateMutFinances } from "@/lib/calculations"
import Link from "next/link"

interface ManuelEntry {
    id: string
    isim: string
    miktar: string
    komisyonOrani?: string
}

export default function EditMutPage({ params }: { params: Promise<{ id: string }> }) {
    const { data: session } = useSession()
    const { id } = use(params)
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState("")

    const [formData, setFormData] = useState({
        isim: "",
        panelYatirim: "",
        panelCekim: "",
        devir: "",
        komisyonOrani: "1.25",
        araciKomisyonOrani: "",
    })

    const [manuelYatirimlar, setManuelYatirimlar] = useState<ManuelEntry[]>([])
    const [manuelCekimler, setManuelCekimler] = useState<ManuelEntry[]>([])
    const [teslimatlar, setTeslimatlar] = useState<ManuelEntry[]>([])

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
                    isim: data.isim || "",
                    panelYatirim: data.panelYatirim.toString(),
                    panelCekim: data.panelCekim.toString(),
                    devir: data.devir.toString(),
                    komisyonOrani: data.komisyonOrani.toString(),
                    araciKomisyonOrani: data.araciKomisyonOrani?.toString() || "",
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

                setTeslimatlar(
                    (data.teslimatlar || []).map((m: { id: string; isim: string; miktar: number; komisyonOrani?: number }) => ({
                        id: m.id,
                        isim: m.isim,
                        miktar: m.miktar.toString(),
                        komisyonOrani: m.komisyonOrani?.toString() || "",
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

    const addTeslimat = () => {
        setTeslimatlar([
            ...teslimatlar,
            { id: Date.now().toString(), isim: "", miktar: "", komisyonOrani: "" },
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

    const updateTeslimat = (entryId: string, field: "isim" | "miktar" | "komisyonOrani", value: string) => {
        setTeslimatlar(
            teslimatlar.map((m) => (m.id === entryId ? { ...m, [field]: value } : m))
        )
    }

    const removeManuelYatirim = (entryId: string) => {
        setManuelYatirimlar(manuelYatirimlar.filter((m) => m.id !== entryId))
    }

    const removeManuelCekim = (entryId: string) => {
        setManuelCekimler(manuelCekimler.filter((m) => m.id !== entryId))
    }

    const removeTeslimat = (entryId: string) => {
        setTeslimatlar(teslimatlar.filter((m) => m.id !== entryId))
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
                    teslimatlar: teslimatlar
                        .filter((m) => m.isim && m.miktar)
                        .map((m) => ({
                            isim: m.isim,
                            miktar: parseFloat(m.miktar),
                            komisyonOrani: m.komisyonOrani ? parseFloat(m.komisyonOrani) : null
                        })),
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

    // Use centralized calculation
    const panelYatirim = parseFloat(formData.panelYatirim) || 0
    const panelCekim = parseFloat(formData.panelCekim) || 0
    const devir = parseFloat(formData.devir) || 0
    const komisyonOrani = parseFloat(formData.komisyonOrani) || 0

    const araciKomisyonOrani = parseFloat(formData.araciKomisyonOrani) || 0

    const finances = calculateMutFinances({
        panelYatirim,
        panelCekim,
        devir,
        komisyonOrani,
        araciKomisyonOrani,
        manuelYatirimlar: manuelYatirimlar.map(m => ({ miktar: parseFloat(m.miktar) || 0 })),
        manuelCekimler: manuelCekimler.map(m => ({ miktar: parseFloat(m.miktar) || 0 })),
        teslimatlar: teslimatlar.map(t => ({
            miktar: parseFloat(t.miktar) || 0,
            komisyonOrani: parseFloat(t.komisyonOrani || "0") || 0
        })),
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
                        <div className="form-group mb-6">
                            <label className="form-label">Kaydetme İsmi</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Örn: 08.01.2025 MUT Kaydı"
                                value={formData.isim}
                                onChange={(e) =>
                                    setFormData({ ...formData, isim: e.target.value })
                                }
                                required
                            />
                            <small className="form-help">Bu isim listede arama yaparken kolaylık sağlar.</small>
                        </div>

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

                        <div className="form-row">
                            {(session?.user?.role === "SUPERADMIN" || session?.user?.role === "ADMIN") && (
                                <div className="form-group">
                                    <label className="form-label">Aracı Komisyon Oranı (%) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Opsiyonel)</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        placeholder="0.00"
                                        value={formData.araciKomisyonOrani}
                                        onChange={(e) =>
                                            setFormData({ ...formData, araciKomisyonOrani: e.target.value })
                                        }
                                    />
                                </div>
                            )}
                            <div className="form-group"></div>
                        </div>

                        {/* Manuel Yatırımlar (Eklenecek) */}
                        <h3 style={{ marginTop: "30px", marginBottom: "15px", color: "var(--text-dark)" }}>
                            Eklenecek (Manuel Yatırım)
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

                        {/* Manuel Çekimler (Düşülecek) */}
                        <h3 style={{ marginTop: "30px", marginBottom: "15px", color: "var(--text-dark)" }}>
                            Düşülecek (Manuel Çekim)
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

                        {/* Teslimatlar */}
                        <h3 style={{ marginTop: "30px", marginBottom: "15px", color: "var(--text-dark)" }}>
                            Teslimatlar
                        </h3>
                        <div className="manuel-entries">

                            <div style={{ marginTop: "10px", fontSize: "14px", color: "var(--text-muted)", display: "grid", gridTemplateColumns: "1fr 150px 100px 40px", gap: "10px", padding: "0 10px" }}>
                                <span>Teslimat İsmi</span>
                                <span>Miktar (₺)</span>
                                <span>Komisyon (%)</span>
                                <span></span>
                            </div>
                            {teslimatlar.map((entry) => (
                                <div key={entry.id} className="manuel-entry-row" style={{ gridTemplateColumns: "1fr 140px 100px 40px", gap: "10px", alignItems: "center" }}>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Teslimat İsmi"
                                        value={entry.isim}
                                        onChange={(e) =>
                                            updateTeslimat(entry.id, "isim", e.target.value)
                                        }
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        placeholder="Miktar"
                                        value={entry.miktar}
                                        onChange={(e) =>
                                            updateTeslimat(entry.id, "miktar", e.target.value)
                                        }
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-input"
                                        placeholder="%"
                                        value={entry.komisyonOrani}
                                        onChange={(e) =>
                                            updateTeslimat(entry.id, "komisyonOrani", e.target.value)
                                        }
                                    />
                                    <button
                                        type="button"
                                        className="remove-btn"
                                        onClick={() => removeTeslimat(entry.id)}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="add-entry-btn" onClick={addTeslimat}>
                                + Teslimat Ekle
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
                            <span style={{ color: "var(--text-muted)" }}>Eklenecek:</span>
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
                            <span style={{ color: "var(--text-muted)" }}>Düşülecek:</span>
                            <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                                {formatCurrency(manuelCekimTotal)}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>Teslimat:</span>
                            <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                                {formatCurrency(teslimatTotal)}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>Teslimat Masrafı:</span>
                            <span style={{ color: "var(--danger)", fontWeight: 600 }}>
                                {formatCurrency(teslimatMasrafiTotal)}
                            </span>
                        </div>
                        <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: "5px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>Devir:</span>
                            <span style={{ fontWeight: 600, color: devir >= 0 ? "var(--success)" : "var(--danger)" }}>{formatCurrency(devir)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-muted)" }}>
                                Komisyon ({komisyonOrani}%):
                            </span>
                            <span style={{ fontWeight: 600, color: "var(--warning)" }}>
                                {formatCurrency(komisyon)}
                            </span>
                        </div>
                        {(session?.user?.role === "SUPERADMIN" || session?.user?.role === "ADMIN") && araciKomisyonOrani > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-muted)" }}>
                                    Aracı Komisyon ({araciKomisyonOrani}%):
                                </span>
                                <span style={{ fontWeight: 600, color: "var(--info)" }}>
                                    {formatCurrency(araciKomisyon)}
                                </span>
                            </div>
                        )}
                        <hr style={{ border: "none", borderTop: "2px solid var(--border)", margin: "10px 0" }} />
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 700, color: "var(--text-dark)" }}>GENEL KASA:</span>
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
                    </div>
                </div>
            </div>
        </div>
    )
}
