
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

const PORT =
  process.env.PORT || 5000

/*
  🔐 PRIVATE DATABASE API
*/

const PRIVATE_API_URL =
  "https://drex-database-dsr.onrender.com"

/*
  🔐 REAL PRIVATE API KEY
  NEVER PUT THIS IN FRONTEND
*/

const PRIVATE_API_KEY =
  process.env.PRIVATE_API_KEY ||
  "DSR_9fA7xQwLmP2vNcY8kRtB4sZhE6uJiX3mAaT1oP==DSR-CREATED-BY-DREXMOND"

/*
  🔐 INTERNAL SECRET
  USED BETWEEN BACKENDS
*/

const INTERNAL_SECRET =
  process.env.INTERNAL_SECRET ||
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

  const origin =
    req.headers.origin

  /*
    ALLOW NON-BROWSER REQUESTS
  */

  if(!origin){
    return next()
  }

  if(
    !allowedOrigins.includes(origin)
  ){
    return res.status(403).json({
      success: false,
      message:
        "FORBIDDEN - FRONTEND BLOCKED"
    })
  }

  next()
})

/* ===============================
   PRIVATE API REQUEST SYSTEM
================================ */

async function apiRequest(
  endpoint,
  options = {}
){

  try{

    const response =
      await fetch(
        `${PRIVATE_API_URL}${endpoint}`,
        {
          ...options,

          headers: {
            "Content-Type":
              "application/json",

            /*
              🔐 REAL SECRET API KEY
            */

            "x-api-key":
              PRIVATE_API_KEY,

            "Authorization":
              `Bearer ${PRIVATE_API_KEY}`,

            /*
              🔐 INTERNAL SECRET
            */

            "x-internal-secret":
              INTERNAL_SECRET,

            ...options.headers
          }
        }
      )

    const data =
      await response.json()

    return data

  }catch(err){

    console.error(
      "PRIVATE API ERROR:",
      err
    )

    return {
      success: false,
      error:
        "Backend request failed"
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
   REGISTER PLAYER
================================ */

app.post(
  "/register",
  async(req,res)=>{

    try{

      const {
        id,
        data
      } = req.body

      if(
        !id ||
        !data
      ){
        return res.status(400)
        .json({
          success: false,
          error:
            "Missing fields"
        })
      }

      const result =
        await apiRequest(
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
        error:
          "Register failed"
      })
    }
  }
)

/* ===============================
   GET PLAYER
================================ */

app.get(
  "/player/:id",
  async(req,res)=>{

    try{

      const {
        id
      } = req.params

      const result =
        await apiRequest(
          `/player/${id}`,
          {
            method: "GET"
          }
        )

      res.json(result)

    }catch(err){

      console.error(err)

      res.status(500).json({
        success: false
      })
    }
  }
)

/* ===============================
   UPDATE PLAYER
================================ */

app.patch(
  "/player/:id",
  async(req,res)=>{

    try{

      const {
        id
      } = req.params

      const result =
        await apiRequest(
          `/player/${id}`,
          {
            method: "PATCH",

            body: JSON.stringify({
              data: req.body
            })
          }
        )

      res.json(result)

    }catch(err){

      console.error(err)

      res.status(500).json({
        success: false
      })
    }
  }
)

/* ===============================
   DELETE PLAYER
================================ */

app.delete(
  "/player/:id",
  async(req,res)=>{

    try{

      const {
        id
      } = req.params

      const result =
        await apiRequest(
          `/player/${id}`,
          {
            method: "DELETE"
          }
        )

      res.json(result)

    }catch(err){

      console.error(err)

      res.status(500).json({
        success: false
      })
    }
  }
)

/* ===============================
   GET ALL PLAYERS
================================ */

app.get(
  "/players",
  async(req,res)=>{

    try{

      const result =
        await apiRequest(
          `/player`,
          {
            method: "GET"
          }
        )

      res.json(result)

    }catch(err){

      console.error(err)

      res.status(500).json({
        success: false
      })
    }
  }
)

/* ===============================
   START SERVER
================================ */

app.listen(
  PORT,
  "0.0.0.0",
  ()=>{

    console.log(
      `🚀 SAFE BACKEND RUNNING ON ${PORT}`
    )
  }
)
