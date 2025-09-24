'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, FileText, Star, Loader2 } from 'lucide-react';
import Header from '../../../components/Header/Header';
import { templateApi } from '../../../services/templateApi';
import TemplateDocumentModal from '../../../components/DocumentEditing/TemplateDocumentModal';

export default function CategoryPage({ params }) {
  const { category } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Helper function to get category descriptions
  function getCategoryDescription(categoryName) {
    const descriptions = {
      'For Startups': 'Essential legal documents for startup companies',
      'Agreements': 'Legal agreements and contracts for various purposes',
      'Contracts': 'Standard contract templates for business use',
      'Compliance': 'Compliance and regulatory document templates',
      'Employment': 'Employment and HR related documents',
      'Intellectual Property': 'IP protection and licensing documents',
      'Website': 'Legal documents for websites and online services'
    };
    return descriptions[categoryName] || `${categoryName} document templates`;
  }

  // Fetch templates for the category
  useEffect(() => {
    const fetchCategoryTemplates = async () => {
      try {
        setLoading(true);
        
        // Convert category ID to API format
        const categoryNameMap = {
          'for-startups': 'for-startups',
          'agreements': 'agreements',
          'contracts': 'contracts',
          'compliance': 'compliance',
          'employment': 'employment',
          'intellectual-property': 'intellectual-property',
          'website': 'website'
        };
        
        const categorySlug = categoryNameMap[category] || category;
        
        // Use the new API endpoint to fetch templates by category
        const response = await fetch(`https://api.getmediarank.com/api/v1/template-management/categories/${categorySlug}/templates`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const categoryTemplates = await response.json();
        
        setTemplates(categoryTemplates);
        setCategoryInfo({
          title: categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: getCategoryDescription(categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()))
        });

        // Check if there's a template_id in the URL and open the modal
        const urlParams = new URLSearchParams(window.location.search);
        const templateIdFromUrl = urlParams.get('template_id');
        if (templateIdFromUrl) {
          const templateFromUrl = categoryTemplates.find(t => t.id === templateIdFromUrl);
          if (templateFromUrl) {
            setSelectedTemplate(templateFromUrl);
            setIsModalOpen(true);
          }
        }
      } catch (err) {
        setError('Failed to load category templates');
        console.error('Error loading category templates:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryTemplates();
  }, [category]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="text-gray-600">Loading templates...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Templates</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!categoryInfo || templates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Category not found</h1>
            <p className="text-gray-600 mb-4">No templates found for this category.</p>
            <Link href={`/templates${projectId ? `?project_id=${projectId}` : ''}`} className="text-indigo-600 hover:text-indigo-500">
              Back to Templates
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Simple':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      case 'Complex':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle document generation completion - navigate to documents page
  const handleDocumentGenerated = (contractId) => {
    console.log(`Generated document creation started for contract: ${contractId}`)
    
    // For GENERATED documents, navigate to documents page to show generation process
    router.push(`/documents?contract_id=${contractId}`)
  }

  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
    // Update URL with template_id parameter
    const url = new URL(window.location);
    url.searchParams.set('template_id', template.id);
    window.history.pushState({}, '', url);
  };

    return (
    <div className="min-h-screen bg-gray-50">
      <Header/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/templates${projectId ? `?project_id=${projectId}` : ''}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Templates
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{categoryInfo.title}</h1>
          <p className="text-gray-600 text-lg">{categoryInfo.description}</p>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <FileText className="h-6 w-6 text-gray-600" />
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(template.complexity)}`}>
                    {template.complexity}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{template.name}</h3>
              <p className="text-gray-600 text-xs line-clamp-3">{template.description}</p>
              {template.tags && template.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.tags.slice(0, 2).map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Template Document Modal */}
      <TemplateDocumentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          // Clear template_id from URL when modal closes
          const url = new URL(window.location);
          url.searchParams.delete('template_id');
          window.history.pushState({}, '', url);
        }}
        templateData={selectedTemplate}
        onDocumentGenerated={handleDocumentGenerated}
        projectId={projectId}
      />
    </div>
  );
}
