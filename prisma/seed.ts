import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { username: 'admin' }
    })

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('admin', 10)

        await prisma.user.create({
            data: {
                username: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@mutpanel.com',
                password: hashedPassword,
                role: 'ADMIN',
            }
        })

        console.log('✅ Default admin user created (username: admin, password: admin)')
    } else {
        console.log('ℹ️ Admin user already exists, skipping...')
    }
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
