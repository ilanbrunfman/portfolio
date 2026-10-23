import { execSync } from 'node:child_process'

// Runs once before all tests: bring the test database up to date with
// every migration (creates it on the first run).
export default function setup() {
    execSync('npx prisma migrate deploy', { stdio: 'pipe', env: process.env })
}
