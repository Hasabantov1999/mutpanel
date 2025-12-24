import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

// GET all users (admin only)
export async function GET() {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const users = await prisma.user.findMany({
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
            },
            orderBy: { createdAt: "desc" }
        })
        return NextResponse.json(users)
    } catch (error) {
        console.error("Failed to fetch users:", error)
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }
}

// POST create new user (admin only)
export async function POST(request: NextRequest) {
    const session = await auth()

    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { username, firstName, lastName, email, password, role, panelId } = await request.json()

        // Validation
        if (!username || !firstName || !lastName || !email || !password) {
            return NextResponse.json({ error: "Tüm alanları doldurun" }, { status: 400 })
        }

        if (role === "USER" && !panelId) {
            return NextResponse.json({ error: "USER rolü için panel seçimi zorunludur" }, { status: 400 })
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

        // Validate panel exists if provided
        if (panelId) {
            const panel = await prisma.panel.findUnique({ where: { id: panelId } })
            if (!panel) {
                return NextResponse.json({ error: "Seçilen panel bulunamadı" }, { status: 400 })
            }
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
                panelId: role === "ADMIN" ? null : panelId,
                createdById: session.user.id,
            },
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

        return NextResponse.json(user, { status: 201 })
    } catch (error) {
        console.error("Failed to create user:", error)
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }
}
