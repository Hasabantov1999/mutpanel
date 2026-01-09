import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET all users (admin/manager only)
export async function GET() {
    const session = await auth()

    if (!session?.user || !["SUPERADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const where: any = {}

        // Hiyerarşik Filtreleme
        if (session.user.role === "ADMIN") {
            where.panelId = session.user.panelId
        } else if (session.user.role === "MANAGER") {
            where.OR = [
                { id: session.user.id },
                { createdById: session.user.id }
            ]
        }

        const users = await prisma.user.findMany({
            where,
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
            } as any,
            orderBy: { createdAt: "desc" }
        })
        return NextResponse.json(users)
    } catch (error) {
        console.error("Failed to fetch users:", error)
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }
}

// POST create new user (superadmin, admin, manager)
export async function POST(request: NextRequest) {
    const session = await auth()

    if (!session?.user || !["SUPERADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { username, firstName, lastName, email, password, role, panelId, groupName } = await request.json()

        // Validation
        if (!username || !firstName || !lastName || !email || !password) {
            return NextResponse.json({ error: "Tüm alanları doldurun" }, { status: 400 })
        }

        // Yetki Kontrolü (Hiyerarşik Kısıtlamalar)
        if (session.user.role === "SUPERADMIN") {
            if (role !== "ADMIN") {
                return NextResponse.json({ error: "SuperAdmin sadece Admin oluşturabilir" }, { status: 403 })
            }
        } else if (session.user.role === "ADMIN") {
            if (role !== "MANAGER") {
                return NextResponse.json({ error: "Admin sadece Manager oluşturabilir" }, { status: 403 })
            }
        } else if (session.user.role === "MANAGER") {
            if (role !== "USER") {
                return NextResponse.json({ error: "Manager sadece Group Holder (USER) oluşturabilir" }, { status: 403 })
            }
        }

        // Group Holder için groupName (B1 Destek vb.) zorunluluğu
        if (role === "USER" && (!groupName || groupName.trim() === "")) {
            return NextResponse.json({ error: "Group Holder için grup açıklaması (örn: B1 Destek) zorunludur" }, { status: 400 })
        }

        // Check if username exists
        const existingUsername = await prisma.user.findUnique({
            where: { username }
        })
        if (existingUsername) {
            return NextResponse.json({ error: "Bu kullanıcı adı zaten kullanılıyor" }, { status: 400 })
        }

        // Check if email exists
        const existingEmail = await prisma.user.findUnique({
            where: { email }
        })
        if (existingEmail) {
            return NextResponse.json({ error: "Bu email zaten kullanılıyor" }, { status: 400 })
        }

        let targetPanelId = panelId || null
        if (session.user.role === "ADMIN" || session.user.role === "MANAGER") {
            targetPanelId = session.user.panelId || null
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                username,
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: role || "USER",
                panelId: targetPanelId,
                groupName: groupName || null,
                createdById: session.user.id,
            } as any,
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

        return NextResponse.json(user, { status: 201 })
    } catch (error) {
        console.error("Failed to create user:", error)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }
}
