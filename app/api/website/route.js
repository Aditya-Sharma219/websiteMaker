import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(
      `You are a website generator AI. Given the following prompt, generate a complete website.
Prompt: "${prompt}"

Return ONLY in strict JSON format without code fences or markdown, exactly like:
{
  "html": "<!DOCTYPE html> ...",
  "css": "body { ... }",
  "js": "console.log('...')"
}
Do not include ANY explanation or extra text.`
    );

    const textFn = result?.response?.text;
    let data = { error: "No response from AI" };

    if (typeof textFn === "function") {
      let reply = await textFn();

      // 🛠 Extract only the JSON part
      const start = reply.indexOf("{");
      const end = reply.lastIndexOf("}");
      if (start !== -1 && end !== -1) {
        reply = reply.slice(start, end + 1);
      }

      try {
        data = JSON.parse(reply);
      } catch (err) {
        console.error("JSON parse error:", err, "Original reply:", reply);
        data = { error: "Invalid JSON from AI" };
      }
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[WebsiteBuilder API Error]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
