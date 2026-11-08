"use client";
import { FolderOpen, Info } from "lucide-react";
export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-charcoal-900">Documents</h1><p className="text-sm text-charcoal-400 mt-1">Upload and manage receipts, contracts, and financial documents</p></div>
      <div className="bg-info/5 border border-info/20 rounded-xl px-5 py-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-info mt-0.5 flex-shrink-0" />
        <div><p className="text-sm font-medium text-charcoal-800">Document upload coming soon</p><p className="text-xs text-charcoal-500 mt-1">AI-powered receipt scanning and document extraction will be available in an upcoming release. Expense records can be manually added from the Expenses page.</p></div>
      </div>
      <div className="bg-white rounded-xl border border-sage-200 p-12 text-center">
        <FolderOpen className="w-12 h-12 text-charcoal-200 mx-auto mb-4" />
        <p className="text-sm font-medium text-charcoal-600">No documents yet</p>
        <p className="text-xs text-charcoal-400 mt-1">Document upload and AI extraction will appear here once the feature is enabled.</p>
      </div>
    </div>
  );
}
