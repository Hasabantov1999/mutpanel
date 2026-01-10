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
        const panelId = searchParams.get("panelId")
        const search = searchParams.get("search")

        const where: any = {}

        // 1. Role-based Visibility Filtering
        if (session.user.role === "USER") {
            where.userId = session.user.id
        } else if (session.user.role === "MANAGER") {
            // Manager sees their own MUTs or MUTs of users they created
            where.OR = [
                { userId: session.user.id },
                { user: { createdById: session.user.id } }
            ]
        } else if (session.user.role === "ADMIN") {
            // Admin sees everything in their panel
            where.user = { panelId: session.user.panelId }
        } else if (session.user.role === "SUPERADMIN") {
            // SuperAdmin sees everything, can filter by panel
            if (panelId) {
                where.user = { panelId: panelId }
            }
        }

        // 2. Additional Filters
        if (userId) {
            where.userId = userId
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

        // 3. Search by Name (Mut isim field) or User name/firstName/lastName
        if (search) {
            where.OR = [
                ...(where.OR || []),
                { isim: { contains: search, mode: 'insensitive' } },
                {
                    user: {
                        OR: [
                            { username: { contains: search, mode: 'insensitive' } },
                            { firstName: { contains: search, mode: 'insensitive' } },
                            { lastName: { contains: search, mode: 'insensitive' } },
                        ]
                    }
                }
            ]
        }

        const muts = await prisma.mut.findMany({
            where,
            include: {
                manuelYatirimlar: true,
                manuelCekimler: true,
                teslimatlar: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                        groupName: true,
                        panelId: true,
                        createdById: true,
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
            isim,
            panelYatirim,
            panelCekim,
            devir,
            komisyonOrani,
            araciKomisyonOrani,
            manuelYatirimlar,
            manuelCekimler,
            teslimatlar,
        } = body

        // Determine initial status based on role
        // Admin or Manager or SuperAdmin can auto-approve their own records
        const canAutoApprove = ["SUPERADMIN", "ADMIN", "MANAGER"].includes(session.user.role)
        const initialStatus = canAutoApprove ? "APPROVED" : "PENDING"

        const mut = await prisma.mut.create({
            data: {
                isim,
                panelYatirim: parseFloat(panelYatirim) || 0,
                panelCekim: parseFloat(panelCekim) || 0,
                devir: parseFloat(devir) || 0,
                komisyonOrani: parseFloat(komisyonOrani) || 1.25,
                araciKomisyonOrani: araciKomisyonOrani ? parseFloat(araciKomisyonOrani) : null,
                userId: session.user.id,
                status: initialStatus,
                approvedById: canAutoApprove ? session.user.id : null,
                approvedAt: canAutoApprove ? new Date() : null,
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
                teslimatlar: {
                    create: teslimatlar?.map((m: { isim: string; miktar: number; komisyonOrani?: number }) => ({
                        isim: m.isim,
                        miktar: parseFloat(String(m.miktar)) || 0,
                        komisyonOrani: m.komisyonOrani ? parseFloat(String(m.komisyonOrani)) : null,
                    })) || [],
                },
            },
            include: {
                manuelYatirimlar: true,
                manuelCekimler: true,
                teslimatlar: true,
            },
        })

        return NextResponse.json(mut, { status: 201 })
    } catch (error) {
        console.error("POST MUT error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}
