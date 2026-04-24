import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const SYSTEM_PROMPT = `You are an expert master frontend developer and UI/UX designer.
You must return ONLY raw, complete HTML. No markdown formatting. No backticks. No conversational text.
Your response should start with <!DOCTYPE html> and end with </html>.
CSS must be in a <style> tag in the <head>. JS must be in a <script> tag just before </body>.
ONLY use Vanilla HTML, CSS, and JS. Do not use React, Vue, or Tailwind CDN.
Always explicitly define a background-color and color on the <body> tag in your CSS.
Make the design massive, beautiful, fully responsive, and professional.

MUST include ALL these sections:
1. Sticky Navbar with logo and nav links
2. Hero section with background image and CTA button
3. Features section with 3 cards
4. Testimonials section with 3 cards  
5. Pricing section with 3 tiers (Basic, Pro, Enterprise)
6. Contact form (name, email, message, submit button)
7. Footer with links and copyright

Images: https://picsum.photos/400/300?random=1 (vary numbers 1-20)
Make it beautiful, modern, complete and professional.`;

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser request: ${prompt}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    });
    const text = await result.response.text();
    
    // Debug info
    const candidate = result.response.candidates && result.response.candidates[0];
    const finishReason = candidate ? candidate.finishReason : 'UNKNOWN';
    console.log("RESPONSE LENGTH:", text.length, "| FINISH REASON:", finishReason);

    if (finishReason !== 'STOP') {
      console.log("ABNORMAL TERMINATION! Raw snippet:", text.slice(-500));
    }

    let html = extractHTML(text);

    if (!html) {
      console.error("EXTRACTION FAILED:", text.slice(0, 200));
      return NextResponse.json({ error: "Failed to generate website." }, { status: 500 });
    }

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
      finishReason
    });

  } catch (err) {
    console.error("API ERROR:", err.message);
    return NextResponse.json({ error: "Server error: " + err.message }, { status: 500 });
  }
}

function extractHTML(text) {
  let cleaned = text
    .replace(/```html/gi, "")
    .replace(/```/g, "")
    .trim();

  const startMatch = cleaned.match(/<!doctype|<html/i);
  const endMatches = [...cleaned.matchAll(/<\/html>/gi)];
  const endMatch = endMatches.length > 0 ? endMatches[endMatches.length - 1] : null;

  if (startMatch && endMatch) {
    const startIdx = startMatch.index;
    const endIdx = endMatch.index + 7;
    return cleaned.slice(startIdx, endIdx);
  }

  if (startMatch) {
    return cleaned.slice(startMatch.index);
  }

  if (cleaned.includes("<body") || cleaned.includes("<BODY")) return cleaned;

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