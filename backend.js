import express from "express"
import cors from "cors"

/* ===============================
   APP
================================ */

const app = express()

app.use(express.json({
  limit: "10mb"
}))

app.use(cors())

app.disable("x-powered-by")

/* ===============================
   CONFIG
================================ */

const PORT = process.env.PORT || 5000

const PRIVATE_API_URL = "https://drex-database-dsr.onrender.com"

const PRIVATE_API_KEY = process.env.PRIVATE_API_KEY ||
  "DSR_9fA7xQwLmP2vNcY8kRtB4sZhE6uJiX3mAaT1oP==DSR-CREATED-BY-DREXMOND"

const INTERNAL_SECRET = process.env.INTERNAL_SECRET ||
  "DEXA_INTERNAL_SECRET_9384"

/* ===============================
   ALLOWED FRONTENDS
================================ */

const allowedOrigins = [
  "https://demon-slayer.rf.gd",
  "http://127.0.0.1:5500",
  "http://localhost:5500"
]

/* ===============================
   PROFESSIONAL FRONTEND BLOCKER
================================ */

app.use((req,res,next)=>{

  const origin = req.headers.origin

  if(!origin){
    return next()
  }

  if(!allowedOrigins.includes(origin)){
    return res.status(403).json({
      success: false,
      message: "FORBIDDEN - FRONTEND BLOCKED"
    })
  }

  next()
})

/* ===============================
   PRIVATE API REQUEST SYSTEM
================================ */

async function apiRequest(endpoint, options = {}){

  try{

    const response = await fetch(
      `${PRIVATE_API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          "Content-Type": "application/json",
          "x-api-key": PRIVATE_API_KEY,
          "Authorization": `Bearer ${PRIVATE_API_KEY}`,
          "x-internal-secret": INTERNAL_SECRET,
          ...options.headers
        }
      }
    )

    const data = await response.json()

    return data

  }catch(err){

    console.error("PRIVATE API ERROR:", err)

    return {
      success: false,
      error: "Backend request failed"
    }
  }
}

/* ===============================
   HEALTH CHECK
================================ */

app.get("/", (req,res)=>{
  res.json({
    success: true,
    name: "DEXA SAFE BACKEND",
    secured: true
  })
})

/* ===============================
   🔥 ADDED: GENERIC GET ENDPOINT
================================ */

app.get("/get/:collection/:id", async(req,res)=>{

  try{

    const { collection, id } = req.params

    // 🔥 Handle onWa specially
    if(collection === "onWa"){

      const result = await apiRequest(
        `/onWa/${id}`,
        { method: "GET" }
      )

      // 🔥 FIX: Return proper structure
      return res.json({
        exists: result.success && result.data !== undefined,
        data: result.data || {}
      })
    }

    // 🔥 Generic collection handler
    const result = await apiRequest(
      `/${collection}/${id}`,
      { method: "GET" }
    )

    res.json({
      exists: result.success && result.data !== undefined,
      data: result.data || {}
    })

  }catch(err){

    console.error(err)

    res.status(500).json({
      success: false,
      error: "Failed to get document"
    })
  }
})

/* ===============================
   🔥 ADDED: GENERIC SET ENDPOINT
================================ */

app.post("/set/:collection/:id", async(req,res)=>{

  try{

    const { collection, id } = req.params
    const data = req.body

    // 🔥 Handle onWa specially
    if(collection === "onWa"){

      const result = await apiRequest(
        `/onWa/${id}`,
        {
          method: "POST",
          body: JSON.stringify(data)
        }
      )

      return res.json(result)
    }

    // 🔥 Generic collection handler
    const result = await apiRequest(
      `/${collection}/${id}`,
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    )

    res.json(result)

  }catch(err){

    console.error(err)

    res.status(500).json({
      success: false,
      error: "Failed to set document"
    })
  }
})

/* ===============================
   🔥 ADDED: GENERIC UPDATE ENDPOINT
================================ */

app.patch("/update/:collection/:id", async(req,res)=>{

  try{

    const { collection, id } = req.params
    const data = req.body

    // 🔥 FIX: Don't nest data
    const result = await apiRequest(
      `/${collection}/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data)
      }
    )

    res.json(result)

  }catch(err){

    console.error(err)

    res.status(500).json({
      success: false,
      error: "Failed to update document"
    })
  }
})

/* ===============================
   🔥 ADDED: GENERIC DELETE ENDPOINT
================================ */

app.delete("/delete/:collection/:id", async(req,res)=>{

  try{

    const { collection, id } = req.params

    const result = await apiRequest(
      `/${collection}/${id}`,
      { method: "DELETE" }
    )

    res.json(result)

  }catch(err){

    console.error(err)

    res.status(500).json({
      success: false,
      error: "Failed to delete document"
    })
  }
})

/* ===============================
   🔥 ADDED: GENERIC GET ALL ENDPOINT
================================ */

app.get("/getAll/:collection", async(req,res)=>{

  try{

    const { collection } = req.params

    const result = await apiRequest(
      `/${collection}`,
      { method: "GET" }
    )

    // 🔥 FIX: Return proper structure with data array
    res.json({
      success: true,
      data: result.data || []
    })

  }catch(err){

    console.error(err)

    res.status(500).json({
      success: false,
      error: "Failed to get collection",
      data: []
    })
  }
})

/* ===============================
   ORIGINAL ENDPOINTS (KEPT FOR BACKWARDS)
================================ */

app.post("/register", async(req,res)=>{

  try{

    const { id, data } = req.body

    if(!id || !data){
      return res.status(400).json({
        success: false,
        error: "Missing fields"
      })
    }

    const result = await apiRequest(
      `/player/${id}`,
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    )

    res.json(result)

  }catch(err){

    console.error(err)

    res.status(500).json({
      success: false,
      error: "Register failed"
    })
  }
})

app.get("/player/:id", async(req,res)=>{

  try{

    const { id } = req.params

    const result = await apiRequest(
      `/player/${id}`,
      { method: "GET" }
    )

    // 🔥 FIX: Return proper structure
    res.json({
      exists: result.success && result.data !== undefined,
      data: result.data || {}
    })

  }catch(err){

    console.error(err)

    res.status(500).json({
      success: false,
      error: "Failed to get player"
    })
  }
})

app.patch("/player/:id", async(req,res)=>{

  try{

    const { id } = req.params

    // 🔥 FIX: Don't nest data
    const result = await apiRequest(
      `/player/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(req.body)
      }
    )

    res.json(result)

  }catch(err){

    console.error(err)

    res.status(500).json({
      success: false,
      error: "Failed to update player"
    })
  }
})

app.delete("/player/:id", async(req,res)=>{

  try{

    const { id } = req.params

    const result = await apiRequest(
      `/player/${id}`,
      { method: "DELETE" }
    )

    res.json(result)

  }catch(err){

    console.error(err)

    res.status(500).json({
      success: false,
      error: "Failed to delete player"
    })
  }
})

app.get("/players", async(req,res)=>{

  try{

    const result = await apiRequest(
      `/player`,
      { method: "GET" }
    )

    // 🔥 FIX: Return proper structure
    res.json({
      success: true,
      data: result.data || []
    })

  }catch(err){

    console.error(err)

    res.status(500).json({
      success: false,
      error: "Failed to get players",
      data: []
    })
  }
})

/* ===============================
   START SERVER
================================ */

app.listen(PORT, "0.0.0.0", ()=>{
  console.log(`🚀 SAFE BACKEND RUNNING ON ${PORT}`)
})
