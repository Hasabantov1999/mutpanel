import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function checkDatabase() {
    try {
        console.log('🔍 Checking database connection...')
        await prisma.$connect()
        console.log('✅ Database connected\n')

        console.log('👥 Checking users...')
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                firstName: true,
                lastName: true,
            }
        })

        if (users.length === 0) {
            console.log('⚠️  No users found in database')
        } else {
            console.log(`Found ${users.length} user(s):`)
            users.forEach(user => {
                console.log(`  - ${user.username} (${user.email}) - ${user.role}`)
            })
        }

        console.log('\n📊 Database statistics:')
        const panelCount = await prisma.panel.count()
        const mutCount = await prisma.mut.count()
        const notificationCount = await prisma.notification.count()
        
        console.log(`  Panels: ${panelCount}`)
        console.log(`  Muts: ${mutCount}`)
        console.log(`  Notifications: ${notificationCount}`)

    } catch (error) {
        console.error('❌ Error:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

checkDatabase()
