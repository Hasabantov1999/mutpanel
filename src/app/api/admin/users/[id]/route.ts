import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET single user
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
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                panelId: true,
                panel: { select: { name: true } },
                createdById: true,
                createdBy: { select: { firstName: true, lastName: true } },
                createdAt: true,
                _count: { select: { muts: true } }
            }
        })

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error("Failed to fetch user:", error)
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
    }
}

// PUT update user
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
        const { username, firstName, lastName, email, password, role, panelId } = await request.json()

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { id } })
        if (!existingUser) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
        }

        // Prevent modifying default admin
        if (existingUser.username === "admin" && (username !== "admin" || role !== "ADMIN")) {
            return NextResponse.json({ error: "Default admin hesabı değiştirilemez" }, { status: 400 })
        }

        // Check if username is taken by another user
        if (username && username !== existingUser.username) {
            const userWithUsername = await prisma.user.findUnique({ where: { username } })
            if (userWithUsername) {
                return NextResponse.json({ error: "Bu kullanıcı adı zaten kullanılıyor" }, { status: 400 })
            }
        }

        // Check if email is taken by another user
        if (email && email !== existingUser.email) {
            const userWithEmail = await prisma.user.findUnique({ where: { email } })
            if (userWithEmail) {
                return NextResponse.json({ error: "Bu email zaten kullanılıyor" }, { status: 400 })
            }
        }

        // Build update data
        const updateData: Record<string, unknown> = {}
        if (username) updateData.username = username
        if (firstName) updateData.firstName = firstName
        if (lastName) updateData.lastName = lastName
        if (email) updateData.email = email
        if (role) updateData.role = role
        if (password) updateData.password = await bcrypt.hash(password, 10)

        // Handle panel assignment
        if (role === "ADMIN") {
            updateData.panelId = null
        } else if (panelId !== undefined) {
            updateData.panelId = panelId
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                panelId: true,
                panel: { select: { name: true } },
                createdAt: true
            }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error("Failed to update user:", error)
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }
}

// DELETE user
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
        const user = await prisma.user.findUnique({ where: { id } })

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
        }

        // Prevent deleting default admin
        if (user.username === "admin") {
            return NextResponse.json({ error: "Default admin hesabı silinemez" }, { status: 400 })
        }

        // Prevent self-deletion
        if (user.id === session.user.id) {
            return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz" }, { status: 400 })
        }

        await prisma.user.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete user:", error)
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }
}
