import app from './app.js'
import { startAutoClose } from './projects/taim/autoClose.js'

const PORT = Number(process.env.PORT) || 4000

app.listen(PORT, () => {
    console.log(`API ready on http://localhost:${PORT}`)
    // Ta'im: close the business day at the set time if nobody did
    startAutoClose()
})
