import { createClient } from 'redis'

let redisClient = null

const connectRedis = async () => {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' })

    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err)
    })
    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully')
    })

    await redisClient.connect()
  } catch (error) {
    console.error('❌ Redis connection failed:', error)
    console.log('⚠️ App will continue without caching')
  }
}

// Initialize Redis connection
connectRedis()

// Helper functions
export const get = async (key) => {
  try {
    if (!redisClient || !redisClient.isOpen) return null
    return await redisClient.get(key)
  } catch (error) {
    console.error('Redis get error:', error)
    return null
  }
}

export const set = async (key, value, ttl = 3600) => {
  try {
    if (!redisClient || !redisClient.isOpen) return false
    await redisClient.set(key, value, { EX: ttl })
    return true
  } catch (error) {
    console.error('Redis set error:', error)
    return false
  }
}

export const del = async (key) => {
  try {
    if (!redisClient || !redisClient.isOpen) return false
    await redisClient.del(key)
    return true
  } catch (error) {
    console.error('Redis del error:', error)
    return false
  }
}

export const exists = async (key) => {
  try {
    if (!redisClient || !redisClient.isOpen) return false
    return await redisClient.exists(key) === 1
  } catch (error) {
    console.error('Redis exists error:', error)
    return false
  }
}

export default redisClient
