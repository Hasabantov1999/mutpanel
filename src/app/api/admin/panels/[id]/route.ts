import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET single panel
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()

    // Allow SUPERADMIN, ADMIN, MANAGER to view panel details
    if (!session?.user || !["SUPERADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
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

    if (!session?.user || !["SUPERADMIN", "ADMIN"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        const { name } = await request.json()

        if (!name || name.trim() === "") {
            return NextResponse.json({ error: "Panel adı gerekli" }, { status: 400 })
        }

        // Check name uniqueness (excluding current panel)
        const existing = await prisma.panel.findFirst({
            where: {
                name: name.trim(),
                NOT: { id }
            }
        })

        if (existing) {
            return NextResponse.json({ error: "Bu isimde başka bir panel var: " + name }, { status: 400 })
        }

        const updated = await prisma.panel.update({
            where: { id },
            data: { name: name.trim() }
        })

        return NextResponse.json(updated)
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

    // Check if user is SUPERADMIN
    if (!session?.user || session.user.role !== "SUPERADMIN") {
        return NextResponse.json({ error: "Sadece Super Admin panel silebilir" }, { status: 403 })
    }

    const { id } = await params

    try {
        const panel = await prisma.panel.findUnique({
            where: { id },
            include: { _count: { select: { users: true } } }
        })

        if (!panel) {
            return NextResponse.json({ error: "Panel bulunamadı" }, { status: 404 })
        }

        // Use a transaction to ensure clean cleanup
        await prisma.$transaction(async (tx) => {
            // First delete users (this might cascade to MUTs etc depending on schema, but let's be explicit)
            // Note: If schema has onDelete: Cascade on user->panel relation, this Step 1 is implicit but harmless.
            // If schema restricts, we must delete explicitly.

            // Delete all users in panel
            if (panel._count.users > 0) {
                await tx.user.deleteMany({
                    where: { panelId: id }
                })
            }

            // Then delete panel
            await tx.panel.delete({
                where: { id }
            })
        })

        return NextResponse.json({ success: true, message: "Panel ve kullanıcıları başarıyla silindi" })
    } catch (error) {
        console.error("Failed to delete panel:", error)
        return NextResponse.json({ error: "Panel silinirken bir hata oluştu" }, { status: 500 })
    }
}
