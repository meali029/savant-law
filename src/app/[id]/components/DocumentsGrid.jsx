import React from 'react'
import DocumentCard from './DocumentCard'
import CreateDocumentButton from './CreateDocumentButton'

export default function DocumentsGrid({
  documents,
  selectedDocuments,
  isSelectionMode,
  onCreateDocument,
  onDocumentClick,
  onToggleSelection,
  onRenameDocument,
  onDeleteDocument,
  onVersionUpdate
}) {
  return (
    <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* Create new document button */}
      <CreateDocumentButton onClick={onCreateDocument} />
      
      {/* Document cards */}
      {documents.map(doc => (
        <DocumentCard
          key={doc.id}
          doc={doc}
          isSelected={selectedDocuments.some(d => d.id === doc.id)}
          isSelectionMode={isSelectionMode}
          onDocumentClick={onDocumentClick}
          onToggleSelection={onToggleSelection}
          onRename={onRenameDocument}
          onDelete={onDeleteDocument}
          onVersionUpdate={onVersionUpdate}
        />
      ))}
    </div>
  )
}