import express from "express"
import cors from "cors"

const app = express()

// 🔥 CRITICAL: Enable CORS for everything
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}))

app.use(express.json({ limit: "10mb" }))
app.disable("x-powered-by")

const PORT = process.env.PORT || 5000
const PRIVATE_API_URL = "https://drex-database-dsr.onrender.com"

// 🔥 EXACT MATCH with database API key
const PRIVATE_API_KEY = "DSR_9fA7xQwLmP2vNcY8kRtB4sZhE6uJiX3mAaT1oP==CREATED-BY-DREXMOND"

// 🔥 SIMPLE DOMAIN CHECK (MORE PERMISSIVE)
app.use((req, res, next) => {
  const origin = req.headers.origin
  
  // Allow all or specific domains
  if (origin && !origin.includes('demon-slayer.rf.gd') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
    return res.status(403).json({
      success: false,
      message: "FORBIDDEN"
    })
  }
  next()
})

/* ===============================
   🔥 SIMPLIFIED API REQUEST
================================ */

async function callDatabase(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PRIVATE_API_KEY,
        "Authorization": `Bearer ${PRIVATE_API_KEY}`
      }
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    console.log(`📤 ${method} ${PRIVATE_API_URL}${endpoint}`)
    if (body) console.log(`📦 Body:`, body)
    
    const response = await fetch(`${PRIVATE_API_URL}${endpoint}`, options)
    const data = await response.json()
    
    console.log(`📥 Response:`, data)
    return data
    
  } catch (err) {
    console.error("❌ Database error:", err)
    return { success: false, error: err.message }
  }
}

/* ===============================
   HEALTH CHECK
================================ */

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "DSR Backend",
    status: "online"
  })
})

/* ===============================
   🔥 PLAYER ENDPOINTS
================================ */

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

/* ===============================
   🔥 GENERIC COLLECTION ENDPOINTS
================================ */

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
    // 🔥 CRITICAL: Wrap data for database
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
    res.json(result)
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, data: [] })
  }
})

/* ===============================
   🔥 TEST ENDPOINT
================================ */

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend is working!",
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend running on ${PORT}`)
  console.log(`🔐 Using API Key: ${PRIVATE_API_KEY.substring(0, 20)}...`)
  console.log(`📡 Database: ${PRIVATE_API_URL}`)
})
