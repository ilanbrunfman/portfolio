// Adds a random day of service for today to the database (deletes nothing).
//   npm run db:today:taim
// See prisma/seeds/taimToday.js.

try {
    process.loadEnvFile() // when run directly with `node prisma/today.js`
} catch {
    // env already set
}

const { prisma } = await import('../src/shared/db.js')
const { seedToday } = await import('./seeds/taimToday.js')

try {
    console.log(await seedToday(prisma))
} catch (err) {
    console.error(`Ta'im today: ${err.message}`)
    process.exitCode = 1
} finally {
    await prisma.$disconnect()
}
