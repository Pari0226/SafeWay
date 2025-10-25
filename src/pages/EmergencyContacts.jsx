import { useState } from 'react'
import { useSOS } from '../hooks/useSOS'
import Header from '../components/Header'

const EmergencyContacts = () => {
  const { contacts, loading, addContact, deleteContact } = useSOS()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', relation: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await addContact(formData)
    if (result.success) {
      setFormData({ name: '', phone: '', relation: '' })
      setShowForm(false)
    } else {
      // eslint-disable-next-line no-alert
      alert(result.error)
    }
  }

  const handleDelete = async (id) => {
    // eslint-disable-next-line no-alert
    if (confirm('Are you sure you want to delete this contact?')) {
      const result = await deleteContact(id)
      if (!result.success) {
        // eslint-disable-next-line no-alert
        alert(result.error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20 px-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emergency Contacts</h1>
            <p className="text-gray-600 mt-1">Manage your trusted contacts for SOS alerts</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700"
          >
            {showForm ? 'Cancel' : '+ Add Contact'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Contact</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  required
                  pattern="[6-9]\\d{9}"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="9876543210"
                />
                <p className="text-xs text-gray-500 mt-1">10-digit Indian mobile number</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relation (Optional)</label>
                <input
                  type="text"
                  value={formData.relation}
                  onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="Mother, Friend, etc."
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600"
              >
                Save Contact
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-600">Loading contacts...</div>
          </div>
        ) : contacts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Emergency Contacts</h3>
            <p className="text-gray-600 mb-6">Add trusted contacts who will receive your SOS alerts</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700"
            >
              Add Your First Contact
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="bg-white rounded-xl shadow-md p-6 flex items-center justify-between hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{contact.name}</h3>
                    <p className="text-gray-600">{contact.phone}</p>
                    {contact.relation && (
                      <p className="text-sm text-gray-500">{contact.relation}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmergencyContacts
