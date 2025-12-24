import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET - Get user's notifications
export async function GET() {
    const session = await auth()

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 50
        })

        const unreadCount = await prisma.notification.count({
            where: {
                userId: session.user.id,
                read: false
            }
        })

        return NextResponse.json({ notifications, unreadCount })
    } catch (error) {
        console.error("Failed to fetch notifications:", error)
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }
}

// PUT - Mark notifications as read
export async function PUT(request: NextRequest) {
    const session = await auth()

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { notificationIds, markAll } = await request.json()

        if (markAll) {
            await prisma.notification.updateMany({
                where: {
                    userId: session.user.id,
                    read: false
                },
                data: { read: true }
            })
        } else if (notificationIds && notificationIds.length > 0) {
            await prisma.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: session.user.id
                },
                data: { read: true }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to update notifications:", error)
        return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
    }
}
