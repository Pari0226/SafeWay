export default function errorHandler(err, req, res, _next) {
  const status = err.status || 500
  const message = err.message || 'Internal Server Error'
  const details = process.env.NODE_ENV === 'production' ? undefined : (err.stack || undefined)
  res.status(status).json({ error: message, status, details })
}
