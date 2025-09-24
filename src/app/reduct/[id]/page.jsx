"use client"
import React from 'react'
import Header from '../../../components/Header/Header'
import { useParams, useRouter } from 'next/navigation'
import DocumentViewer from '../../../components/Reduction/DocumentViewer' // Adjust the import path as needed

function DocumentPage() {
  // Keep the useParams and useRouter hooks for potential future use
  const params = useParams()
  const router = useRouter()
  const docId = params?.id

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1">
        <DocumentViewer docId={docId} />
      </div>
    </div>
  )
}

export default DocumentPage