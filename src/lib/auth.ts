import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

declare module "next-auth" {
    interface User {
        role?: string
        panelId?: string | null
        panelName?: string | null
    }
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            role: string
            panelId?: string | null
            panelName?: string | null
        }
    }
}

declare module "@auth/core/jwt" {
    interface JWT {
        id: string
        role: string
        panelId?: string | null
        panelName?: string | null
    }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { username: credentials.username as string },
                    include: { panel: true }
                })

                if (!user) {
                    return null
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                )

                if (!isPasswordValid) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    role: user.role,
                    panelId: user.panelId,
                    panelName: user.panel?.name || null,
                }
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string
                token.role = user.role as string
                token.panelId = user.panelId
                token.panelName = user.panelName
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id
                session.user.role = token.role
                session.user.panelId = token.panelId
                session.user.panelName = token.panelName
            }
            return session
        }
    },
    session: {
        strategy: "jwt"
    },
    trustHost: true
})
