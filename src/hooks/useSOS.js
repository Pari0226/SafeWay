import { useState, useEffect } from 'react'
import { sosAPI } from '../services/api'

export const useSOS = () => {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const response = await sosAPI.getContacts()
      setContacts(response.data.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch contacts')
    } finally {
      setLoading(false)
    }
  }

  const addContact = async (contactData) => {
    try {
      const response = await sosAPI.addContact(contactData)
      await fetchContacts()
      return { success: true, data: response.data.data }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to add contact' }
    }
  }

  const deleteContact = async (id) => {
    try {
      await sosAPI.deleteContact(id)
      await fetchContacts()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to delete contact' }
    }
  }

  const triggerAlert = async (latitude, longitude, message = '') => {
    try {
      const response = await sosAPI.triggerAlert({ latitude, longitude, message })
      return { success: true, data: response.data.data }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Failed to trigger SOS alert' }
    }
  }

  const getAlertHistory = async () => {
    try {
      const response = await sosAPI.getAlertHistory()
      return response.data.data
    } catch (err) {
      console.error('Failed to get alert history:', err)
      return []
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  return { contacts, loading, error, addContact, deleteContact, triggerAlert, getAlertHistory, refreshContacts: fetchContacts }
}
