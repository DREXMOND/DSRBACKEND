import express from "express"
import cors from "cors"

const app = express()
app.use(express.json({ limit: "10mb" }))
app.disable("x-powered-by")

const PORT = process.env.PORT || 5000

/* ===============================
   🔐 CONFIG
================================ */

const PRIVATE_API_URL = "https://drex-database-dsr.onrender.com"
const DATABASE_API_KEY = "DSR_9fA7xQwLmP2vNcY8kRtB4sZhE6uJiX3mAaT1oP==CREATED-BY-DREXMOND"

/* ===============================
   🔥 SECURE ORIGIN CHECK
================================ */

const ALLOWED_ORIGINS = [
  "https://demon-slayer.rf.gd",
  "demon-slayer.rf.gd"
]

function isAllowedOrigin(origin) {
  if (!origin) return false
  return ALLOWED_ORIGINS.some(allowed => 
    origin === `https://${allowed}` ||
    origin === `http://${allowed}` ||
    origin === allowed
  )
}

/* ===============================
   🔥 SECURITY MIDDLEWARE
================================ */

app.use((req, res, next) => {
  const origin = req.headers.origin
  
  if (!origin) {
    console.log(`⛔ BLOCKED: No origin - ${req.method} ${req.url}`)
    return res.status(403).json({ 
      success: false, 
      error: "Access denied" 
    })
  }
  
  if (!isAllowedOrigin(origin)) {
    console.log(`⛔ BLOCKED: ${origin} - ${req.method} ${req.url}`)
    return res.status(403).json({ 
      success: false, 
      error: "Access denied" 
    })
  }
  
  console.log(`✅ ALLOWED: ${origin} - ${req.method} ${req.url}`)
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
    
    console.log(`  📤 ${method} ${endpoint}`)
    const response = await fetch(`${PRIVATE_API_URL}${endpoint}`, options)
    const data = await response.json()
    console.log(`  📥 Response:`, JSON.stringify(data).substring(0, 200) + (JSON.stringify(data).length > 200 ? '...' : ''))
    return data
    
  } catch (err) {
    console.error(`  ❌ Error: ${err.message}`)
    return { 
      success: false, 
      error: err.message || "Database request failed" 
    }
  }
}

/* ===============================
   🔥 NORMALIZE RESPONSE
================================ */

function normalizeResponse(dbResult) {
  if (dbResult.success === false) {
    return {
      exists: false,
      data: null,
      success: false,
      error: dbResult.error || "Database error"
    }
  }
  
  const data = dbResult.data || null
  const exists = data !== null && 
                 data !== undefined && 
                 !(Array.isArray(data) && data.length === 0)
  
  return {
    exists: exists,
    data: data,
    success: true,
    error: null
  }
}

/* ===============================
   🔥 ENDPOINTS
================================ */

app.get("/get/:collection/:id", async (req, res) => {
  console.log(`📂 GET /${req.params.collection}/${req.params.id}`)
  try {
    const result = await callDatabase(`/${req.params.collection}/${req.params.id}`, "GET")
    res.json(normalizeResponse(result))
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    res.status(500).json({
      exists: false,
      data: null,
      success: false,
      error: err.message
    })
  }
})

app.get("/getAll/:collection", async (req, res) => {
  console.log(`📂 GET ALL /${req.params.collection}`)
  try {
    const result = await callDatabase(`/${req.params.collection}`, "GET")
    const data = Array.isArray(result.data) ? result.data : []
    res.json({
      success: true,
      data: data
    })
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    res.status(500).json({
      success: false,
      error: err.message,
      data: []
    })
  }
})

app.post("/set/:collection/:id", async (req, res) => {
  console.log(`📝 SET /${req.params.collection}/${req.params.id}`)
  try {
    const result = await callDatabase(
      `/${req.params.collection}/${req.params.id}`,
      "POST",
      { data: req.body }
    )
    res.json({
      success: result.success !== false,
      error: result.error || null
    })
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

app.patch("/update/:collection/:id", async (req, res) => {
  console.log(`✏️ UPDATE /${req.params.collection}/${req.params.id}`)
  try {
    const result = await callDatabase(
      `/${req.params.collection}/${req.params.id}`,
      "PATCH",
      { data: req.body }
    )
    res.json({
      success: result.success !== false,
      error: result.error || null
    })
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

app.delete("/delete/:collection/:id", async (req, res) => {
  console.log(`🗑️ DELETE /${req.params.collection}/${req.params.id}`)
  try {
    const result = await callDatabase(`/${req.params.collection}/${req.params.id}`, "DELETE")
    res.json({
      success: result.success !== false,
      error: result.error || null
    })
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

app.post("/register", async (req, res) => {
  console.log(`📝 REGISTER: ${req.body.id || 'unknown'}`)
  try {
    const { id, data } = req.body
    if (!id || !data) {
      return res.status(400).json({
        success: false,
        error: "Missing fields"
      })
    }
    const result = await callDatabase(`/player/${id}`, "POST", { data })
    res.json({
      success: result.success !== false,
      error: result.error || null
    })
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

app.get("/player/:id", async (req, res) => {
  console.log(`👤 GET PLAYER: ${req.params.id}`)
  try {
    const result = await callDatabase(`/player/${req.params.id}`, "GET")
    res.json(normalizeResponse(result))
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    res.status(500).json({
      exists: false,
      data: null,
      success: false,
      error: err.message
    })
  }
})

app.patch("/player/:id", async (req, res) => {
  console.log(`✏️ UPDATE PLAYER: ${req.params.id}`)
  try {
    const result = await callDatabase(
      `/player/${req.params.id}`,
      "PATCH",
      { data: req.body }
    )
    res.json({
      success: result.success !== false,
      error: result.error || null
    })
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

app.delete("/player/:id", async (req, res) => {
  console.log(`🗑️ DELETE PLAYER: ${req.params.id}`)
  try {
    const result = await callDatabase(`/player/${req.params.id}`, "DELETE")
    res.json({
      success: result.success !== false,
      error: result.error || null
    })
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

app.get("/players", async (req, res) => {
  console.log(`👥 GET ALL PLAYERS`)
  try {
    const result = await callDatabase(`/player`, "GET")
    const data = Array.isArray(result.data) ? result.data : []
    res.json({
      success: true,
      data: data
    })
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    res.status(500).json({
      success: false,
      error: err.message,
      data: []
    })
  }
})

app.get("/", (req, res) => {
  console.log(`🏥 HEALTH CHECK`)
  res.json({
    success: true,
    status: "online",
    protected: true
  })
})

/* ===============================
   START
================================ */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`🚀 SECURE BACKEND RUNNING`)
  console.log(`${'='.repeat(50)}`)
  console.log(`📡 Port: ${PORT}`)
  console.log(`🌐 Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`)
  console.log(`🔐 Database: ${PRIVATE_API_URL}`)
  console.log(`✅ Response: { exists, data, success, error }`)
  console.log(`${'='.repeat(50)}\n`)
})
