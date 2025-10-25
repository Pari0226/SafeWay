import twilio from 'twilio'

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, TWILIO_MESSAGING_SERVICE_SID, TWILIO_PHONE_NUMBER, NODE_ENV } = process.env

let client = null
let fromIdentity = null
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  fromIdentity = TWILIO_MESSAGING_SERVICE_SID || TWILIO_PHONE_NUMBER || TWILIO_FROM_NUMBER || null
  // eslint-disable-next-line no-console
  console.log('✅ Twilio SMS service initialized')
  if (fromIdentity) {
    // eslint-disable-next-line no-console
    console.log(`📱 Sending from: ${fromIdentity}`)
  }
}

export const formatIndianNumber = (phone) => {
  if (!phone) throw new Error('Empty phone number')
  // Keep digits only
  let digits = String(phone).replace(/\D/g, '')

  // Remove leading zeros
  digits = digits.replace(/^0+/, '')

  // If starts with country code 91 and total length 12, trim to last 10 for validation
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2)
  }

  // Ensure 10-digit Indian mobile starting with 6-9
  if (digits.length !== 10 || !/[6-9]/.test(digits[0])) {
    // If it already contains 10+ with 91 prefix, try to coerce
    const last10 = digits.slice(-10)
    if (last10.length === 10 && /[6-9]/.test(last10[0])) {
      digits = last10
    } else {
      throw new Error(`Invalid Indian mobile number: ${phone}`)
    }
  }

  return `+91${digits}`
}

export const sendSMS = async (to, body) => {
  const toE164 = formatIndianNumber(to)

  if (!client) {
    const msg = 'Twilio client not configured. Skipping SMS send.'
    if (NODE_ENV !== 'test') console.warn(msg, { to: toE164 })
    // For non-configured environments, behave as success to not block flows
    return { sid: 'mock', status: 'queued', to: toE164, body }
  }

  const params = {
    to: toE164,
    body
  }

  if (TWILIO_MESSAGING_SERVICE_SID) {
    params.messagingServiceSid = TWILIO_MESSAGING_SERVICE_SID
  } else if (TWILIO_PHONE_NUMBER || TWILIO_FROM_NUMBER) {
    params.from = TWILIO_PHONE_NUMBER || TWILIO_FROM_NUMBER
  } else {
    throw new Error('Twilio from number or messaging service SID not configured')
  }

  return client.messages.create(params)
}

export const sendBulkSMS = async (numbers, body) => {
  const results = await Promise.allSettled(numbers.map(n => sendSMS(n, body)))
  return results.map((r, idx) => ({
    to: numbers[idx],
    success: r.status === 'fulfilled',
    error: r.status === 'rejected' ? (r.reason?.message || 'send_failed') : null
  }))
}

export default { sendSMS, sendBulkSMS, formatIndianNumber }
