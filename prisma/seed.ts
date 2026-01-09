import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    console.log('🌱 Starting database seed...')
    
    try {
        // Test database connection
        await prisma.$connect()
        console.log('✅ Database connection successful')
        
        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { username: 'admin' }
        })

        if (!existingAdmin) {
            console.log('👤 Creating admin user...')
            const hashedPassword = await bcrypt.hash('admin', 10)

            const admin = await prisma.user.create({
                data: {
                    username: 'admin',
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@mutpanel.com',
                    password: hashedPassword,
                    role: 'ADMIN',
                }
            })

            console.log('✅ Default admin user created successfully')
            console.log('   Username: admin')
            console.log('   Password: admin')
            console.log('   ID:', admin.id)
        } else {
            console.log('ℹ️  Admin user already exists')
            console.log('   Username:', existingAdmin.username)
            console.log('   ID:', existingAdmin.id)
        }
        
        // Verify the user can be found
        const verifyAdmin = await prisma.user.findUnique({
            where: { username: 'admin' }
        })
        
        if (verifyAdmin) {
            console.log('✅ Admin user verified in database')
        } else {
            throw new Error('Admin user not found after creation')
        }
        
    } catch (error) {
        console.error('❌ Error during seeding:', error)
        throw error
    }
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        console.log('👋 Database connection closed')
    })
