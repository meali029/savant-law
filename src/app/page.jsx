// app/projects/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Header from '../components/Header/Header';
import {
  Plus,
  MoreHorizontal,
  Lock,
  Users,
  Loader,
  Trash2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getToken } from '../services/authApi';
import { useLanguage } from '../context/LanguageContext';

function ProjectCard({
                       title,
                       isShared = false,
                       icon,
                       projectId,
                       onClick,
                       onDelete,
                       date,
                       shared_by
                     }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const { t } = useLanguage();

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return t.projectsPage.projectCard.unknownDate;
    }
  };

  useEffect(() => {
    if (!showDropdown) return;
    const handleOutside = () => setShowDropdown(false);
    document.addEventListener('click', handleOutside);
    return () => document.removeEventListener('click', handleOutside);
  }, [showDropdown]);

  return (
      <div
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md dark:hover:shadow-lg transition-all duration-200 relative group cursor-pointer"
          onClick={() => onClick(projectId)}
      >
        <div className="absolute top-4 right-4">
          <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              onClick={(e) => { e.stopPropagation(); setShowDropdown(v => !v); }}
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
          {showDropdown && (
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-10">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(projectId, title); }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t.common.delete}</span>
                </button>
              </div>
          )}
        </div>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className={
            `w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold text-lg ${
                icon === 'W' ? 'bg-blue-500 dark:bg-blue-600' : 'bg-indigo-500 dark:bg-indigo-600'
            }`
          }>
            {icon}
          </div>
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">{title}</h3>
            {date && <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(date)}</p>}
            <div className="flex items-center justify-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              {isShared
                  ? <>
                    <Users className="w-3 h-3" />
                    <span>Shared by {shared_by}</span>
                  </>
                  : <>
                    <Lock className="w-3 h-3" />
                    <span>{t.projectsPage.projectCard.privateStatus}</span>
                  </>
              }
            </div>
          </div>
        </div>
      </div>
  );
}

function CreateProjectCard({ onClick, isCreating }) {
  const { t } = useLanguage();
  return (
      <div
          className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600 p-6 hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200 cursor-pointer"
          onClick={onClick}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900 flex items-center justify-center">
            {isCreating
                ? <Loader className="w-6 h-6 text-blue-500 dark:text-blue-400 animate-spin" />
                : <Plus className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            }
          </div>
          <h3 className="font-medium text-blue-600 dark:text-blue-400">
            {isCreating
                ? t.projectsPage.createCard.creating
                : t.projectsPage.createCard.title
            }
          </h3>
        </div>
      </div>
  );
}

function CreateProjectModal({ isOpen, onClose, onSubmit, isCreating }) {
  const [projectName, setProjectName] = useState('');
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
          <div className="bg-blue-600 dark:bg-blue-700 p-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">{t.projectsPage.createModal.title}</h2>
            <button onClick={onClose} disabled={isCreating} className="text-white hover:text-gray-200">
              <Plus className="rotate-45" size={24} />
            </button>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(projectName.trim()); }} className="p-6 space-y-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.projectsPage.createModal.label}
            </label>
            <input
                type="text"
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-gray-100"
                placeholder={t.projectsPage.createModal.placeholder}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                disabled={isCreating}
                required
            />
            <div className="flex space-x-3">
              <button
                  type="button"
                  onClick={onClose}
                  disabled={isCreating}
                  className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t.common.cancel}
              </button>
              <button
                  type="submit"
                  disabled={isCreating || !projectName.trim()}
                  className="flex-1 py-3 px-4 bg-blue-600 dark:bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 flex justify-center items-center disabled:opacity-50"
              >
                {isCreating
                    ? <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      {t.common.creating}
                    </>
                    : t.projectsPage.createModal.submitButton
                }
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, projectName, isDeleting }) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-w-md w-full">
          <div className="bg-red-600 dark:bg-red-700 p-4 flex items-center space-x-2">
            <Trash2 className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">{t.projectsPage.deleteModal.title}</h2>
          </div>
          <div className="p-6 space-y-6">
            <p className="text-gray-700 dark:text-gray-300">
              {t.projectsPage.deleteModal.confirmationText.replace('{{projectName}}', projectName)}
            </p>
            <div className="flex space-x-3">
              <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t.common.cancel}
              </button>
              <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 bg-red-600 dark:bg-red-500 text-white rounded-lg shadow-md hover:bg-red-700 dark:hover:bg-red-600 flex justify-center items-center disabled:opacity-50"
              >
                {isDeleting
                    ? <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      {t.common.deleting}
                    </>
                    : t.projectsPage.deleteModal.confirmButton
                }
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}

export default function Page() {
  const { t } = useLanguage();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, projectId: null, projectName: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) router.push('/sign-in');
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        const res = await fetch('https://api.getmediarank.com/api/v1/projects/list', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        // Handle new API response structure - show owned projects and shared projects
        const ownedProjects = data.owned_projects || [];
        const sharedProjects = data.shared_projects || [];
        
        // Add metadata for owned projects
        const ownedProjectsWithMetadata = ownedProjects.map(p => ({
          ...p,
          isShared: false,
          icon: p.project_name.charAt(0).toUpperCase()
        }));
        
        // Add metadata for shared projects
        const sharedProjectsWithMetadata = sharedProjects.map(project => ({
          ...project,
          isShared: true,
          icon: project.project_name.charAt(0).toUpperCase(),
          shared_by: project.user_id,
          shared_at: project.date
        }));
        
        // Combine both arrays
        const allItems = [...ownedProjectsWithMetadata, ...sharedProjectsWithMetadata];
        setProjects(allItems);
      } catch {
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const createProject = async (name) => {
    setIsCreating(true);
    try {
      const token = getToken();
      const res = await fetch('https://api.getmediarank.com/api/v1/projects/add', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ project_name: name })
      });
      if (!res.ok) throw new Error();
      const newProj = await res.json();
      setProjects(prev => [{ ...newProj, isShared: false, icon: name.charAt(0).toUpperCase() }, ...prev]);
      setShowCreateModal(false);
    } catch {
      alert(t.projectsPage.alerts.createFailed);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteProject = async (id) => {
    setIsDeleting(true);
    try {
      const token = getToken();
      const res = await fetch(`https://api.getmediarank.com/api/v1/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      setProjects(prev => prev.filter(p => p.id !== id));
      setDeleteModal({ isOpen: false, projectId: null, projectName: '' });
    } catch {
      alert(t.projectsPage.alerts.deleteFailed);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
          <Header />
          <main className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {t.projectsPage.header.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t.projectsPage.header.description}
            </p>
            <div className="flex justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          </main>
        </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {t.projectsPage.header.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {t.projectsPage.header.description}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <CreateProjectCard onClick={() => setShowCreateModal(true)} isCreating={isCreating} />
            {projects.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Plus className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 dark:text-gray-300 mb-2">
                    {t.projectsPage.emptyState.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {t.projectsPage.emptyState.description}
                  </p>
                </div>
            ) : projects.map(p => (
                <ProjectCard
                    key={p.id}
                    title={p.project_name}
                    projectId={p.id}
                    icon={p.icon}
                    onClick={(id) => {
                      // Check if it's a shared project by looking for isShared property
                      const project = projects.find(p => p.id === id);
                      if (project && project.isShared) {
                        // For shared projects, navigate to projects view
                        router.push(`/projects/${id}`);
                      } else {
                        // For regular projects, navigate to project view
                        router.push(`/${id}`);
                      }
                    }}
                    onDelete={(id, name) => {
                      // Check if it's a shared project by looking for isShared property
                      const project = projects.find(p => p.id === id);
                      if (project && project.isShared) {
                        alert('You cannot delete shared projects. Please contact the owner.');
                        return;
                      }
                      setDeleteModal({ isOpen: true, projectId: id, projectName: name });
                    }}
                    isShared={p.isShared}
                    date={p.date}
                    shared_by={p.shared_by}
                />
            ))}
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
            onClose={() => !isDeleting && setDeleteModal({ isOpen: false, projectId: null, projectName: '' })}
            onConfirm={() => deleteModal.projectId && deleteProject(deleteModal.projectId)}
            projectName={deleteModal.projectName}
            isDeleting={isDeleting}
        />
      </div>
  );
}
