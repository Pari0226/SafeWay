const prisma = require('../config/database');
const smsService = require('../services/sms.service');

// Trigger SOS Alert
const triggerAlert = async (req, res) => {
  try {
    const { latitude, longitude, message } = req.body;
    const userId = req.user.id;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const contacts = await prisma.emergencyContact.findMany({
      where: { userId }
    });

    if (contacts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No emergency contacts found. Please add contacts first.'
      });
    }

    const locationUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const smsMessage = message 
      ? `${message}\n\nLocation: ${locationUrl}`
      : `🚨 EMERGENCY! I need help immediately!\n\nLocation: ${locationUrl}`;

    console.log(`📱 Sending SOS to ${contacts.length} contact(s)...`);

    const smsResults = await smsService.sendBulkSMS(contacts, smsMessage);

    const alert = await prisma.sOSAlert.create({
      data: {
        userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        message: message || 'Emergency alert triggered',
        status: 'sent'
      }
    });

    const successCount = smsResults.filter(r => r.success).length;
    const failedCount = smsResults.filter(r => !r.success).length;

    console.log(`\n📊 SOS Alert Results:`);
    console.log(`   Alert ID: ${alert.id}`);
    console.log(`   Success: ${successCount}/${contacts.length}`);
    console.log(`   Failed: ${failedCount}`);
    console.log(`   Location: ${latitude}, ${longitude}\n`);

    smsResults.filter(r => !r.success).forEach(result => {
      console.error(`   ❌ Failed to ${result.contact}: ${result.error}`);
    });

    res.status(200).json({
      success: true,
      data: {
        alertId: alert.id,
        sentTo: successCount,
        failed: failedCount,
        totalContacts: contacts.length,
        location: { latitude, longitude },
        locationUrl,
        smsResults: smsResults.map(r => ({
          contact: r.contact,
          phone: r.phone,
          success: r.success,
          simulated: r.simulated || false,
          error: r.error || null
        })),
        twilioConfigured: smsService.isConfigured()
      }
    });
  } catch (error) {
    console.error('SOS Alert error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send SOS alert'
    });
  }
};

// Get Alert History
const getAlertHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const alerts = await prisma.sOSAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Get alert history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alert history'
    });
  }
};

// Get Emergency Contacts
const getContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    const contacts = await prisma.emergencyContact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emergency contacts'
    });
  }
};

// Add Emergency Contact
const addContact = async (req, res) => {
  try {
    const { name, phone, relation } = req.body;
    const userId = req.user.id;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Name and phone are required'
      });
    }

    const contact = await prisma.emergencyContact.create({
      data: {
        userId,
        name,
        phone,
        relation: relation || 'Other'
      }
    });

    res.status(201).json({
      success: true,
      data: contact
    });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add emergency contact'
    });
  }
};

// Delete Emergency Contact
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const contact = await prisma.emergencyContact.findFirst({
      where: {
        id: parseInt(id),
        userId
      }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found'
      });
    }

    await prisma.emergencyContact.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete contact'
    });
  }
};

module.exports = {
  triggerAlert,
  getAlertHistory,
  getContacts,
  addContact,
  deleteContact
};
