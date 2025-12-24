import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST - Approve or reject a MUT (admin only)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        const { action } = await request.json()

        if (!["approve", "reject"].includes(action)) {
            return NextResponse.json({ error: "Geçersiz işlem" }, { status: 400 })
        }

        const mut = await prisma.mut.findUnique({
            where: { id },
            include: { user: true }
        })

        if (!mut) {
            return NextResponse.json({ error: "MUT bulunamadı" }, { status: 404 })
        }

        if (mut.status !== "PENDING") {
            return NextResponse.json({ error: "Bu MUT zaten işlenmiş" }, { status: 400 })
        }

        const newStatus = action === "approve" ? "APPROVED" : "REJECTED"

        const updatedMut = await prisma.mut.update({
            where: { id },
            data: {
                status: newStatus,
                approvedById: session.user.id,
                approvedAt: new Date()
            }
        })

        const adminName = session.user.name || "Admin"
        const notificationMessage = action === "approve"
            ? `${adminName} MUT kaydınızı onayladı.`
            : `${adminName} MUT kaydınızı reddetti.`

        await prisma.notification.create({
            data: {
                message: notificationMessage,
                type: action === "approve" ? "MUT_APPROVED" : "MUT_REJECTED",
                userId: mut.userId,
                mutId: mut.id
            }
        })

        return NextResponse.json(updatedMut)
    } catch (error) {
        console.error("Failed to process MUT:", error)
        return NextResponse.json({ error: "Failed to process MUT" }, { status: 500 })
    }
}
