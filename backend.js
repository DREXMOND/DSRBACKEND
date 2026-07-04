import express from "express"
import cors from "cors"

/* ===============================
   APP
================================ */

const app = express()

app.use(express.json({ limit: "10mb" }))
app.use(cors())
app.disable("x-powered-by")

/* ===============================
   CONFIG
================================ */

const PORT = process.env.PORT || 5000

const PRIVATE_API_URL = "https://drex-database-dsr.onrender.com"

const PRIVATE_API_KEY = process.env.PRIVATE_API_KEY ||
  "DSR_9fA7xQwLmP2vNcY8kRtB4sZhE6uJiX3mAaT1oP==CREATED-BY-DREXMOND"

/* ===============================
   ALLOWED FRONTENDS
================================ */

const allowedOrigins = [
  "https://demon-slayer.rf.gd",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://demon-slayer.rf.gd/register", // Added with path
  "demon-slayer.rf.gd", // Without protocol
  "*.rf.gd" // Wildcard
]

/* ===============================
   🔥 ULTIMATE DEBUG MIDDLEWARE
================================ */

app.use((req, res, next) => {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  console.log("\n" + "=".repeat(80))
  console.log(`🔍 DEBUG REQUEST #${requestId}`)
  console.log("=".repeat(80))
  console.log(`📡 URL: ${req.method} ${req.url}`)
  console.log(`🌐 Origin: ${req.headers.origin || "NONE"}`)
  console.log(`📱 User-Agent: ${req.headers["user-agent"] || "NONE"}`)
  console.log(`📦 Body:`, JSON.stringify(req.body, null, 2))
  console.log(`📋 Headers:`, JSON.stringify(req.headers, null, 2))
  console.log("=".repeat(80))
  
  // Store requestId for later use
  req.requestId = requestId
  req.startTime = startTime
  
  // Override json to log responses
  const originalJson = res.json
  res.json = function(data) {
    const duration = Date.now() - startTime
    console.log(`\n📤 RESPONSE #${requestId} (${duration}ms):`)
    console.log(JSON.stringify(data, null, 2))
    console.log("=".repeat(80) + "\n")
    return originalJson.call(this, data)
  }
  
  next()
})

/* ===============================
   PRIVATE API REQUEST SYSTEM WITH DEBUG
================================ */

async function apiRequest(endpoint, options = {}, requestId = "UNKNOWN") {
  console.log(`\n🔗 API REQUEST #${requestId}:`)
  console.log(`  → Target: ${PRIVATE_API_URL}${endpoint}`)
  console.log(`  → Method: ${options.method || "GET"}`)
  console.log(`  → Headers:`, {
    "x-api-key": PRIVATE_API_KEY.substring(0, 20) + "...",
    "Authorization": `Bearer ${PRIVATE_API_KEY.substring(0, 20)}...`
  })
  if (options.body) {
    console.log(`  → Body: ${options.body}`)
  }
  
  try {
    const response = await fetch(`${PRIVATE_API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": PRIVATE_API_KEY,
        "Authorization": `Bearer ${PRIVATE_API_KEY}`,
        ...options.headers
      }
    })

    const data = await response.json()
    
    console.log(`\n📥 API RESPONSE #${requestId}:`)
    console.log(`  → Status: ${response.status}`)
    console.log(`  → Data:`, JSON.stringify(data, null, 2))
    
    return data

  } catch (err) {
    console.error(`\n❌ API ERROR #${requestId}:`, err)
    return {
      success: false,
      error: err.message || "Backend request failed"
    }
  }
}

/* ===============================
   HEALTH CHECK
================================ */

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "DEXA SAFE BACKEND",
    secured: true,
    protected: true,
    timestamp: new Date().toISOString()
  })
})

/* ===============================
   🔥 TEST ENDPOINT - CHECK IF BACKEND IS REACHABLE
================================ */

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Backend is working!",
    origin: req.headers.origin,
    allowed: allowedOrigins.includes(req.headers.origin),
    timestamp: new Date().toISOString()
  })
})

/* ===============================
   🔥 TEST DATABASE CONNECTION
================================ */

app.get("/test-db", async (req, res) => {
  const requestId = req.requestId || "TEST"
  
  try {
    console.log(`\n🧪 TESTING DATABASE CONNECTION #${requestId}`)
    
    // Test if we can reach the database API
    const result = await apiRequest("/", { method: "GET" }, requestId)
    
    res.json({
      success: true,
      message: "Database connection test",
      databaseResponse: result,
      apiUrl: PRIVATE_API_URL,
      apiKeyUsed: PRIVATE_API_KEY.substring(0, 20) + "..."
    })
    
  } catch (err) {
    console.error("Database test failed:", err)
    res.status(500).json({
      success: false,
      error: err.message,
      apiUrl: PRIVATE_API_URL
    })
  }
})

/* ===============================
   🔥 TEST WHATSAPP ENDPOINT
================================ */

app.post("/test-onwa", async (req, res) => {
  const requestId = req.requestId || "ONWA"
  const { phone } = req.body
  
  console.log(`\n📱 TESTING ONWA #${requestId} for ${phone}`)
  
  try {
    // Try to set
    const setResult = await apiRequest(
      `/onWa/${phone}`,
      {
        method: "POST",
        body: JSON.stringify({ 
          data: {
            phoneNumber: phone,
            checked: false,
            onwhatsapp: null,
            requestedAt: Date.now()
          }
        })
      },
      requestId
    )
    
    // Try to get
    const getResult = await apiRequest(
      `/onWa/${phone}`,
      { method: "GET" },
      requestId
    )
    
    res.json({
      success: true,
      setResult,
      getResult,
      phone
    })
    
  } catch (err) {
    console.error("OnWa test failed:", err)
    res.status(500).json({
      success: false,
      error: err.message
    })
  }
})

/* ===============================
   REGISTER PLAYER
================================ */

app.post("/register", async (req, res) => {
  const requestId = req.requestId || "REGISTER"
  
  try {
    const { id, data } = req.body

    console.log(`\n📝 REGISTER REQUEST #${requestId}`)
    console.log(`  → ID: ${id}`)
    console.log(`  → Data keys: ${Object.keys(data).join(", ")}`)

    if (!id || !data) {
      console.log(`❌ Missing fields #${requestId}`)
      return res.status(400).json({
        success: false,
        error: "Missing fields"
      })
    }

    const result = await apiRequest(
      `/player/${id}`,
      {
        method: "POST",
        body: JSON.stringify({ data })
      },
      requestId
    )

    res.json(result)

  } catch (err) {
    console.error(`❌ Register error #${requestId}:`, err)
    res.status(500).json({
      success: false,
      error: err.message || "Register failed"
    })
  }
})

/* ===============================
   GET PLAYER
================================ */

app.get("/player/:id", async (req, res) => {
  const requestId = req.requestId || "GET-PLAYER"
  
  try {
    const { id } = req.params
    
    console.log(`\n👤 GET PLAYER #${requestId}: ${id}`)

    const result = await apiRequest(
      `/player/${id}`,
      { method: "GET" },
      requestId
    )

    res.json(result)

  } catch (err) {
    console.error(`❌ Get player error #${requestId}:`, err)
    res.status(500).json({
      success: false,
      error: err.message || "Failed to get player"
    })
  }
})

/* ===============================
   UPDATE PLAYER
================================ */

app.patch("/player/:id", async (req, res) => {
  const requestId = req.requestId || "UPDATE-PLAYER"
  
  try {
    const { id } = req.params
    
    console.log(`\n✏️ UPDATE PLAYER #${requestId}: ${id}`)

    const result = await apiRequest(
      `/player/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ data: req.body })
      },
      requestId
    )

    res.json(result)

  } catch (err) {
    console.error(`❌ Update error #${requestId}:`, err)
    res.status(500).json({
      success: false,
      error: err.message || "Failed to update player"
    })
  }
})

/* ===============================
   DELETE PLAYER
================================ */

app.delete("/player/:id", async (req, res) => {
  const requestId = req.requestId || "DELETE-PLAYER"
  
  try {
    const { id } = req.params
    
    console.log(`\n🗑️ DELETE PLAYER #${requestId}: ${id}`)

    const result = await apiRequest(
      `/player/${id}`,
      { method: "DELETE" },
      requestId
    )

    res.json(result)

  } catch (err) {
    console.error(`❌ Delete error #${requestId}:`, err)
    res.status(500).json({
      success: false,
      error: err.message || "Failed to delete player"
    })
  }
})

/* ===============================
   GET ALL PLAYERS
================================ */

app.get("/players", async (req, res) => {
  const requestId = req.requestId || "GET-ALL"
  
  try {
    console.log(`\n📋 GET ALL PLAYERS #${requestId}`)

    const result = await apiRequest(
      `/player`,
      { method: "GET" },
      requestId
    )

    res.json(result)

  } catch (err) {
    console.error(`❌ Get all error #${requestId}:`, err)
    res.status(500).json({
      success: false,
      error: err.message || "Failed to get players",
      data: []
    })
  }
})

/* ===============================
   GENERIC ENDPOINTS
================================ */

app.get("/get/:collection/:id", async (req, res) => {
  const requestId = req.requestId || "GET-GENERIC"
  
  try {
    const { collection, id } = req.params
    
    console.log(`\n📂 GET GENERIC #${requestId}: ${collection}/${id}`)

    const result = await apiRequest(
      `/${collection}/${id}`,
      { method: "GET" },
      requestId
    )

    res.json(result)

  } catch (err) {
    console.error(`❌ Get generic error #${requestId}:`, err)
    res.status(500).json({
      success: false,
      error: err.message || "Failed to get document"
    })
  }
})

app.post("/set/:collection/:id", async (req, res) => {
  const requestId = req.requestId || "SET-GENERIC"
  
  try {
    const { collection, id } = req.params
    const data = req.body
    
    console.log(`\n📂 SET GENERIC #${requestId}: ${collection}/${id}`)

    const result = await apiRequest(
      `/${collection}/${id}`,
      {
        method: "POST",
        body: JSON.stringify({ data })
      },
      requestId
    )

    res.json(result)

  } catch (err) {
    console.error(`❌ Set generic error #${requestId}:`, err)
    res.status(500).json({
      success: false,
      error: err.message || "Failed to set document"
    })
  }
})

app.patch("/update/:collection/:id", async (req, res) => {
  const requestId = req.requestId || "UPDATE-GENERIC"
  
  try {
    const { collection, id } = req.params
    const data = req.body
    
    console.log(`\n📂 UPDATE GENERIC #${requestId}: ${collection}/${id}`)

    const result = await apiRequest(
      `/${collection}/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ data })
      },
      requestId
    )

    res.json(result)

  } catch (err) {
    console.error(`❌ Update generic error #${requestId}:`, err)
    res.status(500).json({
      success: false,
      error: err.message || "Failed to update document"
    })
  }
})

app.delete("/delete/:collection/:id", async (req, res) => {
  const requestId = req.requestId || "DELETE-GENERIC"
  
  try {
    const { collection, id } = req.params
    
    console.log(`\n📂 DELETE GENERIC #${requestId}: ${collection}/${id}`)

    const result = await apiRequest(
      `/${collection}/${id}`,
      { method: "DELETE" },
      requestId
    )

    res.json(result)

  } catch (err) {
    console.error(`❌ Delete generic error #${requestId}:`, err)
    res.status(500).json({
      success: false,
      error: err.message || "Failed to delete document"
    })
  }
})

app.get("/getAll/:collection", async (req, res) => {
  const requestId = req.requestId || "GETALL-GENERIC"
  
  try {
    const { collection } = req.params
    
    console.log(`\n📂 GET ALL GENERIC #${requestId}: ${collection}`)

    const result = await apiRequest(
      `/${collection}`,
      { method: "GET" },
      requestId
    )

    res.json(result)

  } catch (err) {
    console.error(`❌ Get all generic error #${requestId}:`, err)
    res.status(500).json({
      success: false,
      error: err.message || "Failed to get collection",
      data: []
    })
  }
})

/* ===============================
   START SERVER
================================ */

app.listen(PORT, "0.0.0.0", () => {
  console.log("\n" + "=".repeat(80))
  console.log("🚀 SAFE BACKEND DEPLOYED")
  console.log("=".repeat(80))
  console.log(`📡 Port: ${PORT}`)
  console.log(`🔐 API Key: ${PRIVATE_API_KEY.substring(0, 20)}...`)
  console.log(`📦 Database URL: ${PRIVATE_API_URL}`)
  console.log(`🌐 Allowed Origins: ${allowedOrigins.join(", ")}`)
  console.log("=".repeat(80))
  console.log("\n🔍 DEBUG MODE ENABLED - Check logs for details\n")
})
