import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET - Get single MUT
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
        }

        const { id } = await params

        const where: any = { id }

        // Role-based visibility check
        if (session.user.role === "USER") {
            where.userId = session.user.id
        } else if (session.user.role === "MANAGER") {
            where.OR = [
                { userId: session.user.id },
                { user: { createdById: session.user.id } }
            ]
        } else if (session.user.role === "ADMIN") {
            where.user = { panelId: session.user.panelId }
        }

        const mut = await prisma.mut.findFirst({
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
                        panel: { select: { name: true } }
                    }
                }
            },
        })

        if (!mut) {
            return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 })
        }

        return NextResponse.json(mut)
    } catch (error) {
        console.error("GET MUT error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}

// PUT - Update MUT
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
        }

        const { id } = await params
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

        const where: any = { id }

        // Role-based permission check
        if (session.user.role === "USER") {
            where.userId = session.user.id
        } else if (session.user.role === "MANAGER") {
            where.OR = [
                { userId: session.user.id },
                { user: { createdById: session.user.id } }
            ]
        } else if (session.user.role === "ADMIN") {
            where.user = { panelId: session.user.panelId }
        }

        const existing = await prisma.mut.findFirst({ where })

        if (!existing) {
            return NextResponse.json({ error: "Kayıt bulunamadı veya yetkiniz yok" }, { status: 404 })
        }

        await prisma.manuelYatirim.deleteMany({ where: { mutId: id } })
        await prisma.manuelCekim.deleteMany({ where: { mutId: id } })
        await prisma.teslimat.deleteMany({ where: { mutId: id } })

        const mut = await prisma.mut.update({
            where: { id },
            data: {
                isim,
                panelYatirim: parseFloat(panelYatirim) || 0,
                panelCekim: parseFloat(panelCekim) || 0,
                devir: parseFloat(devir) || 0,
                komisyonOrani: parseFloat(komisyonOrani) || 1.25,
                araciKomisyonOrani: araciKomisyonOrani ? parseFloat(araciKomisyonOrani) : null,
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

        return NextResponse.json(mut)
    } catch (error) {
        console.error("PUT MUT error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}

// DELETE - Delete MUT
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
        }

        const { id } = await params

        const where: any = { id }

        // Role-based permission check
        if (session.user.role === "USER") {
            where.userId = session.user.id
        } else if (session.user.role === "MANAGER") {
            where.OR = [
                { userId: session.user.id },
                { user: { createdById: session.user.id } }
            ]
        } else if (session.user.role === "ADMIN") {
            where.user = { panelId: session.user.panelId }
        }

        const existing = await prisma.mut.findFirst({ where })

        if (!existing) {
            return NextResponse.json({ error: "Kayıt bulunamadı veya yetkiniz yok" }, { status: 404 })
        }

        await prisma.mut.delete({ where: { id } })

        return NextResponse.json({ message: "Kayıt silindi" })
    } catch (error) {
        console.error("DELETE MUT error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}
