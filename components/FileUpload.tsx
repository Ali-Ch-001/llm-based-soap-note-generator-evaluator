"use client";

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  label: string;
  onFileLoaded: (content: string, filename: string) => void;
  accept?: Record<string, string[]>;
  currentFile?: string | null;
  onClear?: () => void;
}

export function FileUpload({ label, onFileLoaded, accept = { 'text/plain': ['.txt'] }, currentFile, onClear }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        onFileLoaded(text, file.name);
      };
      reader.readAsText(file);
    }
  }, [onFileLoaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, maxFiles: 1 });

  if (currentFile) {
    return (
        <div className="flex items-center justify-between p-4 border border-teal-200 bg-teal-50 rounded-lg shadow-sm">
            <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-teal-600" />
                <div>
                    <p className="text-sm font-medium text-teal-900">{label}</p>
                    <p className="text-xs text-teal-600 truncate max-w-[200px]">{currentFile}</p>
                </div>
            </div>
            <button onClick={onClear} className="p-1 hover:bg-teal-100 rounded-full transition-colors text-teal-600">
                <X className="w-4 h-4" />
            </button>
        </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "cursor-pointer p-8 border-2 border-dashed rounded-xl transition-all duration-200 ease-in-out flex flex-col items-center justify-center text-center gap-3 group bg-white",
        isDragActive ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-teal-400 hover:bg-slate-50"
      )}
    >
      <input {...getInputProps()} />
      <div className={cn("p-3 rounded-full bg-slate-100 group-hover:bg-teal-100 transition-colors", isDragActive && "bg-teal-100")}>
        <Upload className={cn("w-6 h-6 text-slate-400 group-hover:text-teal-600 transition-colors", isDragActive && "text-teal-600")} />
      </div>
      <div>
        <p className="font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-1">Drag & drop or click to upload .txt</p>
      </div>
    </div>
  );
}
