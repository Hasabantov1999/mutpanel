"use client"

import { useSession } from "next-auth/react"
import { signOut } from "next-auth/react"

export default function ProfilePage() {
    const { data: session } = useSession()

    return (
        <div className="profile-page">
            <div className="page-header">
                <h1 className="page-title">Profil</h1>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px" }}>
                {/* Profile Card */}
                <div className="form-card" style={{ textAlign: "center" }}>
                    <div
                        style={{
                            width: "120px",
                            height: "120px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, var(--primary), var(--success))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 20px",
                            fontSize: "48px",
                            fontWeight: 700,
                            color: "white",
                        }}
                    >
                        {session?.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <h2 style={{ color: "var(--text-dark)", marginBottom: "5px" }}>
                        {session?.user?.name || "Kullanıcı"}
                    </h2>
                    <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
                        {session?.user?.email || "email@example.com"}
                    </p>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="btn btn-danger"
                        style={{ width: "100%" }}
                    >
                        🚪 Çıkış Yap
                    </button>
                </div>

                {/* Info Card */}
                <div className="form-card">
                    <h3 style={{ marginBottom: "25px", color: "var(--text-dark)" }}>
                        Hesap Bilgileri
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div>
                            <label className="form-label">Ad Soyad</label>
                            <input
                                type="text"
                                className="form-input"
                                value={session?.user?.name || ""}
                                disabled
                            />
                        </div>
                        <div>
                            <label className="form-label">Email</label>
                            <input
                                type="email"
                                className="form-input"
                                value={session?.user?.email || ""}
                                disabled
                            />
                        </div>
                        <div>
                            <label className="form-label">Hesap Durumu</label>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                                <span className="badge badge-success">✓ Aktif</span>
                                <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                                    Email doğrulanmış
                                </span>
                            </div>
                        </div>
                    </div>

                    <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "30px 0" }} />

                    <h3 style={{ marginBottom: "25px", color: "var(--text-dark)" }}>
                        Güvenlik
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                        <button className="btn btn-secondary" disabled>
                            🔑 Şifre Değiştir (Yakında)
                        </button>
                        <button className="btn btn-secondary" disabled>
                            📱 2FA Etkinleştir (Yakında)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
