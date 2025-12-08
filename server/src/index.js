import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import logger from './config/logger.js'
import apiRouter from './routes/index.js'
import errorHandler from './middleware/error.js'
import './config/redis.js'
import './services/sms.service.js'

// Load env
dotenv.config()

const app = express()

// Config
const PORT = process.env.PORT || 5000
const NODE_ENV = process.env.NODE_ENV || 'development'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'

// Middlewares
app.use(helmet())
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://safe-way.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }))

// Health check / root route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'SafeWay Backend API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      routes: '/api/routes',
      safety: '/api/safety',
      sos: '/api/sos'
    }
  });
});

// Basic request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`)
  next()
})

// Rate limit: 100 req / 15min per IP
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 })
app.use(limiter)

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), env: NODE_ENV })
})

// Base API
app.use('/api', apiRouter)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

// Error handler
app.use(errorHandler)

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`SafeWay backend listening on http://localhost:${PORT}`)
  // eslint-disable-next-line no-console
  console.log(`Environment: ${NODE_ENV}`)
  logger.info(`Server started on port ${PORT}`)
})
