import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCircle } from '../contexts/CircleContext';
import TournamentUploadForm from '../components/TournamentUploadForm';
import InvitationForm from '../components/InvitationForm';
import axios from '../utils/api';

interface Circle {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: string;
  creator: {
    id: string;
    username: string;
  };
  members: Array<{
    user: {
      id: string;
      username: string;
    };
    role: string;
    joinedAt: string;
  }>;
  tournaments: Array<{
    tournament: {
      id: string;
      name: string;
      date: string;
      venue: string | null;
      uploader: {
        id: string;
        username: string;
      };
    };
    sharedAt: string;
  }>;
}

const CircleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { setCurrentCircle } = useCircle();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    isPublic: true
  });
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [userCircles, setUserCircles] = useState<Array<{id: string, name: string}>>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchCircle();
    }
  }, [id]);

  useEffect(() => {
    if (user) {
      fetchUserCircles();
      if (id && (isUserCreator() || isUserAdmin())) {
        fetchInvitations();
      }
    }
  }, [user, circle]);

  const fetchCircle = async () => {
    try {
      const response = await axios.get(`/api/circles/${id}`);
      setCircle(response.data);
      setEditForm({
        name: response.data.name,
        description: response.data.description || '',
        isPublic: response.data.isPublic
      });
      
      // Set current circle context
      setCurrentCircle({
        id: response.data.id,
        name: response.data.name
      });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch circle');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCircles = async () => {
    try {
      const response = await axios.get('/api/circles');
      setUserCircles(response.data.map((circle: any) => ({
        id: circle.id,
        name: circle.name
      })));
    } catch (error: any) {
      console.error('Failed to fetch user circles:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await axios.get(`/api/circles/${id}/invitations`);
      setInvitations(response.data);
    } catch (error: any) {
      console.error('Failed to fetch invitations:', error);
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadForm(false);
    fetchCircle(); // Refresh circle data to show new tournament
  };

  const handleInviteSuccess = () => {
    setShowInviteForm(false);
    fetchInvitations(); // Refresh invitations list
  };

  const handleJoinCircle = async () => {
    try {
      await axios.post(`/api/circles/${id}/join`);
      fetchCircle();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to join circle');
    }
  };

  const handleLeaveCircle = async () => {
    try {
      await axios.post(`/api/circles/${id}/leave`);
      fetchCircle();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to leave circle');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await axios.delete(`/api/circles/${id}/members/${userId}`);
      fetchCircle();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to remove member');
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: string) => {
    try {
      await axios.put(`/api/circles/${id}/members/${userId}/role`, { role: newRole });
      fetchCircle();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update member role');
    }
  };

  const handleUpdateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.put(`/api/circles/${id}`, editForm);
      setShowEditForm(false);
      fetchCircle();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update circle');
    }
  };

  const handleDeleteCircle = async () => {
    if (!confirm('Are you sure you want to delete this circle? This action cannot be undone.')) return;

    try {
      await axios.delete(`/api/circles/${id}`);
      window.location.href = '/circles';
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete circle');
    }
  };

  const isUserMember = () => {
    return user && circle?.members.some(member => member.user.id === user.id);
  };

  const isUserCreator = () => {
    return user && circle?.creator.id === user.id;
  };

  const isUserAdmin = () => {
    return user && circle?.members.some(member => 
      member.user.id === user.id && member.role === 'ADMIN'
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading circle...</div>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || 'Circle not found'}
        </div>
        <a href="/circles" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
          ← Back to Circles
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{circle.name}</h1>
              <p className="text-gray-600">Created by {circle.creator.username}</p>
            </div>
            <div className="flex items-center gap-2">
              {circle.isPublic ? (
                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                  Public
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full">
                  Private
                </span>
              )}
            </div>
          </div>

          {circle.description && (
            <p className="text-gray-700 mt-4">{circle.description}</p>
          )}

          {user && (
            <div className="mt-4 flex gap-2">
              {isUserCreator() ? (
                <>
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Edit Circle
                  </button>
                  <button
                    onClick={handleDeleteCircle}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                  >
                    Delete Circle
                  </button>
                </>
              ) : isUserMember() ? (
                <button
                  onClick={handleLeaveCircle}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded hover:bg-red-200 transition-colors"
                >
                  Leave Circle
                </button>
              ) : circle.isPublic ? (
                <button
                  onClick={handleJoinCircle}
                  className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition-colors"
                >
                  Join Circle
                </button>
              ) : (
                <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded">
                  This is a private circle. You need an invitation to join.
                </div>
              )}
              
              {/* Upload Tournament button for admins only */}
              {(isUserCreator() || isUserAdmin()) && (
                <button
                  onClick={() => setShowUploadForm(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  Upload Tournament
                </button>
              )}
              
              {/* Invite button for private circles (creator/admin only) */}
              {!circle.isPublic && (isUserCreator() || isUserAdmin()) && (
                <button
                  onClick={() => setShowInviteForm(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                >
                  Invite User
                </button>
              )}
            </div>
          )}
        </div>

        {showEditForm && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Edit Circle</h3>
            <form onSubmit={handleUpdateCircle}>
              <div className="mb-4">
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Circle Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editForm.isPublic}
                    onChange={(e) => setEditForm({ ...editForm, isPublic: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Public circle</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Pending Invitations Section (creator/admin only) */}
        {!circle.isPublic && (isUserCreator() || isUserAdmin()) && invitations.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Pending Invitations ({invitations.length})</h3>
            <div className="space-y-2">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between py-2 px-3 bg-yellow-50 rounded">
                  <div>
                    <span className="font-medium">{invitation.invitedEmail}</span>
                    <div className="text-sm text-gray-600">
                      Invited by {invitation.inviter.username} • Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Pending</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Members ({circle.members.length})</h3>
          <div className="space-y-2">
            {circle.members.map((member) => (
              <div key={member.user.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{member.user.username}</span>
                  {member.user.id === circle.creator.id && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Creator</span>
                  )}
                  {member.role === 'ADMIN' && member.user.id !== circle.creator.id && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Admin</span>
                  )}
                  {member.role === 'MEMBER' && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Member</span>
                  )}
                  <div className="text-sm text-gray-600">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </div>
                </div>
                {isUserCreator() && member.user.id !== circle.creator.id && (
                  <div className="flex space-x-2">
                    {member.role === 'MEMBER' ? (
                      <button
                        onClick={() => handleUpdateMemberRole(member.user.id, 'ADMIN')}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Promote to Admin
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateMemberRole(member.user.id, 'MEMBER')}
                        className="text-orange-600 hover:text-orange-800 text-sm"
                      >
                        Demote to Member
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveMember(member.user.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {circle.tournaments.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Shared Tournaments ({circle.tournaments.length})</h3>
            <div className="space-y-3">
              {circle.tournaments.map((tournamentCircle) => (
                <div key={tournamentCircle.tournament.id} className="border border-gray-200 rounded p-4">
                  <h4 className="font-medium text-lg">{tournamentCircle.tournament.name}</h4>
                  <div className="text-sm text-gray-600 mt-1">
                    <div>Date: {new Date(tournamentCircle.tournament.date).toLocaleDateString()}</div>
                    {tournamentCircle.tournament.venue && (
                      <div>Venue: {tournamentCircle.tournament.venue}</div>
                    )}
                    <div>Uploaded by: {tournamentCircle.tournament.uploader.username}</div>
                    <div>Shared: {new Date(tournamentCircle.sharedAt).toLocaleDateString()}</div>
                  </div>
                  <a
                    href={`/circles/${id}/tournaments/${tournamentCircle.tournament.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
                  >
                    View Tournament →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <a href="/circles" className="text-blue-600 hover:text-blue-800">
          ← Back to Circles
        </a>
      </div>

      {/* Tournament Upload Form Modal */}
      {showUploadForm && (
        <TournamentUploadForm
          circles={userCircles}
          onSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      {/* Invitation Form Modal */}
      {showInviteForm && (
        <InvitationForm
          circleId={circle.id}
          onSuccess={handleInviteSuccess}
          onCancel={() => setShowInviteForm(false)}
        />
      )}
    </div>
  );
};

export default CircleDetailPage;