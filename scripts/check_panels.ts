import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const panels = await prisma.panel.findMany()
    console.log(JSON.stringify(panels, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
