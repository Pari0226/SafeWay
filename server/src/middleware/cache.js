import { get, set, del } from '../config/redis.js'

// Cache middleware for GET requests
export const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next()
    }
    try {
      const cacheKey = `cache:${req.originalUrl}`
      const cachedResponse = await get(cacheKey)
      if (cachedResponse) {
        console.log(`✅ Cache HIT: ${cacheKey}`)
        return res.json(JSON.parse(cachedResponse))
      }
      console.log(`❌ Cache MISS: ${cacheKey}`)
      const originalJson = res.json.bind(res)
      res.json = (data) => {
        set(cacheKey, JSON.stringify(data), ttl).catch(err => console.error('Cache set error:', err))
        return originalJson(data)
      }
      next()
    } catch (error) {
      console.error('Cache middleware error:', error)
      next()
    }
  }
}

// Cache invalidation helper
export const invalidateCache = async (pattern) => {
  try {
    // Simple invalidation for exact key
    await del(pattern)
    console.log(`🗑️ Cache invalidated: ${pattern}`)
  } catch (error) {
    console.error('Cache invalidation error:', error)
  }
}
