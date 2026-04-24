require("dotenv").config({ path: ".env.local" });
const { GoogleGenerativeAI } = require("@google/generative-ai");

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

Images: https://picsum.photos/400/300?random=1 (vary numbers 1-20)`;

async function main() {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
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

  const prompt = `You are building a SaaS Landing Page.
The aesthetic should be: Playful & Vibrant (Rounded shapes, bright colors, fun).
Core user request: A web agency trying to sell SEO services.

Make sure to apply the requested theme and layout meticulously.`;

  const fullPrompt = `${SYSTEM_PROMPT}\n\nUser request: ${prompt}`;

  try {
      console.log("Generating...");
      const result = await model.generateContent(fullPrompt);
      const text = await result.response.text();
      
      const candidate = result.response.candidates && result.response.candidates[0];
      const finishReason = candidate ? candidate.finishReason : 'UNKNOWN';
      console.log("RESPONSE LENGTH:", text.length, "| FINISH REASON:", finishReason);
      
      if (finishReason !== 'STOP') {
        console.log("ABNORMAL TERMINATION! Raw snippet:", text.slice(-500));
      }
      console.log("Written successfully.");
  } catch(e) {
      console.log("EXCEPTION CAUGHT: ", e);
  }
}

main().catch(console.error);
