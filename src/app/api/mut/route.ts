import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - List MUTs (role-based filtering)
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")
        const status = searchParams.get("status")
        const userId = searchParams.get("userId")

        const where: Record<string, unknown> = {}

        // Role-based filtering
        if (session.user.role === "USER") {
            // Users can only see their own MUTs
            where.userId = session.user.id
        } else if (session.user.role === "ADMIN") {
            // Admins can filter by userId or see all
            if (userId) {
                where.userId = userId
            }
        }

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate + "T23:59:59.999Z"),
            }
        }

        if (status) {
            where.status = status
        }

        const muts = await prisma.mut.findMany({
            where,
            include: {
                manuelYatirimlar: true,
                manuelCekimler: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        panel: { select: { name: true } }
                    }
                },
                approvedBy: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(muts)
    } catch (error) {
        console.error("GET MUT error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}

// POST - Create new MUT
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
        }

        const body = await request.json()
        const {
            panelYatirim,
            panelCekim,
            devir,
            komisyonOrani,
            manuelYatirimlar,
            manuelCekimler,
        } = body

        // Determine initial status based on role
        const initialStatus = session.user.role === "ADMIN" ? "APPROVED" : "PENDING"

        const mut = await prisma.mut.create({
            data: {
                panelYatirim: parseFloat(panelYatirim) || 0,
                panelCekim: parseFloat(panelCekim) || 0,
                devir: parseFloat(devir) || 0,
                komisyonOrani: parseFloat(komisyonOrani) || 1.25,
                userId: session.user.id,
                status: initialStatus,
                // If admin creates MUT, auto-approve
                approvedById: session.user.role === "ADMIN" ? session.user.id : null,
                approvedAt: session.user.role === "ADMIN" ? new Date() : null,
                manuelYatirimlar: {
                    create: manuelYatirimlar?.map((m: { isim: string; miktar: number }) => ({
                        isim: m.isim,
                        miktar: parseFloat(String(m.miktar)) || 0,
                    })) || [],
                },
                manuelCekimler: {
                    create: manuelCekimler?.map((m: { isim: string; miktar: number }) => ({
                        isim: m.isim,
                        miktar: parseFloat(String(m.miktar)) || 0,
                    })) || [],
                },
            },
            include: {
                manuelYatirimlar: true,
                manuelCekimler: true,
            },
        })

        return NextResponse.json(mut, { status: 201 })
    } catch (error) {
        console.error("POST MUT error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}
