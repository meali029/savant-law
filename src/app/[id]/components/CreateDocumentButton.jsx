import React from 'react'
import { Plus } from 'lucide-react'

export default function CreateDocumentButton({ onClick }) {
  return (
    <div
      onClick={onClick}
      className="h-72 flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
      <Plus className="w-8 h-8 text-indigo-600 mb-3" />
      <h3 className="text-lg font-semibold text-indigo-700 dark:text-indigo-400">Create New Document</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center px-4">
        Generate from scratch or upload existing document
      </p>
    </div>
  )
}