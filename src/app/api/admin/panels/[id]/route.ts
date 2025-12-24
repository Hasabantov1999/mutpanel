import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET single panel
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        const panel = await prisma.panel.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        username: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        })

        if (!panel) {
            return NextResponse.json({ error: "Panel bulunamadı" }, { status: 404 })
        }

        return NextResponse.json(panel)
    } catch (error) {
        console.error("Failed to fetch panel:", error)
        return NextResponse.json({ error: "Failed to fetch panel" }, { status: 500 })
    }
}

// PUT update panel
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        const { name } = await request.json()

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Panel adı gerekli" }, { status: 400 })
        }

        // Check if name is taken by another panel
        const existingPanel = await prisma.panel.findFirst({
            where: {
                name: name.trim(),
                NOT: { id }
            }
        })

        if (existingPanel) {
            return NextResponse.json({ error: "Bu panel adı zaten kullanılıyor" }, { status: 400 })
        }

        const panel = await prisma.panel.update({
            where: { id },
            data: { name: name.trim() }
        })

        return NextResponse.json(panel)
    } catch (error) {
        console.error("Failed to update panel:", error)
        return NextResponse.json({ error: "Failed to update panel" }, { status: 500 })
    }
}

// DELETE panel
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        // Check if panel has users
        const panel = await prisma.panel.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } }
        })

        if (!panel) {
            return NextResponse.json({ error: "Panel bulunamadı" }, { status: 404 })
        }

        if (panel._count.users > 0) {
            return NextResponse.json({
                error: "Bu panelde kullanıcılar var. Önce kullanıcıları başka panele taşıyın."
            }, { status: 400 })
        }

        await prisma.panel.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete panel:", error)
        return NextResponse.json({ error: "Failed to delete panel" }, { status: 500 })
    }
}
