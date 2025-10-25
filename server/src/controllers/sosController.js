import prisma from '../config/database.js'
import Joi from 'joi'
import { sendBulkSMS } from '../services/sms.service.js'

// Validation schemas
const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required()
    .messages({
      'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number'
    }),
  relation: Joi.string().max(50).optional().allow('')
})

const alertSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  message: Joi.string().max(500).optional().allow('')
})

// Get user's emergency contacts
export const getContacts = async (req, res) => {
  try {
    const contacts = await prisma.emergencyContact.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' }
    })
    res.status(200).json({ success: true, data: contacts, count: contacts.length })
  } catch (error) {
    console.error('Get contacts error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch emergency contacts' })
  }
}

// Add emergency contact
export const addContact = async (req, res) => {
  try {
    const { error, value } = contactSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message })
    }

    const { name, phone, relation } = value

    const contact = await prisma.emergencyContact.create({
      data: { userId: req.userId, name, phone, relation: relation || null }
    })

    res.status(201).json({ success: true, data: contact, message: 'Emergency contact added successfully' })
  } catch (error) {
    console.error('Add contact error:', error)
    res.status(500).json({ success: false, error: 'Failed to add emergency contact' })
  }
}

// Delete emergency contact
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params

    const contact = await prisma.emergencyContact.findUnique({ where: { id } })
    if (!contact) {
      return res.status(404).json({ success: false, error: 'Contact not found' })
    }
    if (contact.userId !== req.userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this contact' })
    }

    await prisma.emergencyContact.delete({ where: { id } })
    res.status(200).json({ success: true, message: 'Emergency contact deleted successfully' })
  } catch (error) {
    console.error('Delete contact error:', error)
    res.status(500).json({ success: false, error: 'Failed to delete contact' })
  }
}

// Trigger SOS alert
export const triggerAlert = async (req, res) => {
  try {
    const { error, value } = alertSchema.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, error: error.details[0].message })
    }

    const { latitude, longitude, message } = value

    const contacts = await prisma.emergencyContact.findMany({ where: { userId: req.userId } })
    if (contacts.length === 0) {
      return res.status(400).json({ success: false, error: 'No emergency contacts found. Please add contacts first.' })
    }

    const alertMessage = message || '🚨 EMERGENCY! I need help.'
    const locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`
    const fullMessage = `${alertMessage}\nMy location: ${latitude}, ${longitude}\n${locationLink}`

    const phoneNumbers = contacts.map(c => c.phone)

    // Send SMS to all contacts via Twilio (bulk helper)
    const bulkResults = await sendBulkSMS(phoneNumbers, fullMessage)
    const successfulNumbers = bulkResults.filter(r => r.success).map(r => r.to)
    const failedNumbers = bulkResults.filter(r => !r.success).map(r => r.to)

    const status = successfulNumbers.length > 0 ? 'sent' : 'failed'

    const alert = await prisma.sOSAlert.create({
      data: {
        userId: req.userId,
        latitude,
        longitude,
        message: fullMessage,
        sentTo: successfulNumbers.join(','),
        status
      }
    })

    console.log('SOS Alert triggered:', {
      userId: req.userId,
      totalContacts: contacts.length,
      successful: successfulNumbers,
      failed: failedNumbers,
      message: fullMessage
    })

    res.status(201).json({
      success: true,
      data: {
        alertId: alert.id,
        message: fullMessage,
        sentTo: successfulNumbers,
        contactCount: contacts.length,
        successCount: successfulNumbers.length,
        failCount: failedNumbers.length,
        timestamp: alert.createdAt
      },
      message: `Alert sent to ${successfulNumbers.length} of ${contacts.length} contact(s)`
    })
  } catch (error) {
    console.error('Trigger alert error:', error)
    res.status(500).json({ success: false, error: 'Failed to trigger SOS alert' })
  }
}

// Get user's alert history
export const getAlertHistory = async (req, res) => {
  try {
    const alerts = await prisma.sOSAlert.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })
    res.status(200).json({ success: true, data: alerts, count: alerts.length })
  } catch (error) {
    console.error('Get alert history error:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch alert history' })
  }
}
