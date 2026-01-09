import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateMutFinances } from "@/lib/calculations"
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
        const panelId = searchParams.get("panelId")

        const where: any = {}

        // Hiyerarşik Filtreleme
        if (session.user.role === "USER") {
            where.userId = session.user.id
        } else if (session.user.role === "MANAGER") {
            where.OR = [
                { userId: session.user.id },
                { user: { createdById: session.user.id } }
            ]
        } else if (session.user.role === "ADMIN") {
            where.user = { panelId: session.user.panelId }
        } else if (session.user.role === "SUPERADMIN") {
            if (panelId) {
                where.user = { panelId: panelId }
            }
        }

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
                teslimatlar: true,
            },
            orderBy: { createdAt: "desc" },
        }) as any[]

        // Calculate totals
        let toplamPanelYatirim = 0
        let toplamPanelCekim = 0
        let toplamManuelYatirim = 0
        let toplamManuelCekim = 0
        let toplamTeslimat = 0
        let toplamDevir = 0
        let toplamKomisyon = 0
        let toplamAraciKomisyon = 0
        let toplamTeslimatMasrafi = 0

        // Daily data for charts
        const dailyData: Record<string, { yatirim: number; cekim: number }> = {}

        muts.forEach((mut) => {
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

            toplamPanelYatirim += (mut.panelYatirim || 0)
            toplamPanelCekim += (mut.panelCekim || 0)
            toplamManuelYatirim += finances.manuelYatirimTotal
            toplamManuelCekim += finances.manuelCekimTotal
            toplamTeslimat += finances.teslimatTotal
            toplamDevir += (mut.devir || 0)
            toplamKomisyon += finances.komisyon
            toplamAraciKomisyon += finances.araciKomisyon
            toplamTeslimatMasrafi += finances.teslimatMasrafiTotal

            // Group by date
            const dateKey = mut.createdAt instanceof Date
                ? mut.createdAt.toISOString().split("T")[0]
                : new Date(mut.createdAt).toISOString().split("T")[0]

            if (!dailyData[dateKey]) {
                dailyData[dateKey] = { yatirim: 0, cekim: 0 }
            }
            dailyData[dateKey].yatirim += (mut.panelYatirim || 0)
            dailyData[dateKey].cekim += (mut.panelCekim || 0)
        })

        const toplamYatirim = toplamPanelYatirim + toplamManuelYatirim
        const toplamCekim = toplamPanelCekim + toplamManuelCekim

        // GENEL KASA: Seçili dönemdeki EN GÜNCEL (son) kaydın kasasını gösterir.
        // Diğer istatistikler (Yatırım, Çekim, Komisyon vb.) dönemlik TOPLAM'dır.
        let kasa = 0
        if (muts.length > 0) {
            const latestMut = muts[0]
            const latestFinances = calculateMutFinances({
                panelYatirim: latestMut.panelYatirim,
                panelCekim: latestMut.panelCekim,
                devir: latestMut.devir,
                komisyonOrani: latestMut.komisyonOrani,
                araciKomisyonOrani: latestMut.araciKomisyonOrani,
                manuelYatirimlar: latestMut.manuelYatirimlar,
                manuelCekimler: latestMut.manuelCekimler,
                teslimatlar: latestMut.teslimatlar || []
            })
            kasa = latestFinances.kasa
        }

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
                devir: toplamDevir,
                komisyon: toplamKomisyon,
                araciKomisyon: toplamAraciKomisyon,
                kasa: kasa,
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
