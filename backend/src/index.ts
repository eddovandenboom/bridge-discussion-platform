import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import session from 'express-session'
import path from 'path'
import passport from './config/passport'
import authRoutes from './routes/auth'
import tournamentRoutes from './routes/tournaments'
import circleRoutes from './routes/circles'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Configure CORS for development and production
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL || 'http://localhost:3000']
  : ['http://localhost:3000', 'http://127.0.0.1:3000']

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Origin', 
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization', 
    'Cache-Control',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Methods'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 204
}))

// Explicit preflight handler
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control')
  res.sendStatus(204)
})
app.use(express.json())

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}))

// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Static file serving for PBN files with correct MIME types and CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for all static files
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  // Set correct MIME type for PBN files
  if (req.path.endsWith('.pbn')) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  }
  
  next()
}, express.static(path.join(__dirname, '../uploads')))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/tournaments', tournamentRoutes)
app.use('/api/circles', circleRoutes)

app.get('/api/health', (req, res) => {
  res.json({ message: 'Bridge Discussion API is running' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})