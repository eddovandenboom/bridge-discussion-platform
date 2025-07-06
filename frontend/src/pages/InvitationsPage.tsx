import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from '../utils/api';

interface Invitation {
  id: string;
  invitedEmail: string;
  expiresAt: string;
  createdAt: string;
  circle: {
    id: string;
    name: string;
    description: string | null;
  };
  inviter: {
    id: string;
    username: string;
  };
}

const InvitationsPage: React.FC = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchInvitations();
    }
  }, [user]);

  const fetchInvitations = async () => {
    try {
      const response = await axios.get('/api/circles/invitations/pending');
      setInvitations(response.data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      await axios.post(`/api/circles/invitations/${invitationId}/accept`);
      // Remove accepted invitation from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to accept invitation');
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <p>Please log in to view your invitations.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading invitations...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Circle Invitations</h1>
          <p className="text-gray-600">Invitations to join private circles</p>
        </div>

        {error && (
          <div className="px-6 py-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

        <div className="px-6 py-4">
          {invitations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending invitations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invitation.circle.name}
                      </h3>
                      {invitation.circle.description && (
                        <p className="text-gray-600 mt-1">{invitation.circle.description}</p>
                      )}
                      <div className="text-sm text-gray-500 mt-2">
                        <div>Invited by {invitation.inviter.username}</div>
                        <div>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</div>
                        <div>Received: {new Date(invitation.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          // For now, just remove from list (could implement decline API)
                          setInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
                        }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <a href="/circles" className="text-blue-600 hover:text-blue-800">
          ← Back to Circles
        </a>
      </div>
    </div>
  );
};

export default InvitationsPage;