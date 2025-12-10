"use client";

import React from 'react';
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelOption {
  value: string;
  label: string;
  provider: 'openai' | 'gemini' | 'local' | 'huggingface';
}

export const GPT_MODELS: ModelOption[] = [
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' },
  { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo Preview', provider: 'openai' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'openai' },
  { value: 'katanemo/Arch-Router-1.5B', label: 'Arch-Router-1.5B (HF Free)', provider: 'huggingface' },
];

export const GEMINI_MODELS: ModelOption[] = [
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'gemini' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', provider: 'gemini' },
  { value: 'gemini-pro', label: 'Gemini Pro (Legacy)', provider: 'gemini' },
];

interface ModelSelectorProps {
  selectedModels: string[];
  onToggleModel: (value: string) => void;
}

export function ModelSelector({ selectedModels, onToggleModel }: ModelSelectorProps) {
  const allModels = [...GPT_MODELS, ...GEMINI_MODELS];

  return (
    <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center justify-between">
            Select Models to Compare
            <div className="text-xs font-normal bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                {selectedModels.length} selected
            </div>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allModels.map((model) => {
                const isSelected = selectedModels.includes(model.value);
                const isHF = model.provider === 'huggingface';
                const isLocal = model.provider === 'local';
                const isGemini = model.provider === 'gemini';
                
                let badgeColor = "bg-slate-100 text-slate-500";
                if (isHF) badgeColor = "bg-yellow-100 text-yellow-700";
                if (isLocal) badgeColor = "bg-purple-100 text-purple-700";
                if (isGemini) badgeColor = "bg-blue-100 text-blue-700";
                if (model.provider === 'openai') badgeColor = "bg-green-100 text-green-700";

                return (
                    <button
                        key={model.value}
                        onClick={() => onToggleModel(model.value)}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                            isSelected 
                                ? "border-teal-500 bg-teal-50/50 shadow-sm ring-1 ring-teal-500" 
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        )}
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className={cn("text-xs font-bold uppercase tracking-wider mb-1 px-1.5 py-0.5 rounded w-fit", badgeColor)}>
                                {model.provider}
                            </span>
                            <span className="font-medium text-slate-700 text-sm">{model.label}</span>
                        </div>
                        
                        <div className={cn(
                            "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                            isSelected ? "bg-teal-500 border-teal-500" : "border-slate-300 bg-white"
                        )}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
  );
}
