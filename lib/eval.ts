import { pipeline } from '@xenova/transformers';
import similarity from 'compute-cosine-similarity';

// Singleton for extractor to avoid reloading model
type FeatureExtractionPipeline = (text: string, options?: { pooling?: string; normalize?: boolean }) => Promise<{ data: Float32Array | number[] }>;
let extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    // using a small, fast model for embeddings
    const pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    extractor = pipe as unknown as FeatureExtractionPipeline;
  }
  return extractor;
}

export function calculateRouge(generated: string, reference: string) {

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

// BLEU Score Implementation
export function calculateBleu(generated: string, reference: string) {
  const sanitize = (text: string) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/);
  
  const cand = sanitize(generated);
  const ref = sanitize(reference);

  if (cand.length === 0) return 0;
  if (ref.length === 0) return 0;

  // Calculate precisions for n-grams 1 to 4
  let logSum = 0;
  const maxOrder = 4;
  
  for (let n = 1; n <= maxOrder; n++) {
      const counts = new Map<string, number>();
      
      // Get counts for candidate n-grams
      for (let i = 0; i <= cand.length - n; i++) {
          const ngram = cand.slice(i, i + n).join(' ');
          counts.set(ngram, (counts.get(ngram) || 0) + 1);
      }
      
      const totalCandNGrams = Math.max(1, cand.length - n + 1);

      // Get max counts for reference n-grams (clipped)
      let matches = 0;
      const refCounts = new Map<string, number>();
      for (let i = 0; i <= ref.length - n; i++) {
           const ngram = ref.slice(i, i + n).join(' ');
           refCounts.set(ngram, (refCounts.get(ngram) || 0) + 1);
      }
      
      for (const [ngram, count] of counts) {
           matches += Math.min(count, refCounts.get(ngram) || 0);
      }
      
      let p_n = matches / totalCandNGrams;
      if (p_n === 0) {
          // Smoothing
          p_n = 1 / (totalCandNGrams + 1);
      }
      logSum += Math.log(p_n);
  }

  // Brevity Penalty
  const r = ref.length;
  const c = cand.length;
  const bp = c > r ? 1 : Math.exp(1 - r / c);

  return bp * Math.exp(logSum / maxOrder);
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
