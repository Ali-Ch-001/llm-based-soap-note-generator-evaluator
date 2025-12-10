"use client";

import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ModelSelector } from '@/components/ModelSelector';
import { ResultsDashboard, EvaluationResult } from '@/components/ResultsDashboard';
import { Play, RotateCcw, Stethoscope, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Home() {
  const [transcript, setTranscript] = useState<{content: string, name: string} | null>(null);
  const [reference, setReference] = useState<{content: string, name: string} | null>(null);
  
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Handlers
  const handleTranscriptLoad = (content: string, name: string) => setTranscript({ content, name });
  const handleReferenceLoad = (content: string, name: string) => setReference({ content, name });
  
  const toggleModel = (value: string) => {
    setSelectedModels(prev => 
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    );
  };

  const handleClear = () => {
    setTranscript(null);
    setReference(null);
    setResults([]);
    setSelectedModels([]);
  };
  
  const handleGenerate = async () => {
    if (!transcript || selectedModels.length === 0) return;
    
    setIsGenerating(true);
    
    // Initialize results with loading state
    const newResults: EvaluationResult[] = selectedModels.map(model => ({ modelName: model, note: '', loading: true } as EvaluationResult));
    setResults(newResults);

    // Helper to process one model
    const processModel = async (model: string) => {
        try {
            // Determine provider based on model value string or hardcoded known lists
            // A clearer way would be to import the lists or just guess. 
            // Better: loop through known lists to find provider.
            let provider = 'openai'; 
            if (model.includes('gemini')) provider = 'gemini';
            else if (model === 'local-t5') provider = 'local';
            else if (model.includes('HuggingFaceTB') || model.includes('katanemo')) provider = 'huggingface';
            // Fallback default is openai

            // 1. Generate
            const genRes = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, transcript: transcript.content, provider })
            });

            const genData = await genRes.json();
            if (!genRes.ok) throw new Error(genData.error || 'Generation failed');
            
            const generatedNote = genData.result;

            // 2. Evaluate (if reference exists)
            let metrics = undefined;
            if (reference) {
                const evalRes = await fetch('/api/evaluate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ generated: generatedNote, reference: reference.content })
                });
                const evalData = await evalRes.json();
                if (evalRes.ok) metrics = evalData.metrics;
            }

            // Update state
            setResults(prev => prev.map(r => 
                r.modelName === model 
                ? { ...r, note: generatedNote, loading: false, metrics } 
                : r
            ));

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setResults(prev => prev.map(r => 
                r.modelName === model 
                ? { ...r, loading: false, error: errorMessage } 
                : r
            ));
        }
    };

    // Trigger all in parallel
    const promises = selectedModels.map(m => processModel(m));
    
    await Promise.allSettled(promises);
    setIsGenerating(false);
  };

  const canGenerate = transcript && selectedModels.length > 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
                <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
                    <div className="p-2.5 bg-linear-to-br from-teal-500 to-emerald-600 rounded-xl text-white shadow-lg shadow-teal-500/20">
                        <Stethoscope className="w-8 h-8" />
                    </div>
                    SOAP Note AI
                </h1>
                <p className="text-slate-500 mt-2 text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Multi-Model Generation & Evaluation
                </p>
            </div>
            
            {results.length > 0 && (
                <button 
                    onClick={handleClear}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Start Over
                </button>
            )}
        </header>

        <main className="space-y-8">
            
            {/* Input Section */}
            <section className={cn("grid md:grid-cols-2 gap-6 transition-all", results.length > 0 && "hidden")}>
                <FileUpload 
                    label="Upload Clinical Transcript" 
                    currentFile={transcript?.name}
                    onFileLoaded={handleTranscriptLoad}
                    onClear={() => setTranscript(null)}
                />
                <FileUpload 
                    label="Upload Reference SOAP Note" 
                    currentFile={reference?.name}
                    onFileLoaded={handleReferenceLoad}
                    onClear={() => setReference(null)}
                />
            </section>

            {/* Model Selection */}
            {transcript && reference && results.length === 0 && (
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">Model Configuration</h2>
                    <ModelSelector 
                        selectedModels={selectedModels}
                        onToggleModel={toggleModel}
                    />
                    
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate || isGenerating}
                            className={cn(
                                "flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
                                canGenerate ? "bg-linear-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500" : "bg-slate-300 text-slate-500"
                            )}
                        >
                            {isGenerating ? (
                                <>Generating...</>
                            ) : (
                                <>
                                    <Play className="w-5 h-5 fill-current" />
                                    Generate Notes
                                </>
                            )}
                        </button>
                    </div>
                </section>
            )}

            {/* Results */}
            {results.length > 0 && (
                <ResultsDashboard results={results} referenceNote={reference?.content || ''} />
            )}
            
        </main>

        <footer className="mt-24 border-t border-slate-200 pt-8 text-center text-slate-400 text-sm">
            <p>© 2025 AI MedAssist. Built for Evaluation.</p>
        </footer>
      </div>
    </div>
  );
}
