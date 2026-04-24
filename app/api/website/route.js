import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const SYSTEM_PROMPT = `You are an expert frontend developer.

Return ONLY raw HTML.
No markdown. No backticks. No explanation.

Start with <!DOCTYPE html> and end with </html>.
CSS inside <style> in <head>.
JS inside <script> before </body>.
No external libraries.

Include:
- Navbar
- Hero
- Features (3)
- Testimonials (3)
- Pricing (3)
- Contact form
- Footer

Fully responsive. Clean UI.`;

// ✅ MODEL CONFIG HERE (stable)
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 6000, // reduced = more stable
  },
});

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser request: ${prompt}`;

    // ✅ SIMPLE CALL (MOST IMPORTANT FIX)
    const result = await model.generateContent(fullPrompt);
    const text = await result.response.text();

    const candidate = result.response.candidates?.[0];
    const finishReason = candidate?.finishReason || "UNKNOWN";

    console.log("LEN:", text.length, "| FINISH:", finishReason);

    let html = extractHTML(text);

    // ✅ FALLBACK (never break UI)
    if (!html) {
      console.warn("Extraction failed, using raw output");
      html = text;
    }

    // ✅ FORCE CLOSE TAGS (critical)
    if (!html.includes("</html>")) {
      if (!html.includes("</body>")) {
        html += "\n</body>\n</html>";
      } else {
        html += "\n</html>";
      }
    }

    return NextResponse.json({
      html,
      css: extractCSS(html),
      js: extractJS(html),
      finishReason,
    });
  } catch (err) {
  console.error("API ERROR:", err);

  let message = "Server error";

  if (err.message.includes("429")) {
    message = "Rate limit exceeded. Try again later.";
  } else if (err.message.includes("quota")) {
    message = "API quota exceeded.";
  } else if (err.message.includes("network")) {
    message = "Network error.";
  }

  return NextResponse.json({ error: message }, { status: 500 });

  }
}

// ✅ STRONGER EXTRACTION (more tolerant)
function extractHTML(text) {
  if (!text) return null;

  let cleaned = text
    .replace(/```html/gi, "")
    .replace(/```/g, "")
    .trim();

  // try full html
  const start = cleaned.search(/<!doctype|<html/i);
  const end = cleaned.toLowerCase().lastIndexOf("</html>");

  if (start !== -1 && end !== -1) {
    return cleaned.slice(start, end + 7);
  }

  // partial fallback
  if (start !== -1) {
    return cleaned.slice(start);
  }

  // body fallback
  if (cleaned.includes("<body")) {
    return `<!DOCTYPE html>\n<html>\n${cleaned}\n</html>`;
  }

  return null;
}

function extractCSS(html) {
  const match = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  return match ? match[1].trim() : "";
}

function extractJS(html) {
  const match = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
  return match ? match[1].trim() : "";
}