import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import session from 'express-session'
import path from 'path'
import passport from './config/passport'
import authRoutes from './routes/auth'
import tournamentRoutes from './routes/tournaments'
import circleRoutes from './routes/circles'

dotenv.config({ path: path.join(__dirname, '../../.env') })

const app = express()
const PORT = process.env.PORT || 3001

// Simple CORS - allow all in development, specific origins in production
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : [process.env.FRONTEND_URL || 'http://localhost'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control']
}))

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