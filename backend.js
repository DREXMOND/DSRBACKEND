import express from "express"
import cors from "cors"
import crypto from "crypto"

const app = express()
app.use(express.json({ limit: "10mb" }))
app.disable("x-powered-by")

const PORT = process.env.PORT || 5000

/* ===============================
   🔐 CONFIG
================================ */

const PRIVATE_API_URL = "https://drex-database-dsr.onrender.com"
const DATABASE_API_KEY = "DSR_9fA7xQwLmP2vNcY8kRtB4sZhE6uJiX3mAaT1oP==CREATED-BY-DREXMOND"

// 🔥 SECRET SALT FOR REQUEST VALIDATION
const REQUEST_SALT = process.env.REQUEST_SALT || "DSR_ULTRA_SECURE_SALT_2024_x7K9m2"

/* ===============================
   🔥 ALLOWED ORIGINS (STRICT)
================================ */

const ALLOWED_ORIGINS = [
  "https://demon-slayer.rf.gd",
  "demon-slayer.rf.gd"
]

/* ===============================
   🔥 ULTRA STRICT ORIGIN CHECK
================================ */

function isAllowedOrigin(origin) {
  if (!origin) return false
  
  // Exact match only - NO wildcards
  const cleanOrigin = origin.replace(/^https?:\/\//, '')
  return ALLOWED_ORIGINS.some(allowed => 
    origin === `https://${allowed}` ||
    origin === `http://${allowed}` ||
    cleanOrigin === allowed
  )
}

/* ===============================
   🔥 RATE LIMITING (PER IP)
================================ */

const rateLimit = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 30 // 30 requests per minute
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, reset: now + windowMs })
    return true
  }
  
  const data = rateLimit.get(ip)
  
  if (now > data.reset) {
    rateLimit.set(ip, { count: 1, reset: now + windowMs })
    return true
  }
  
  if (data.count >= maxRequests) {
    return false
  }
  
  data.count++
  return true
}

// Clean up rate limit every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, data] of rateLimit.entries()) {
    if (now > data.reset) {
      rateLimit.delete(ip)
    }
  }
}, 300000)

/* ===============================
   🔥 REQUEST SIGNATURE VALIDATION
================================ */

function validateRequestSignature(req) {
  try {
    // 🔥 Check for browser fingerprint
    const userAgent = req.headers['user-agent'] || ''
    const acceptLanguage = req.headers['accept-language'] || ''
    const acceptEncoding = req.headers['accept-encoding'] || ''
    
    // Block common scraping tools
    const scraperPatterns = [
      'curl', 'wget', 'python', 'node-fetch', 'axios',
      'postman', 'insomnia', 'scrapy', 'puppeteer',
      'selenium', 'headless', 'phantomjs', 'nokogiri',
      'http-client', 'rest-client', 'java', 'okhttp'
    ]
    
    const userAgentLower = userAgent.toLowerCase()
    if (scraperPatterns.some(pattern => userAgentLower.includes(pattern))) {
      console.log(`🚫 SCRAPER DETECTED: ${userAgent}`)
      return false
    }
    
    // 🔥 Check for legitimate browser headers
    const hasBrowserHeaders = 
      userAgent.includes('Mozilla') &&
      (userAgent.includes('Chrome') || userAgent.includes('Firefox') || userAgent.includes('Safari')) &&
      acceptLanguage &&
      acceptEncoding
    
    if (!hasBrowserHeaders) {
      console.log(`🚫 INVALID BROWSER HEADERS: ${userAgent}`)
      return false
    }
    
    return true
    
  } catch (err) {
    return false
  }
}

/* ===============================
   🔥 MAIN SECURITY MIDDLEWARE
================================ */

app.use((req, res, next) => {
  const origin = req.headers.origin
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  // 🔥 LAYER 1: Check rate limit
  if (!checkRateLimit(ip)) {
    console.log(`🚫 RATE LIMIT EXCEEDED: ${ip}`)
    return res.status(429).json({ 
      success: false, 
      error: "Too many requests. Please try again later." 
    })
  }
  
  // 🔥 LAYER 2: Check origin
  if (!origin) {
    console.log(`🚫 NO ORIGIN: ${ip} - ${req.method} ${req.url}`)
    return res.status(403).json({ 
      success: false, 
      error: "Access denied" 
    })
  }
  
  // 🔥 LAYER 3: Validate origin
  if (!isAllowedOrigin(origin)) {
    console.log(`🚫 INVALID ORIGIN: ${origin} - ${ip}`)
    return res.status(403).json({ 
      success: false, 
      error: "Access denied" 
    })
  }
  
  // 🔥 LAYER 4: Check for scraper signatures
  if (!validateRequestSignature(req)) {
    console.log(`🚫 SCRAPER BLOCKED: ${ip} - ${req.headers['user-agent']}`)
    return res.status(403).json({ 
      success: false, 
      error: "Access denied" 
    })
  }
  
  // 🔥 LAYER 5: Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  console.log(`✅ ALLOWED: ${origin} - ${ip} - ${req.method} ${req.url}`)
  next()
})

/* ===============================
   🔥 PROXY TO DATABASE (WITH TIMEOUT)
================================ */

async function callDatabase(endpoint, method = "GET", body = null) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000) // 15 second timeout
  
  try {
    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": DATABASE_API_KEY,
        "Authorization": `Bearer ${DATABASE_API_KEY}`
      },
      signal: controller.signal
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    console.log(`📤 ${method} ${PRIVATE_API_URL}${endpoint}`)
    const response = await fetch(`${PRIVATE_API_URL}${endpoint}`, options)
    clearTimeout(timeout)
    
    const data = await response.json()
    console.log(`📥 Response:`, data)
    return data
    
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      console.error("Database timeout")
      return { success: false, error: "Database request timeout" }
    }
    console.error("Database error:", err)
    return { success: false, error: err.message }
  }
}

/* ===============================
   🔥 FRONTEND ENDPOINTS (STRICTLY PROTECTED)
================================ */

app.get("/", (req, res) => {
  res.json({
    success: true,
    status: "online",
    protected: true,
    timestamp: Date.now()
  })
})

app.post("/register", async (req, res) => {
  try {
    const { id, data } = req.body
    if (!id || !data) {
      return res.status(400).json({ success: false, error: "Missing fields" })
    }
    const result = await callDatabase(`/player/${id}`, "POST", { data })
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get("/player/:id", async (req, res) => {
  try {
    const result = await callDatabase(`/player/${req.params.id}`, "GET")
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.patch("/player/:id", async (req, res) => {
  try {
    const result = await callDatabase(`/player/${req.params.id}`, "PATCH", { data: req.body })
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.delete("/player/:id", async (req, res) => {
  try {
    const result = await callDatabase(`/player/${req.params.id}`, "DELETE")
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get("/players", async (req, res) => {
  try {
    const result = await callDatabase(`/player`, "GET")
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, data: [] })
  }
})

app.get("/get/:collection/:id", async (req, res) => {
  try {
    const result = await callDatabase(`/${req.params.collection}/${req.params.id}`, "GET")
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.post("/set/:collection/:id", async (req, res) => {
  try {
    const result = await callDatabase(
      `/${req.params.collection}/${req.params.id}`,
      "POST",
      { data: req.body }
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.patch("/update/:collection/:id", async (req, res) => {
  try {
    const result = await callDatabase(
      `/${req.params.collection}/${req.params.id}`,
      "PATCH",
      { data: req.body }
    )
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.delete("/delete/:collection/:id", async (req, res) => {
  try {
    const result = await callDatabase(`/${req.params.collection}/${req.params.id}`, "DELETE")
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.get("/getAll/:collection", async (req, res) => {
  try {
    const result = await callDatabase(`/${req.params.collection}`, "GET")
    res.json({
      success: true,
      data: result.data || []
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, data: [] })
  }
})

/* ===============================
   🔥 HONEYPOT ENDPOINT (TRAP SCRAPERS)
================================ */

app.get("/api", (req, res) => {
  console.log(`🚨 HONEYPOT TRIGGERED: ${req.ip}`)
  // Return fake data to confuse scrapers
  res.json({
    success: false,
    error: "Invalid API endpoint",
    message: "Please use /api/v2/ with proper authentication"
  })
})

app.post("/api/v2", (req, res) => {
  console.log(`🚨 HONEYPOT TRIGGERED: ${req.ip}`)
  res.status(401).json({
    success: false,
    error: "Authentication required",
    hint: "API key required in headers"
  })
})

/* ===============================
   🔥 ERROR HANDLER (NO LEAKED INFO)
================================ */

app.use((err, req, res, next) => {
  console.error("Server error:", err)
  res.status(500).json({
    success: false,
    error: "Internal server error"
  })
})

/* ===============================
   START
================================ */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🛡️  ULTRA SECURE BACKEND DEPLOYED`)
  console.log(`${'='.repeat(60)}`)
  console.log(`🚀 Port: ${PORT}`)
  console.log(`🌐 Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`)
  console.log(`🔐 Database: ${PRIVATE_API_URL}`)
  console.log(`⏱️  Rate Limit: 30 requests/minute per IP`)
  console.log(`🛡️  Scraper Protection: ENABLED`)
  console.log(`🎯 Honeypot: ACTIVE`)
  console.log(`${'='.repeat(60)}\n`)
})
