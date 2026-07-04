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
  "http://localhost:5500"
]

/* ===============================
   FRONTEND BLOCKER
================================ */

app.use((req, res, next) => {
  const origin = req.headers.origin

  if (!origin) return next()

  if (!allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: "FORBIDDEN - FRONTEND BLOCKED"
    })
  }

  next()
})

/* ===============================
   PRIVATE API REQUEST
================================ */

async function apiRequest(endpoint, options = {}) {
  try {
    console.log(`📤 Forwarding to: ${PRIVATE_API_URL}${endpoint}`)
    console.log(`📦 Body:`, options.body ? JSON.parse(options.body) : "NONE")
    
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
    console.log(`📥 Response:`, data)
    return data

  } catch (err) {
    console.error("PRIVATE API ERROR:", err)
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
    secured: true
  })
})

/* ===============================
   REGISTER PLAYER
================================ */

app.post("/register", async (req, res) => {
  try {
    const { id, data } = req.body

    if (!id || !data) {
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
      }
    )

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      error: "Register failed"
    })
  }
})

/* ===============================
   GET PLAYER
================================ */

app.get("/player/:id", async (req, res) => {
  try {
    const { id } = req.params

    const result = await apiRequest(
      `/player/${id}`,
      { method: "GET" }
    )

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      error: "Failed to get player"
    })
  }
})

/* ===============================
   UPDATE PLAYER
================================ */

app.patch("/player/:id", async (req, res) => {
  try {
    const { id } = req.params

    const result = await apiRequest(
      `/player/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ data: req.body })
      }
    )

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      error: "Failed to update player"
    })
  }
})

/* ===============================
   DELETE PLAYER
================================ */

app.delete("/player/:id", async (req, res) => {
  try {
    const { id } = req.params

    const result = await apiRequest(
      `/player/${id}`,
      { method: "DELETE" }
    )

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      error: "Failed to delete player"
    })
  }
})

/* ===============================
   GET ALL PLAYERS
================================ */

app.get("/players", async (req, res) => {
  try {
    const result = await apiRequest(
      `/player`,
      { method: "GET" }
    )

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      error: "Failed to get players",
      data: []
    })
  }
})

/* ===============================
   🔥 FIXED GENERIC ENDPOINTS - WRAP DATA CORRECTLY
================================ */

// GET any collection document
app.get("/get/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params

    const result = await apiRequest(
      `/${collection}/${id}`,
      { method: "GET" }
    )

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      error: "Failed to get document"
    })
  }
})

// 🔥 FIXED: SET any collection document - WRAP DATA
app.post("/set/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params
    const data = req.body // This is the raw data from frontend

    // 🔥 CRITICAL FIX: Wrap data in { data: ... }
    const result = await apiRequest(
      `/${collection}/${id}`,
      {
        method: "POST",
        body: JSON.stringify({ data })
      }
    )

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      error: "Failed to set document"
    })
  }
})

// 🔥 FIXED: UPDATE any collection document - WRAP DATA
app.patch("/update/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params
    const data = req.body

    // 🔥 CRITICAL FIX: Wrap data in { data: ... }
    const result = await apiRequest(
      `/${collection}/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ data })
      }
    )

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      error: "Failed to update document"
    })
  }
})

// DELETE any collection document
app.delete("/delete/:collection/:id", async (req, res) => {
  try {
    const { collection, id } = req.params

    const result = await apiRequest(
      `/${collection}/${id}`,
      { method: "DELETE" }
    )

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      error: "Failed to delete document"
    })
  }
})

// GET ALL documents in any collection
app.get("/getAll/:collection", async (req, res) => {
  try {
    const { collection } = req.params

    const result = await apiRequest(
      `/${collection}`,
      { method: "GET" }
    )

    res.json(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      error: "Failed to get collection",
      data: []
    })
  }
})

/* ===============================
   START SERVER
================================ */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 SAFE BACKEND RUNNING ON ${PORT}`)
  console.log(`🔐 Database URL: ${PRIVATE_API_URL}`)
})
