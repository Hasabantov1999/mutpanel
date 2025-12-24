import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")

        const where: Record<string, unknown> = { userId: session.user.id }

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate + "T23:59:59.999Z"),
            }
        }

        const muts = await prisma.mut.findMany({
            where,
            include: {
                manuelYatirimlar: true,
                manuelCekimler: true,
            },
            orderBy: { createdAt: "desc" },
        })

        // Calculate totals
        let toplamPanelYatirim = 0
        let toplamPanelCekim = 0
        let toplamManuelYatirim = 0
        let toplamManuelCekim = 0
        let toplamDevir = 0
        let toplamKomisyon = 0

        // Daily data for charts
        const dailyData: Record<string, { yatirim: number; cekim: number }> = {}

        muts.forEach((mut) => {
            const manuelYatirimTotal = mut.manuelYatirimlar.reduce((sum, m) => sum + m.miktar, 0)
            const manuelCekimTotal = mut.manuelCekimler.reduce((sum, m) => sum + m.miktar, 0)
            const mutToplamYatirim = mut.panelYatirim + manuelYatirimTotal

            toplamPanelYatirim += mut.panelYatirim
            toplamPanelCekim += mut.panelCekim
            toplamManuelYatirim += manuelYatirimTotal
            toplamManuelCekim += manuelCekimTotal
            toplamDevir += mut.devir
            toplamKomisyon += mutToplamYatirim * (mut.komisyonOrani / 100)

            // Group by date
            const dateKey = mut.createdAt.toISOString().split("T")[0]
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { yatirim: 0, cekim: 0 }
            }
            dailyData[dateKey].yatirim += mut.panelYatirim
            dailyData[dateKey].cekim += mut.panelCekim
        })

        const toplamYatirim = toplamPanelYatirim + toplamManuelYatirim
        const toplamCekim = toplamPanelCekim + toplamManuelCekim
        const kasa = toplamYatirim - toplamCekim + toplamDevir

        // Prepare chart data
        const sortedDates = Object.keys(dailyData).sort()
        const labels = sortedDates.map((d) => {
            const date = new Date(d)
            return `${date.getDate()}/${date.getMonth() + 1}`
        })
        const yatirimData = sortedDates.map((d) => dailyData[d].yatirim)
        const cekimData = sortedDates.map((d) => dailyData[d].cekim)

        return NextResponse.json({
            stats: {
                toplamYatirim,
                toplamCekim,
                devir: kasa,
                komisyon: toplamKomisyon,
            },
            chartData: {
                labels: labels.length > 0 ? labels : ["Veri Yok"],
                yatirim: yatirimData.length > 0 ? yatirimData : [0],
                cekim: cekimData.length > 0 ? cekimData : [0],
            },
            recentMuts: muts.slice(0, 5),
        })
    } catch (error) {
        console.error("Dashboard stats error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}
