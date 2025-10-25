import express from 'express'
import { getContacts, addContact, deleteContact, triggerAlert, getAlertHistory } from '../controllers/sosController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// All SOS routes require authentication
router.use(authMiddleware)

// Emergency contacts
router.get('/contacts', getContacts)
router.post('/contacts', addContact)
router.delete('/contacts/:id', deleteContact)

// SOS alerts
router.post('/alert', triggerAlert)
router.get('/alerts', getAlertHistory)
router.get('/history', getAlertHistory)

export default router
