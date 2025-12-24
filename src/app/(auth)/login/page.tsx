"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const result = await signIn("credentials", {
                username,
                password,
                redirect: false
            })

            if (result?.error) {
                setError("Kullanıcı adı veya şifre hatalı")
            } else {
                router.push("/dashboard")
            }
        } catch {
            setError("Bir hata oluştu")
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="auth-cover-wrapper">
            <div className="auth-cover-content-inner">
                <div className="auth-cover-content-wrapper">
                    <div className="auth-img">
                        <div className="auth-illustration">
                            <svg viewBox="0 0 400 300" className="illustration-svg">
                                <defs>
                                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#3454d1', stopOpacity: 0.2 }} />
                                        <stop offset="100%" style={{ stopColor: '#17c666', stopOpacity: 0.2 }} />
                                    </linearGradient>
                                </defs>
                                <rect fill="url(#grad1)" width="400" height="300" rx="20" />
                                <circle cx="200" cy="120" r="60" fill="#3454d1" opacity="0.3" />
                                <circle cx="200" cy="120" r="40" fill="#3454d1" opacity="0.5" />
                                <rect x="150" y="180" width="100" height="80" rx="10" fill="#17c666" opacity="0.3" />
                                <rect x="170" y="200" width="60" height="40" rx="5" fill="#17c666" opacity="0.5" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            <div className="auth-cover-sidebar-inner">
                <div className="auth-cover-card-wrapper">
                    <div className="auth-cover-card p-sm-5">
                        <div className="wd-50 mb-5">
                            <div className="logo-icon">
                                <svg width="50" height="50" viewBox="0 0 50 50">
                                    <defs>
                                        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: '#3454d1' }} />
                                            <stop offset="100%" style={{ stopColor: '#17c666' }} />
                                        </linearGradient>
                                    </defs>
                                    <rect width="50" height="50" rx="12" fill="url(#logoGrad)" />
                                    <text x="25" y="33" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">M</text>
                                </svg>
                            </div>
                        </div>
                        <h2 className="fs-20 fw-bolder mb-4">Giriş Yap</h2>
                        <h4 className="fs-13 fw-bold mb-2">MUT Panel&apos;e Hoşgeldiniz</h4>
                        <p className="fs-12 fw-medium text-muted">Devam etmek için kullanıcı bilgilerinizi girin.</p>

                        {error && (
                            <div className="alert alert-soft-danger-message mt-3" role="alert">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="w-100 mt-4 pt-2">
                            <div className="mb-4">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Kullanıcı adı"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    disabled={loading}
                                    autoComplete="username"
                                />
                            </div>
                            <div className="mb-3">
                                <input
                                    type="password"
                                    className="form-control"
                                    placeholder="Şifre"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                                <div>
                                    <div className="custom-control custom-checkbox">
                                        <input type="checkbox" className="custom-control-input" id="rememberMe" />
                                        <label className="custom-control-label c-pointer" htmlFor="rememberMe">Beni Hatırla</label>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-5">
                                <button
                                    type="submit"
                                    className="btn btn-lg btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
                                </button>
                            </div>
                        </form>
                        <div className="mt-5 text-muted text-center">
                            <small>© 2024 MUT Panel. Tüm hakları saklıdır.</small>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
