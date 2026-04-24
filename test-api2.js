require("dotenv").config({ path: ".env.local" });
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const SYSTEM_PROMPT = `You are a master. Output lots of text. Output lots of text. Output lots of text.`;

async function main() {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const prompt = `Write a 5000 word essay about the history of the internet. Make it very long.`;

  try {
      console.log("Generating...");
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
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
      
      const candidate = result.response.candidates && result.response.candidates[0];
      const finishReason = candidate ? candidate.finishReason : 'UNKNOWN';
      console.log("RESPONSE LENGTH:", text.length, "| FINISH REASON:", finishReason);
      
  } catch(e) {
      console.log("EXCEPTION CAUGHT: ", e);
  }
}

main().catch(console.error);
