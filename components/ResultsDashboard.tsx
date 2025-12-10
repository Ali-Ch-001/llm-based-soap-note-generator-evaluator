"use client";

import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { Check, AlertCircle, Copy, Bot, Download, FileJson, Trophy, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { estimateCost, estimateTokens } from '@/lib/billing';

export interface EvaluationResult {
  modelName: string;
  note: string;
  loading: boolean;
  metrics?: {
    rouge1: number;
    rougeL: number;
    bleu: number;
    semantic: number;
    lengthRatio: number;
  };
  error?: string;
}

interface ResultsDashboardProps {
  results: EvaluationResult[];
  referenceNote: string;
}

export function ResultsDashboard({ results, referenceNote }: ResultsDashboardProps) {

  // Prepare data for chart
  const chartData = results.filter(r => r.metrics).map(r => ({
    name: r.modelName,
    ROUGE1: r.metrics?.rouge1 || 0,
    ROUGEL: r.metrics?.rougeL || 0,
    BLEU: r.metrics?.bleu || 0,
    Semantic: r.metrics?.semantic || 0,
    LengthRatio: r.metrics?.lengthRatio || 0,
    // Calculate simple score for sorting/best: Avg of 4 quality metrics
    Score: ((r.metrics?.rouge1 || 0) + (r.metrics?.rougeL || 0) + (r.metrics?.bleu || 0) + (r.metrics?.semantic || 0)) / 4
  }));

  // Identify Winner (Highest Score)
  const sortedByScore = [...chartData].sort((a, b) => b.Score - a.Score);
  const bestModelName = sortedByScore.length > 0 ? sortedByScore[0].name : null;

  // Identify Best In Class (for highlighting columns)
  const maxR1 = Math.max(...chartData.map(d => d.ROUGE1));
  const maxRL = Math.max(...chartData.map(d => d.ROUGEL));
  const maxBleu = Math.max(...chartData.map(d => d.BLEU));
  const maxSim = Math.max(...chartData.map(d => d.Semantic));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 slide-in-from-bottom-4">
      {/* Metrics Visualization */}
      {chartData.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Model Performance Benchmark</h2>
            <button 
                onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href",     dataStr);
                    downloadAnchorNode.setAttribute("download", "soap_eval_results.json");
                    document.body.appendChild(downloadAnchorNode); // required for firefox
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
                <FileJson className="w-4 h-4" />
                Export JSON
            </button>
          </div>
          
          <div className="flex flex-col gap-8">
            {/* Chart */}
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{fill: '#64748B'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#64748B'}} axisLine={false} tickLine={false} domain={[0, 1]} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#F1F5F9', radius: 4}} 
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="ROUGE1" fill="url(#colorR1)" radius={[4, 4, 0, 0]} name="ROUGE-1" />
                    <Bar dataKey="ROUGEL" fill="url(#colorRL)" radius={[4, 4, 0, 0]} name="ROUGE-L" />
                    <Bar dataKey="BLEU" fill="url(#colorBleu)" radius={[4, 4, 0, 0]} name="BLEU" />
                    <Bar dataKey="Semantic" fill="url(#colorSim)" radius={[4, 4, 0, 0]} name="Semantic Sim" />
                    <defs>
                        <linearGradient id="colorR1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRL" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorBleu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Comparison Matrix Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-bold tracking-wider">Model</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-sky-700 bg-sky-50/50">ROUGE-1</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-indigo-700 bg-indigo-50/50">ROUGE-L</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-purple-700 bg-purple-50/50">BLEU</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-emerald-700 bg-emerald-50/50">Semantic</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-slate-600">Length</th>
                            <th className="px-6 py-4 font-bold tracking-wider text-amber-700 bg-amber-50/50">Cost (Est)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {results.map((r, i) => {
                            const m = r.metrics;
                            const isWinner = r.modelName === bestModelName;
                            
                            // Cell Highlighting Helpers
                            const isBestR1 = m && m.rouge1 === maxR1 && maxR1 > 0;
                            const isBestRL = m && m.rougeL === maxRL && maxRL > 0;
                            const isBestBleu = m && m.bleu === maxBleu && maxBleu > 0;
                            const isBestSim = m && m.semantic === maxSim && maxSim > 0;

                            return (
                            <tr key={r.modelName} className={cn("transition-colors", isWinner ? "bg-amber-50/30" : "hover:bg-slate-50/50")}>
                                <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", r.loading ? "bg-slate-300 animate-pulse" : "bg-teal-500 shadow-sm shadow-teal-500/50")} />
                                    <div className="flex flex-col">
                                        <span>{r.modelName}</span>
                                        {isWinner && !r.loading && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 uppercase tracking-wider mt-0.5">
                                                <Trophy className="w-3 h-3 ml-px" /> 
                                                Best Response
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className={cn("px-6 py-4 font-mono", isBestR1 ? "font-bold text-sky-700 bg-sky-50" : "text-slate-600")}>
                                    {m?.rouge1.toFixed(3) || '-'} {isBestR1 && "✨"}
                                </td>
                                <td className={cn("px-6 py-4 font-mono", isBestRL ? "font-bold text-indigo-700 bg-indigo-50" : "text-slate-600")}>
                                    {m?.rougeL.toFixed(3) || '-'} {isBestRL && "✨"}
                                </td>
                                <td className={cn("px-6 py-4 font-mono", isBestBleu ? "font-bold text-purple-700 bg-purple-50" : "text-slate-600")}>
                                    {m?.bleu.toFixed(3) || '-'} {isBestBleu && "✨"}
                                </td>
                                <td className={cn("px-6 py-4 font-mono", isBestSim ? "font-bold text-emerald-700 bg-emerald-50" : "text-slate-600")}>
                                    {m?.semantic.toFixed(3) || '-'} {isBestSim && "✨"}
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-600">
                                    {m?.lengthRatio.toFixed(2) || '-'}x
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-500">
                                    ${estimateCost(r.modelName, estimateTokens(r.note || ''), estimateTokens(r.note || '')).toFixed(5)}
                                </td>
                            </tr>
                        )})}
                    </tbody>
                </table>
            </div>
          </div>
        </section>
      )}

      {/* Generated Notes Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {results.map((result) => (
            <div key={result.modelName} className={cn(
                "flex flex-col rounded-xl border overflow-hidden transition-all bg-white",
                result.loading ? "border-slate-200 shadow-none" : "border-slate-200 shadow-sm hover:shadow-md"
            )}>
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-md border border-slate-200">
                             <Bot className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                             <span className="font-semibold text-slate-700 block text-sm">{result.modelName}</span>
                             {/* Cost & Token Estimation Display */}
                             {!result.loading && !result.error && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                    ~{estimateTokens(result.note)} tokens • ${estimateCost(result.modelName, estimateTokens(result.note), estimateTokens(result.note)).toFixed(5)}
                                </span>
                             )}
                        </div>
                    </div>
                    {result.metrics && (
                         <div className="flex gap-2 text-xs font-mono flex-wrap justify-end">
                            <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-md">R1: {result.metrics.rouge1.toFixed(2)}</span>
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">RL: {result.metrics.rougeL.toFixed(2)}</span>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md">Sim: {result.metrics.semantic.toFixed(2)}</span>
                            <span className={cn("px-2 py-1 rounded-md", 
                                Math.abs(1 - result.metrics.lengthRatio) < 0.2 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                            )}>
                                Len: {result.metrics.lengthRatio.toFixed(2)}x
                            </span>
                         </div>
                    )}
                </div>
                
                <div className="p-4 flex-1 min-h-[300px] max-h-[500px] overflow-y-auto font-sans text-sm text-slate-600 leading-relaxed whitesapce-pre-wrap">
                    {result.loading ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                            <p>Generating...</p>
                        </div>
                    ) : result.error ? (
                        <div className="flex items-center gap-2 text-red-500 bg-red-50 p-4 rounded-lg">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{result.error}</p>
                        </div>
                    ) : (
                        <div className="whitespace-pre-wrap">{result.note}</div>
                    )}
                </div>
                
                {!result.loading && !result.error && (
                    <div className="p-3 border-t border-slate-100 flex justify-end bg-slate-50">
                        <button 
                            onClick={() => copyToClipboard(result.note)}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                        </button>
                    </div>
                )}
            </div>
        ))}
      </section>

      {/* Reference Note Drawer/Section */}
      <section className="bg-slate-50 rounded-xl border border-slate-200 p-6 opacity-75 hover:opacity-100 transition-opacity">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Reference Note</h3>
        <pre className="text-sm text-slate-600 whitespace-pre-wrap font-sans">{referenceNote || "No reference note uploaded yet."}</pre>
      </section>
    </div>
  );
}
