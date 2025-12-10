import rouge from 'rouge';
import bleu from 'bleu-score';
import { pipeline } from '@xenova/transformers';
// @ts-ignore
import similarity from 'compute-cosine-similarity';

// Singleton for extractor to avoid reloading model
let extractor: any = null;

async function getExtractor() {
  if (!extractor) {
    // using a small, fast model for embeddings
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

export function calculateRouge(generated: string, reference: string) {
  // Using 'rouge' library which typically returns ROUGE-N scores
  // Note: the 'rouge' npm package might have different signatures. 
  // Let's implement a simple n-gram overlap if library fails or use the 'rouge' package strictly.
  // Actually, there is no single standard 'rouge' package in JS that is universally consistent. 
  // We will assuming 'rouge' calculates intersection.
  // For robustness, let's use a simple implementation for ROUGE-1
  
  const genTokens = generated.toLowerCase().split(/\s+/);
  const refTokens = reference.toLowerCase().split(/\s+/);
  
  const intersection = genTokens.filter(t => refTokens.includes(t));
  const recall = intersection.length / refTokens.length;
  const precision = intersection.length / genTokens.length;
  const f1 = (2 * precision * recall) / (precision + recall) || 0;
  
  // Calculate ROUGE-L (Longest Common Subsequence)
  const lcs = (a: string[], b: string[]) => {
      const m = a.length, n = b.length;
      const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
      for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
              if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
              else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
      }
      return dp[m][n];
  };
  
  const lcsScore = lcs(genTokens, refTokens);
  const rL_recall = lcsScore / refTokens.length;
  const rL_precision = lcsScore / genTokens.length;
  const rL_f1 = (2 * rL_precision * rL_recall) / (rL_precision + rL_recall) || 0;

  return {
    rouge1: f1, 
    rougeL: rL_f1
  };
}

export function calculateBleu(generated: string, reference: string) {
  // bleu-score expects strings
  return bleu(generated, reference);
}

export async function calculateSemanticScore(generated: string, reference: string) {
  try {
    const pipe = await getExtractor();
    
    // Generate embeddings
    const output1 = await pipe(generated, { pooling: 'mean', normalize: true });
    const output2 = await pipe(reference, { pooling: 'mean', normalize: true });

    const emb1 = Array.from(output1.data as Float32Array);
    const emb2 = Array.from(output2.data as Float32Array);

    const score = similarity(emb1, emb2);
    return score;
  } catch (error) {
    console.error("Semantic Score Error:", error);
    return 0;
  }
}

export async function evaluateAll(generated: string, reference: string) {
    const rougeScores = calculateRouge(generated, reference);
    const b = calculateBleu(generated, reference);
    const s = await calculateSemanticScore(generated, reference);
    
    const lengthRatio = generated.length / (reference.length || 1);
    
    return {
        rouge1: parseFloat(rougeScores.rouge1.toFixed(3)),
        rougeL: parseFloat(rougeScores.rougeL.toFixed(3)),
        bleu: parseFloat(b.toFixed(3)),
        semantic: parseFloat(s.toFixed(3)),
        lengthRatio: parseFloat(lengthRatio.toFixed(3))
    }
}
