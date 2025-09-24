import React from 'react'
import { useState, useEffect, useRef } from 'react';
import { X, Link2, ChevronDown, Loader2, Check } from 'lucide-react';
import { getToken } from '../../services/authApi';

export const InviteModal = ({ isOpen, onClose, currentContractId }) => {
    const [email, setEmail] = useState('');
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInviting, setIsInviting] = useState(false);
    const [error, setError] = useState('');
    const [showMembers, setShowMembers] = useState(true);
    const [isCreatingLink, setIsCreatingLink] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);
    const modalRef = useRef(null);
    
    // Fetch users with access when modal opens
    useEffect(() => {
      if (isOpen && currentContractId) {
        fetchUsersWithAccess();
      }
    }, [isOpen, currentContractId]);
  
    // Close modal when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
          onClose();
        }
      };
  
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }
  
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen, onClose]);
    
    const fetchUsersWithAccess = async () => {
      setIsLoading(true);
      setError('');
      
      try {
        const token = getToken();
        const response = await fetch(
          `https://api.getmediarank.com/api/v1/contracts/${currentContractId}/access`,
          {
            headers: {
              'accept': 'application/json',
              'authorization': `Bearer ${token}`,
              'origin': 'https://www.svntlaw.com',
              'referer': 'https://www.svntlaw.com/'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setMembers(data.users_with_access || []);
      } catch (err) {
        setError('Failed to load members');
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    const handleInvite = async () => {
      if (!email.trim()) return;
      
      setIsInviting(true);
      setError('');
      
      try {
        const token = getToken();
        const response = await fetch(
          'https://api.getmediarank.com/api/v1/contracts/share',
          {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'content-type': 'application/json',
              'authorization': `Bearer ${token}`,
              'origin': 'https://www.svntlaw.com',
              'referer': 'https://www.svntlaw.com/'
            },
            body: JSON.stringify({
              contract_id: currentContractId,
              user_email: email,
              permissions: ['read', 'edit']
            })
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to share document');
        }
        
        const result = await response.json();
        
        // Clear email and refresh the members list
        setEmail('');
        await fetchUsersWithAccess();
        
      } catch (err) {
        setError('Failed to invite user');
        console.error('Error inviting user:', err);
      } finally {
        setIsInviting(false);
      }
    };

    const handleCreateInviteLink = async () => {
      setIsCreatingLink(true);
      setLinkCopied(false);
      
      try {
        // Create the invite link URL
        const baseUrl = window.location.origin;
        const inviteLink = `${baseUrl}/documents?contract_id=${currentContractId}&ready=true`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(inviteLink);
        
        setLinkCopied(true);
        
        // Reset the copied state after 3 seconds
        setTimeout(() => {
          setLinkCopied(false);
        }, 3000);
        
      } catch (err) {
        setError('Failed to copy invite link');
        console.error('Error copying invite link:', err);
      } finally {
        setIsCreatingLink(false);
      }
    };
    
    // Get owner info
    const owner = members.find(m => m.access_type === 'owner');
    const sharedMembers = members.filter(m => m.access_type === 'shared');
    const totalMembers = members.length;
  
    if (!isOpen) return null;
  
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Invite</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
  
          {/* Modal Content */}
          <div className="px-6 py-4 text-sm">
            <p className="text-gray-600 mb-6">
              Collaborators will use credits from the project owner's workspace. 
              If you need more than 20 collaborators, <a href="#" className="text-blue-600 underline">contact us</a>.
            </p>
            
            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
  
            {/* Email Invite Section */}
            <div className="flex gap-3 mb-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Invite by email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isInviting}
              />
              <button 
                onClick={handleInvite}
                disabled={isInviting || !email.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Inviting...
                  </>
                ) : (
                  'Invite'
                )}
              </button>
            </div>
  
            {/* Members Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  {owner?.user_name || 'Document'}
                </h3>
                <button 
                  onClick={() => setShowMembers(!showMembers)}
                  className="flex items-center gap-1 text-gray-700 hover:text-gray-900"
                >
                  <span>{totalMembers} member{totalMembers !== 1 ? 's' : ''}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMembers ? 'rotate-180' : ''}`} />
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : showMembers && (
                <div className="space-y-2">
                  {/* Owner */}
                  {owner && (
                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {owner.user_name?.charAt(0).toUpperCase() || owner.user_email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {owner.user_name || owner.user_email} (you)
                          </div>
                          <div className="text-sm text-gray-500">{owner.user_email}</div>
                        </div>
                      </div>
                      <span className="text-gray-500">Owner</span>
                    </div>
                  )}
                  
                  {/* Shared Members */}
                  {sharedMembers.map((member, index) => (
                    <div key={`${member.user_email}-${index}`} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.user_name?.charAt(0).toUpperCase() || member.user_email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.user_name || member.user_email}
                          </div>
                          <div className="text-sm text-gray-500">{member.user_email}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-gray-500">
                          {member.permissions.includes('edit') ? 'Can edit' : 'Can view'}
                        </div>
                        {member.shared_at && (
                          <div className="text-xs text-gray-400">
                            Invited {new Date(member.shared_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
  
            {/* Create Invite Link Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Link2 className="w-5 h-5 text-gray-400" />
                  <div>
                    <h4 className="font-medium text-gray-900">Create invite link</h4>
                    <p className="text-sm text-gray-500">Anyone with this link can edit</p>
                  </div>
                </div>
                <button 
                  onClick={handleCreateInviteLink}
                  disabled={isCreatingLink}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreatingLink ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : linkCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>
  
            {/* Upgrade Section */}
            <div className="border-t border-gray-200 mt-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Upgrade to Enterprise</h4>
                  <p className="text-sm text-gray-500">For more than 20 collaborators</p>
                </div>
                <button className="text-gray-700 font-medium hover:underline">
                  Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };