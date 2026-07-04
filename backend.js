import express from "express"
import cors from "cors"

const app = express()
app.use(express.json({ limit: "10mb" }))
app.disable("x-powered-by")

const PORT = process.env.PORT || 5000

/* ===============================
   🔐 SECURITY CONFIG
================================ */

// REAL DATABASE API (COMPLETELY HIDDEN)
const PRIVATE_API_URL = "https://drex-database-dsr.onrender.com"

// DIFFERENT KEYS FOR DIFFERENT PURPOSES
const DATABASE_API_KEY = "DSR_9fA7xQwLmP2vNcY8kRtB4sZhE6uJiX3mAaT1oP==CREATED-BY-DREXMOND"

// 🔥 INTERNAL SECRET FOR BOT ONLY (NEVER USED BY FRONTEND)
const INTERNAL_SECRET = process.env.INTERNAL_SECRET || "DSR_INTERNAL_BOT_SECRET_9384x7"

/* ===============================
   🔥 ULTRA SECURE ORIGIN CHECK
================================ */

const ALLOWED_ORIGINS = [
  "https://demon-slayer.rf.gd",
  "https://demon-slayer.rf.gd/register",
  "demon-slayer.rf.gd"
]

// 🔥 STRICT: Only allow specific domain with exact match
function isAllowedOrigin(origin) {
  if (!origin) return false
  
  // Exact match only
  return ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || 
    origin === `https://${allowed}` ||
    origin === `http://${allowed}`
  )
}

/* ===============================
   🔥 SUPER STRICT MIDDLEWARE
================================ */

app.use((req, res, next) => {
  const origin = req.headers.origin
  const userAgent = req.headers['user-agent'] || ''
  
  // 🔥 BLOCK: No origin (direct API calls)
  if (!origin) {
    console.log(`🚫 BLOCKED: No origin - ${req.method} ${req.url}`)
    return res.status(403).json({
      success: false,
      error: "Access denied"
    })
  }
  
  // 🔥 BLOCK: Not from allowed domain
  if (!isAllowedOrigin(origin)) {
    console.log(`🚫 BLOCKED: Invalid origin ${origin}`)
    return res.status(403).json({
      success: false,
      error: "Access denied"
    })
  }
  
  // 🔥 BLOCK: Bot user agents (only frontend browsers)
  const botPatterns = ['node-fetch', 'axios', 'python', 'curl', 'wget', 'bot', 'crawler']
  if (botPatterns.some(pattern => userAgent.toLowerCase().includes(pattern))) {
    console.log(`🚫 BLOCKED: Bot user-agent ${userAgent}`)
    return res.status(403).json({
      success: false,
      error: "Access denied"
    })
  }
  
  console.log(`✅ ALLOWED: ${origin} - ${req.method} ${req.url}`)
  next()
})

/* ===============================
   🔥 SPECIAL BOT ENDPOINT (WITH INTERNAL SECRET)
================================ */

app.use('/bot/*', (req, res, next) => {
  const secret = req.headers['x-internal-secret']
  
  // 🔥 ONLY bot with correct secret can access
  if (secret !== INTERNAL_SECRET) {
    console.log(`🚫 BOT BLOCKED: Invalid secret`)
    return res.status(403).json({
      success: false,
      error: "Bot access denied"
    })
  }
  
  console.log(`🤖 BOT ALLOWED: ${req.method} ${req.url}`)
  next()
})

/* ===============================
   🔥 PROXY TO DATABASE
================================ */

async function callDatabase(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": DATABASE_API_KEY,
        "Authorization": `Bearer ${DATABASE_API_KEY}`
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(`${PRIVATE_API_URL}${endpoint}`, options)
    return await response.json()
    
  } catch (err) {
    console.error("Database error:", err)
    return { success: false, error: err.message }
  }
}

/* ===============================
   🔥 FRONTEND ENDPOINTS (NO KEYS NEEDED)
================================ */

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    status: "online",
    protected: true
  })
})

// Player endpoints
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

// Generic endpoints
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
   🔥 BOT ENDPOINTS (WITH INTERNAL SECRET)
================================ */

app.get("/bot/getAll/:collection", async (req, res) => {
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

app.post("/bot/set/:collection/:id", async (req, res) => {
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

app.patch("/bot/update/:collection/:id", async (req, res) => {
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

/* ===============================
   START
================================ */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 SECURED BACKEND RUNNING ON ${PORT}`)
  console.log(`🔐 Internal Secret: ${INTERNAL_SECRET.substring(0, 10)}...`)
  console.log(`🌐 Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}`)
  console.log(`🤖 Bot endpoints: /bot/* (requires internal secret)\n`)
})
