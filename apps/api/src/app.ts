import express, { type Express } from "express"
import { errorHandler } from "./shared/middleware/error-handler.js"

export function createApp(): Express {
  const app = express()

  app.use(express.json())

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" })
  })

  // All legacy routes have been ported to NestJS.
  app.use(errorHandler)

  return app
}
