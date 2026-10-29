import { Router } from 'express'
import { validate } from '../../../shared/middleware/validate.js'
import { transferCreate, transferUpdate, transferParams } from '../schemas/transaction.js'
import { createTransfer, getTransfer, updateTransfer, deleteTransfer } from '../services/transfers.js'

// Transfers move money between two of your accounts (two linked rows).
// The logic lives in services/transfers.js; these routes only validate and respond.
const router = Router()

// POST /api/transfers → 201
router.post('/', validate({ body: transferCreate }), async (req, res) => {
    res.status(201).json(await createTransfer(req.user.id, req.valid.body))
})

// GET /api/transfers/:transferId
router.get('/:transferId', validate({ params: transferParams }), async (req, res) => {
    res.json(await getTransfer(req.user.id, req.valid.params.transferId))
})

// PATCH /api/transfers/:transferId
router.patch('/:transferId', validate({ params: transferParams, body: transferUpdate }), async (req, res) => {
    res.json(await updateTransfer(req.user.id, req.valid.params.transferId, req.valid.body))
})

// DELETE /api/transfers/:transferId → 204
router.delete('/:transferId', validate({ params: transferParams }), async (req, res) => {
    await deleteTransfer(req.user.id, req.valid.params.transferId)
    res.status(204).end()
})

export default router
