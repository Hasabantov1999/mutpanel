"use client"

import { ThemeProvider } from "@/components/ThemeProvider"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import "@/styles/dashboard.css"

interface DashboardWrapperProps {
    children: React.ReactNode
    user?: {
        name?: string | null
        email?: string | null
    }
}

export default function DashboardWrapper({ children, user }: DashboardWrapperProps) {
    return (
        <ThemeProvider>
            <div className="app-wrapper">
                <Sidebar />
                <div className="main-wrapper">
                    <Header user={user} />
                    <main className="main-content">
                        {children}
                    </main>
                </div>
            </div>
        </ThemeProvider>
    )
}
