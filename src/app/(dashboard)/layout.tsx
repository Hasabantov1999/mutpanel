import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SessionProvider } from "next-auth/react"
import DashboardWrapper from "@/components/DashboardWrapper"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) {
        redirect("/login")
    }

    return (
        <SessionProvider session={session}>
            <DashboardWrapper>
                {children}
            </DashboardWrapper>
        </SessionProvider>
    )
}
