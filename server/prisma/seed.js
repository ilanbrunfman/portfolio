// Fills the database with demo data for every project.
//   npm run db:seed          → all projects
//   npm run db:seed:bank     → only the bank tracker
//   npm run db:seed:taim     → only Ta'im
// Each project's seed wipes only its own tables first.

import { seedBank } from './seeds/bank.js'
import { seedTaim } from './seeds/taim.js'

try {
    process.loadEnvFile() // when run directly with `node prisma/seed.js`
} catch {
    // env already set (prisma db seed / hosting platform)
}

// Imported after the env is loaded: db.js reads DATABASE_URL when it loads
const { prisma } = await import('../src/shared/db.js')

const seeds = { bank: seedBank, taim: seedTaim }
const only = process.argv[2]
if (only && !seeds[only]) {
    console.error(`Unknown project "${only}". Use one of: ${Object.keys(seeds).join(', ')}`)
    process.exit(1)
}

try {
    for (const [name, seed] of Object.entries(seeds)) {
        if (!only || only === name) await seed(prisma)
    }
} finally {
    await prisma.$disconnect()
}
