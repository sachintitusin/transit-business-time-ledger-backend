import express from "express"
import { config } from "dotenv"

config()

const app = express()
app.use(express.json())

app.get("/health", (_, res) => {
  res.json({ status: "ok" })
})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
