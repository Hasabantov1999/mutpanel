import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface RouteParams {
    params: { id: string }
}

// GET - Get single MUT
export async function GET(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
        }

        const { id } = params

        const mut = await prisma.mut.findFirst({
            where: { id, userId: session.user.id },
            include: {
                manuelYatirimlar: true,
                manuelCekimler: true,
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
    { params }: RouteParams
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
        }

        const { id } = params
        const body = await request.json()
        const {
            panelYatirim,
            panelCekim,
            devir,
            komisyonOrani,
            manuelYatirimlar,
            manuelCekimler,
        } = body

        const existing = await prisma.mut.findFirst({
            where: { id, userId: session.user.id },
        })

        if (!existing) {
            return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 })
        }

        await prisma.manuelYatirim.deleteMany({ where: { mutId: id } })
        await prisma.manuelCekim.deleteMany({ where: { mutId: id } })

        const mut = await prisma.mut.update({
            where: { id },
            data: {
                panelYatirim: parseFloat(panelYatirim) || 0,
                panelCekim: parseFloat(panelCekim) || 0,
                devir: parseFloat(devir) || 0,
                komisyonOrani: parseFloat(komisyonOrani) || 1.25,
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

        return NextResponse.json(mut)
    } catch (error) {
        console.error("PUT MUT error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}

// DELETE - Delete MUT
export async function DELETE(
    request: NextRequest,
    { params }: RouteParams
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
        }

        const { id } = params

        const existing = await prisma.mut.findFirst({
            where: { id, userId: session.user.id },
        })

        if (!existing) {
            return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 })
        }

        await prisma.mut.delete({ where: { id } })

        return NextResponse.json({ message: "Kayıt silindi" })
    } catch (error) {
        console.error("DELETE MUT error:", error)
        return NextResponse.json({ error: "Bir hata oluştu" }, { status: 500 })
    }
}
