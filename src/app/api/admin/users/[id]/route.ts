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

    if (!session?.user || !["SUPERADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
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
                groupName: true,
                panelId: true,
                panel: { select: { name: true, id: true } },
                createdById: true,
                createdBy: { select: { firstName: true, lastName: true, role: true } },
                createdAt: true,
                _count: { select: { muts: true } }
            } as any
        })

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
        }

        // Yetki Kontrolü
        if (session.user.role === "ADMIN") {
            if ((user as any).panelId !== session.user.panelId) {
                return NextResponse.json({ error: "Bu kullanıcıyı görme yetkiniz yok" }, { status: 403 })
            }
        } else if (session.user.role === "MANAGER") {
            if ((user as any).createdById !== session.user.id && (user as any).id !== session.user.id) {
                return NextResponse.json({ error: "Bu kullanıcıyı görme yetkiniz yok" }, { status: 403 })
            }
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

    if (!session?.user || !["SUPERADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        const { username, firstName, lastName, email, password, role, panelId, groupName } = await request.json()

        const existingUser = await prisma.user.findUnique({ where: { id } })
        if (!existingUser) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
        }

        // Yetki Kontrolü
        if (session.user.role === "ADMIN") {
            if (existingUser.panelId !== session.user.panelId) {
                return NextResponse.json({ error: "Bu kullanıcıyı düzenleme yetkiniz yok" }, { status: 403 })
            }
            if (role && (role === "SUPERADMIN" || role === "ADMIN")) {
                return NextResponse.json({ error: "Bu role yükseltme yetkiniz yok" }, { status: 403 })
            }
        } else if (session.user.role === "MANAGER") {
            if (existingUser.createdById !== session.user.id && existingUser.id !== session.user.id) {
                return NextResponse.json({ error: "Bu kullanıcıyı düzenleme yetkiniz yok" }, { status: 403 })
            }
            if (role && role !== "USER" && existingUser.id !== session.user.id) {
                return NextResponse.json({ error: "Sadece Group Holder (USER) rolü verebilirsiniz" }, { status: 403 })
            }
        }

        // Group Holder için groupName zorunluluğu (eğer rol USER ise veya USER'a çekiliyorsa)
        const targetRole = role || (existingUser as any).role
        if (targetRole === "USER" && groupName !== undefined && (!groupName || groupName.trim() === "")) {
            return NextResponse.json({ error: "Group Holder için grup açıklaması (örn: B1 Destek) zorunludur" }, { status: 400 })
        }

        if (existingUser.username === "hekimfinance" && (username !== "hekimfinance" || (role && role !== "SUPERADMIN"))) {
            return NextResponse.json({ error: "SuperAdmin hesabı değiştirilemez" }, { status: 400 })
        }

        if (username && username !== existingUser.username) {
            const userWithUsername = await prisma.user.findUnique({ where: { username } })
            if (userWithUsername) {
                return NextResponse.json({ error: "Bu kullanıcı adı zaten kullanılıyor" }, { status: 400 })
            }
        }

        if (email && email !== existingUser.email) {
            const userWithEmail = await prisma.user.findUnique({ where: { email } })
            if (userWithEmail) {
                return NextResponse.json({ error: "Bu email zaten kullanılıyor" }, { status: 400 })
            }
        }

        const updateData: any = {}
        if (username) updateData.username = username
        if (firstName) updateData.firstName = firstName
        if (lastName) updateData.lastName = lastName
        if (email) updateData.email = email
        if (role) updateData.role = role
        if (groupName !== undefined) updateData.groupName = groupName
        if (password) updateData.password = await bcrypt.hash(password, 10)

        if (panelId !== undefined) {
            // Sadece SuperAdmin panel değiştirebilir, Admin/Manager kendi panelinde kalır
            if (session.user.role === "SUPERADMIN") {
                updateData.panelId = panelId
            }
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
                groupName: true,
                panelId: true,
                panel: { select: { name: true } },
                createdAt: true
            } as any
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

    if (!session?.user || !["SUPERADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    try {
        const user = await prisma.user.findUnique({ where: { id } })

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 })
        }

        // Yetki Kontrolü
        if (session.user.role === "ADMIN") {
            if ((user as any).panelId !== session.user.panelId || (user as any).role === "ADMIN" || (user as any).role === "SUPERADMIN") {
                return NextResponse.json({ error: "Bu kullanıcıyı silme yetkiniz yok" }, { status: 403 })
            }
        } else if (session.user.role === "MANAGER") {
            if ((user as any).createdById !== session.user.id) {
                return NextResponse.json({ error: "Bu kullanıcıyı silme yetkiniz yok" }, { status: 403 })
            }
        }

        if ((user as any).username === "hekimfinance") {
            return NextResponse.json({ error: "SuperAdmin hesabı silinemez" }, { status: 400 })
        }

        if ((user as any).id === session.user.id) {
            return NextResponse.json({ error: "Kendi hesabınızı silemezsiniz" }, { status: 400 })
        }

        await prisma.user.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Failed to delete user:", error)
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }
}
