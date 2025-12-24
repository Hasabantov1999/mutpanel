"use client"

import { ThemeProvider } from "@/components/ThemeProvider"
import Sidebar from "@/components/Sidebar"
import Header from "@/components/Header"
import "@/styles/dashboard.css"

interface DashboardWrapperProps {
    children: React.ReactNode
}

export default function DashboardWrapper({ children }: DashboardWrapperProps) {
    return (
        <ThemeProvider>
            <div className="app-wrapper">
                <Sidebar />
                <div className="main-wrapper">
                    <Header />
                    <main className="main-content">
                        {children}
                    </main>
                </div>
            </div>
        </ThemeProvider>
    )
}
