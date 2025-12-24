import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET all panels (admin only)
export async function GET() {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const panels = await prisma.panel.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { createdAt: "desc" }
        })
        return NextResponse.json(panels)
    } catch (error) {
        console.error("Failed to fetch panels:", error)
        return NextResponse.json({ error: "Failed to fetch panels" }, { status: 500 })
    }
}

// POST create new panel (admin only)
export async function POST(request: NextRequest) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { name } = await request.json()

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Panel adı gerekli" }, { status: 400 })
        }

        // Check if panel name already exists
        const existingPanel = await prisma.panel.findUnique({
            where: { name: name.trim() }
        })

        if (existingPanel) {
            return NextResponse.json({ error: "Bu panel adı zaten kullanılıyor" }, { status: 400 })
        }

        const panel = await prisma.panel.create({
            data: { name: name.trim() }
        })

        return NextResponse.json(panel, { status: 201 })
    } catch (error) {
        console.error("Failed to create panel:", error)
        return NextResponse.json({ error: "Failed to create panel" }, { status: 500 })
    }
}
