"use client";
import { FolderOpen, Upload } from "lucide-react";
export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-charcoal-900">Documents</h1><p className="text-sm text-charcoal-400 mt-1">Upload and manage receipts, contracts, and financial documents</p></div>
      <div className="bg-white rounded-xl border-2 border-dashed border-sage-300 p-12 text-center">
        <Upload className="w-12 h-12 text-charcoal-200 mx-auto mb-4" />
        <p className="text-sm font-medium text-charcoal-600">Drop files here or click to upload</p>
        <p className="text-xs text-charcoal-400 mt-1">PDF, PNG, JPG up to 10MB. AI will extract key details for your review.</p>
        <button className="mt-4 bg-forest-600 hover:bg-forest-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl">Browse Files</button>
      </div>
      <div className="text-center py-8"><FolderOpen className="w-12 h-12 text-charcoal-200 mx-auto mb-4" /><p className="text-sm font-medium text-charcoal-600">No documents uploaded yet</p><p className="text-xs text-charcoal-400 mt-1">Upload receipts and invoices to get started with AI extraction.</p></div>
    </div>
  );
}
