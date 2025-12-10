import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { pipeline } from "@xenova/transformers";

let generator: any = null;
const getGenerator = async () => {
    if (!generator) {
        // Using a tiny model for demonstration speed and memory safety in serverless/browser
        // LaMini-Flan-T5-77M is very small but instructed for tasks. 
        // Or Xenova/distilgpt2 (80MB).
        // Let's go with LaMini-Flan-T5-77M for decent instruction following vs size.
        generator = await pipeline('text2text-generation', 'Xenova/LaMini-Flan-T5-248M'); 
    }
    return generator;
};

// Initialize OpenAI conditionally
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
};

// Initialize HF Client (using OpenAI SDK compatible endpoint)
const getHuggingFace = () => {
    const apiKey = process.env.HF_TOKEN; 
    if (!apiKey) throw new Error("HF_TOKEN is not set");
    return new OpenAI({
        baseURL: "https://router.huggingface.co/v1",
        apiKey: apiKey
    });
}

// Initialize Gemini
const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenerativeAI(apiKey);
};

export async function generateWithGPT(model: string, transcript: string) {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error(
      "OpenAI API Key is missing. Please add OPENAI_API_KEY to your .env file."
    );
  }

  const prompt = `Generate a SOAP note based on the following clinical transcript:
  
<TRANSCRIPT>
${transcript}
</TRANSCRIPT>

Output ONLY the SOAP note content.`;

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0]?.message?.content || "No output generated.";
  } catch (error: any) {
    console.error("GPT Generation Error:", error);
    
    if (error.status === 429 || error.message?.includes('429')) {
         throw new Error("Rate Limit Exceeded (429). Please wait a moment or check your OpenAI plan/quota.");
    }
    if (error.status === 401 || error.message?.includes('401')) {
         throw new Error("Invalid API Key (401). Please check your OPENAI_API_KEY.");
    }

    throw new Error(error.message || "Failed to generate with GPT");
  }
}

export async function generateWithHF(model: string, transcript: string) {
    try {
        const client = getHuggingFace();
        const prompt = `Generate a SOAP note based on the following clinical transcript:\n\n<TRANSCRIPT>\n${transcript}\n</TRANSCRIPT>\n\nOutput ONLY the SOAP note content.`;
        
        const completion = await client.chat.completions.create({
            model: model, // e.g. "HuggingFaceTB/SmolLM3-3B:hf-inference"
            messages: [
                { role: "user", content: prompt }
            ],
            max_tokens: 500, // Reasonable limit for free inference
        });

        return completion.choices[0]?.message?.content || "No output generated from HF.";
    } catch (error: any) {
        console.error("HF Generation Error:", error);
        throw new Error(error.message || "Failed to generate with Hugging Face");
    }
}

export async function generateWithGemini(
  modelName: string,
  transcript: string
) {
  const prompt = `Generate a SOAP note based on the following clinical transcript:
  
<TRANSCRIPT>
${transcript}
</TRANSCRIPT>

Output ONLY the SOAP note content.`;

  try {
    const genAI = getGemini();
    // Use the model name provided or default to 'gemini-1.5-pro' if generic
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error: any) {
    console.error('Gemini Generation Error:', error);
    
    // Auto-fallback for 404s (common with region-locked or legacy models)
    if (error.message?.includes('404') || error.message?.includes('not found')) {
         console.log("Retrying with gemini-pro fallback...");
         try {
             // Re-initialize genAI to be safe
             const genAI = getGemini();
             const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
             const result = await fallbackModel.generateContent(prompt);
             const response = await result.response;
             return response.text();
         } catch (fallbackError: any) {
             throw new Error(`Primary model and fallback (gemini-pro) failed: ${fallbackError.message}`);
         }
    }
    
    throw new Error(error.message || 'Failed to generate with Gemini');
  }
}

export async function generateWithLocal(model: string, transcript: string) {
    try {
        const generate = await getGenerator();
        const prompt = `Generate a SOAP note based on this transcript:\n\n${transcript}\n\nSOAP Note:`;
        
        // Truncate input if too long to avoid OOM or slow processing on free tiers
        const inputs = prompt.slice(0, 2000); 

        const output = await generate(inputs, {
            max_new_tokens: 250,
            temperature: 0.5,
            repetition_penalty: 1.2
        });
        
        return output[0].generated_text || "No output from local model.";
    } catch (error: any) {
        console.error("Local Generation Error:", error);
        throw new Error("Failed to generate locally: " + error.message);
    }
}
