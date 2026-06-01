import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { parishes } from "./data/parishes.js";
import chatRoutes from "./routes/chat.js";
import publicDataRoutes from "./routes/publicData.js";
import investmentBriefRoutes from "./routes/investmentBrief.js";
import { isGroqConfigured } from "./services/groq.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const app = express();
const PORT = process.env.PORT || 5050;

/** So req.ip / x-forwarded-for behave correctly behind a reverse proxy in production. */
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

app.get("/api/parishes", (_req, res) => res.json(parishes));

app.get("/api/parishes/:id", (req, res) => {
  const parish = parishes.find((p) => p.id === req.params.id);
  if (!parish) return res.status(404).json({ error: "Parish not found" });
  res.json(parish);
});

app.use("/api/chat", chatRoutes);
app.use("/api/public-data", publicDataRoutes);
app.use("/api/investment-brief", investmentBriefRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Chat: ${isGroqConfigured() ? "Groq API enabled" : "rules fallback (set GROQ_API_KEY in .env and restart)"}`);
});
