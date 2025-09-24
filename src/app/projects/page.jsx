'use client'

import Header from '../../components/Header/Header'
import React, { useState, useEffect } from 'react'
import { Plus, MoreHorizontal, Lock, Users, Loader, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getToken } from '../../services/authApi'

function ProjectCard({ title, type, isShared = false, icon, projectId, onClick, onDelete, date, shared_by, shared_at }) {
  const [showDropdown, setShowDropdown] = useState(false)

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      })
    } catch {
      return 'Unknown date'
    }
  }

  const handleMoreClick = (e) => {
    e.stopPropagation()
    setShowDropdown(!showDropdown)
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    setShowDropdown(false)
    onDelete(projectId, title)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false)
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md dark:hover:shadow-lg transition-all duration-200 relative group cursor-pointer"
      onClick={() => onClick(projectId)}
    >
      {type !== 'shared_project' && (
        <div className="absolute top-4 right-4">
          <div className="relative">
            <button 
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={handleMoreClick}
            >
              <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleDeleteClick}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
                        )}
          </div>
        </div>
      )}
      
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-lg ${
          icon === 'W' ? 'bg-blue-500 dark:bg-blue-600' : 'bg-indigo-500 dark:bg-indigo-600'
        }`}>
          {icon}
        </div>
        
        <div className="space-y-2">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          {date && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(date)}</p>
          )}
          <div className="flex items-center justify-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
            {isShared ? (
              <>
                <Users className="w-3 h-3" />
                <span>Shared by {shared_by}</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3" />
                <span>Private</span>
              </>
            )}
          </div>
          {isShared && shared_at && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(shared_at)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function CreateProjectCard({ onClick, isCreating }) {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600 p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center">
          {isCreating ? (
            <Loader className="w-6 h-6 text-blue-500 dark:text-blue-400 animate-spin" />
          ) : (
            <Plus className="w-6 h-6 text-blue-500 dark:text-blue-400" />
          )}
        </div>
        <h3 className="font-medium text-blue-600 dark:text-blue-400">
          {isCreating ? 'Creating...' : 'Create new Project'}
        </h3>
      </div>
    </div>
  )
}

function CreateProjectModal({ isOpen, onClose, onSubmit, isCreating }) {
  const [projectName, setProjectName] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (projectName.trim()) {
      onSubmit(projectName.trim())
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
        <div className="bg-blue-600 dark:bg-blue-700 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Create New Project</h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
              disabled={isCreating}
            >
              <Plus className="rotate-45" size={24} />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Project Name
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 outline-none transition-all"
              placeholder="Enter project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              disabled={isCreating}
              required
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 px-4 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all flex items-center justify-center disabled:opacity-50"
              disabled={isCreating || !projectName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, projectName, isDeleting }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
        <div className="bg-red-600 dark:bg-red-700 p-4">
          <div className="flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Delete Project</h2>
          </div>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Are you sure you want to delete <span className="font-semibold">"{projectName}"</span>? 
            This action cannot be undone.
          </p>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-red-600 dark:bg-red-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:bg-red-700 dark:hover:bg-red-600 transition-all flex items-center justify-center disabled:opacity-50"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  const router = useRouter()
  const [projects, setProjects] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, projectId: null, projectName: '' })
  const [isDeleting, setIsDeleting] = useState(false)

  // AUTH GUARD: Redirect to /sign-in if not authenticated
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/sign-in')
    }
  }, [router])

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      const token = getToken()
      const response = await fetch('https://api.getmediarank.com/api/v1/projects/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const projectsData = await response.json()
      
      // Handle new API response structure - show owned projects and shared projects
      const ownedProjects = projectsData.owned_projects || [];
      const sharedProjects = projectsData.shared_projects || [];
      
      // Add metadata for owned projects
      const ownedProjectsWithMetadata = ownedProjects.map(project => ({
        ...project,
        type: 'project',
        isShared: false,
        icon: project.project_name.charAt(0).toUpperCase()
      }))
      
      // Add metadata for shared projects
      const sharedProjectsWithMetadata = sharedProjects.map(project => ({
        ...project,
        type: 'shared_project',
        isShared: true,
        icon: project.project_name.charAt(0).toUpperCase(),
        shared_by: project.user_id,
        shared_at: project.date
      }))
      
      // Combine both arrays
      const allItems = [...ownedProjectsWithMetadata, ...sharedProjectsWithMetadata]
      
      setProjects(allItems)
    } catch (error) {
      console.error('Error fetching projects:', error)
      // Fallback to empty array on error
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const createProject = async (projectName) => {
    setIsCreating(true)
    
    try {
      const token = getToken()
      const response = await fetch('https://api.getmediarank.com/api/v1/projects/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_name: projectName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      const newProject = await response.json()
      
      // Add the new project to the list
      const projectWithMetadata = {
        ...newProject,
        type: 'project',
        isShared: false,
        icon: projectName.charAt(0).toUpperCase()
      }
      
      setProjects(prev => [projectWithMetadata, ...prev])
      setShowCreateModal(false)
      
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const deleteProject = async (projectId) => {
    setIsDeleting(true)
    
    try {
      const token = getToken()
      const response = await fetch(`https://api.getmediarank.com/api/v1/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete project')
      }

      // Remove project from the list
      setProjects(prev => prev.filter(project => project.id !== projectId))
      setDeleteModal({ isOpen: false, projectId: null, projectName: '' })
      
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleProjectClick = (projectId, type) => {
    if (type === 'shared_project') {
      // For shared projects, navigate to the project view
      router.push(`/projects/${projectId}`)
    } else {
      // For regular projects, navigate to the project view
      router.push(`/projects/${projectId}`)
    }
  }

  const handleCreateClick = () => {
    setShowCreateModal(true)
  }

  const handleDeleteClick = (projectId, projectName, type) => {
    // Don't allow deletion of shared projects
    if (type === 'shared_project') {
      alert('You cannot delete shared projects. Please contact the owner.')
      return
    }
    
    setDeleteModal({
      isOpen: true,
      projectId,
      projectName
    })
  }

  const handleDeleteConfirm = () => {
    if (deleteModal.projectId) {
      deleteProject(deleteModal.projectId)
    }
  }

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setDeleteModal({ isOpen: false, projectId: null, projectName: '' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Projects</h1>
            <p className="text-gray-600 dark:text-gray-300">Browse your projects or start creating a new one instantly</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Projects</h1>
          <p className="text-gray-600 dark:text-gray-300">Browse your projects or start creating a new one instantly</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <CreateProjectCard onClick={handleCreateClick} isCreating={isCreating} />
          {projects.length === 0 && !isLoading ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-4">
                <Plus className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">No Projects Yet</h3>
              <p className="text-gray-500 dark:text-gray-400">Create your first project to get started.</p>
            </div>
          ) : (
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                title={project.project_name}
                type={project.type}
                isShared={project.isShared}
                icon={project.icon}
                projectId={project.id}
                onClick={(projectId) => handleProjectClick(projectId, project.type)}
                onDelete={(projectId, title) => handleDeleteClick(projectId, title, project.type)}
                date={project.date}
                shared_by={project.shared_by}
                shared_at={project.shared_at}
              />
            ))
          )}
        </div>
      </main>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => !isCreating && setShowCreateModal(false)}
        onSubmit={createProject}
        isCreating={isCreating}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        projectName={deleteModal.projectName}
        isDeleting={isDeleting}
      />
    </div>
  )
}