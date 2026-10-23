import { defineConfig } from 'vitest/config'

// Tests use their own database: the normal one + "_test" (bank → bank_test),
// so they can empty tables freely without touching your real data.
try {
    process.loadEnvFile() // doesn't overwrite variables that are already set (e.g. in CI)
} catch {
    // no .env file – use the real environment
}
const url = new URL(process.env.DATABASE_URL)
if (!url.pathname.endsWith('_test')) url.pathname += '_test'
if (!url.pathname.endsWith('_test')) throw new Error('Refusing to run tests against a non-test database')
process.env.DATABASE_URL = url.toString()

export default defineConfig({
    test: {
        environment: 'node',
        include: ['test/**/*.test.js'],
        globalSetup: ['test/globalSetup.js'],
        // One shared database → run test files one after another
        fileParallelism: false,
        env: { DATABASE_URL: process.env.DATABASE_URL },
    },
})
