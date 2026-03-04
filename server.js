import "dotenv/config";
import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, "public")));

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });

// Map OpenAI-style messages to Gemini contents: { role: "user"|"model", parts: [{ text }] }
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content || "" }],
  }));
}

app.post("/api/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages?.length) {
      return res.status(400).json({ error: "Messages required" });
    }
    const contents = toGeminiContents(messages);
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
    });
    const text = response.text;
    if (text == null) throw new Error("No reply from Gemini");
    res.json({
      message: {
        role: "assistant",
        content: text,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message || "Failed to get response from AI",
    });
  }
});

const server = app.listen(port, () => {
  console.log(`Chatbot running at http://localhost:${port}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Failed to start: port ${port} is already in use. ` +
        "Set a different PORT in .env or stop the other process."
    );
    process.exit(1);
  }
  throw err;
});
