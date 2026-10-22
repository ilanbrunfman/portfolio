import { defineConfig } from 'prisma/config'

// Prisma 7 doesn't read .env on its own. Node can (20.12+), so no dotenv needed.
// Wrapped in try/catch: on a host like Render there's no .env file, the
// variables are set by the platform instead.
try {
    process.loadEnvFile()
} catch {
    // no .env file – use the real environment
}

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: process.env.DATABASE_URL,
    },
})
