export function estimateTokens(text: string) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

export function estimateCost(model: string, inputTokens: number, outputTokens: number) {
    // Estimations per 1K tokens (approximate)
    const rates: Record<string, {in: number, out: number}> = {
        'gpt-4o': { in: 0.005, out: 0.015 },
        'gpt-4o-mini': { in: 0.00015, out: 0.0006 },
        'gpt-3.5-turbo': { in: 0.0005, out: 0.0015 },
        'gemini-1.5-pro': { in: 0, out: 0 },
        'gemini-1.5-flash': { in: 0, out: 0 },
        'gemini-pro': { in: 0, out: 0 },
        'local-t5': { in: 0, out: 0 },
        // Hugging Face Models (Free Inference API usually)
        'HuggingFaceTB/SmolLM3-3B:hf-inference': { in: 0, out: 0 }, 
        'katanemo/Arch-Router-1.5B:hf-inference': { in: 0, out: 0 }
    };
    
    const rate = rates[model] || { in: 0, out: 0 };
    return (inputTokens / 1000 * rate.in) + (outputTokens / 1000 * rate.out);
}
