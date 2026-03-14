import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const SYSTEM_PROMPT = `You are an expert website generator.
Return ONLY raw HTML. No markdown. No backticks. No explanation.
Start with <!DOCTYPE html> end with </html>.
CSS in <style> tag in <head>. JS in <script> tag before </body>.
NO external fonts or stylesheets. Use system fonts only.
Dark theme. Fully responsive.

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

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
      },
    });

    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser request: ${prompt}`;

    const result = await model.generateContent(fullPrompt);
    const text = await result.response.text();

    console.log("RESPONSE LENGTH:", text.length);

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
      js: extractJS(html)
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

  const start = cleaned.indexOf("<!DOCTYPE");
  const end = cleaned.lastIndexOf("</html>");

  if (start !== -1 && end !== -1) {
    return cleaned.slice(start, end + 7);
  }

  if (start !== -1) return cleaned.slice(start);

  const start2 = cleaned.indexOf("<html");
  if (start2 !== -1) return cleaned.slice(start2);

  if (cleaned.includes("<body")) return cleaned;

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