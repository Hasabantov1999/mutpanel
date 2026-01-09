import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Create a panel
    const panel = await prisma.panel.upsert({
        where: { name: 'Test Panel' },
        update: {},
        create: { name: 'Test Panel' }
    })
    console.log('Panel created:', panel.id)

    // Create manager user
    const hashedPassword = await bcrypt.hash('12345678', 10)
    const manager = await prisma.user.upsert({
        where: { username: 'cansiz' },
        update: {
            password: hashedPassword,
            role: 'MANAGER',
            panelId: panel.id
        },
        create: {
            username: 'cansiz',
            firstName: 'Cansiz',
            lastName: 'Manager',
            email: 'cansiz@test.com',
            password: hashedPassword,
            role: 'MANAGER',
            panelId: panel.id
        }
    })
    console.log('Manager created:', manager.username)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
