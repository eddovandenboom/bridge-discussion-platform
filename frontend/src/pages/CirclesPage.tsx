import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCircle } from '../contexts/CircleContext';
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
  _count: {
    members: number;
  };
  members?: Array<{
    joinedAt: string;
  }>;
}

const CirclesPage: React.FC = () => {
  const { user } = useAuth();
  const { setCurrentCircle } = useCircle();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCircle, setNewCircle] = useState({
    name: '',
    description: '',
    isPublic: true
  });

  useEffect(() => {
    // Clear current circle context when viewing all circles
    setCurrentCircle(null);
    fetchCircles();
  }, [setCurrentCircle]);

  const fetchCircles = async () => {
    try {
      const response = await axios.get('/api/circles');
      setCircles(response.data);
    } catch (error) {
      console.error('Error fetching circles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCircle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircle.name.trim()) return;

    try {
      await axios.post('/api/circles', newCircle);
      setNewCircle({ name: '', description: '', isPublic: true });
      setShowCreateForm(false);
      fetchCircles();
    } catch (error) {
      console.error('Error creating circle:', error);
    }
  };

  const handleJoinCircle = async (circleId: string) => {
    try {
      await axios.post(`/api/circles/${circleId}/join`);
      fetchCircles();
    } catch (error) {
      console.error('Error joining circle:', error);
    }
  };

  const handleLeaveCircle = async (circleId: string) => {
    try {
      await axios.post(`/api/circles/${circleId}/leave`);
      fetchCircles();
    } catch (error) {
      console.error('Error leaving circle:', error);
    }
  };

  const isUserMember = (circle: Circle) => {
    return circle.members && circle.members.length > 0;
  };

  const isUserCreator = (circle: Circle) => {
    return user && circle.creator.id === user.id;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading circles...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bridge Circles</h1>
        {user && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Circle
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Create New Circle</h2>
          <form onSubmit={handleCreateCircle}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Circle Name
              </label>
              <input
                type="text"
                id="name"
                value={newCircle.name}
                onChange={(e) => setNewCircle({ ...newCircle, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (optional)
              </label>
              <textarea
                id="description"
                value={newCircle.description}
                onChange={(e) => setNewCircle({ ...newCircle, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newCircle.isPublic}
                  onChange={(e) => setNewCircle({ ...newCircle, isPublic: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Public circle (anyone can join)</span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Circle
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {circles.map((circle) => (
          <div key={circle.id} className="bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{circle.name}</h3>
                <p className="text-sm text-gray-600">by {circle.creator.username}</p>
              </div>
              <div className="flex items-center gap-2">
                {circle.isPublic ? (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Public
                  </span>
                ) : (
                  <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                    Private
                  </span>
                )}
              </div>
            </div>

            {circle.description && (
              <p className="text-gray-700 mb-4">{circle.description}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {circle._count.members} member{circle._count.members !== 1 ? 's' : ''}
              </span>

              {user && (
                <div>
                  {isUserCreator(circle) ? (
                    <span className="text-xs text-blue-600 font-medium">Creator</span>
                  ) : isUserMember(circle) ? (
                    <button
                      onClick={() => handleLeaveCircle(circle.id)}
                      className="bg-red-100 text-red-700 px-3 py-1 text-sm rounded hover:bg-red-200 transition-colors"
                    >
                      Leave
                    </button>
                  ) : circle.isPublic ? (
                    <button
                      onClick={() => handleJoinCircle(circle.id)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 text-sm rounded hover:bg-blue-200 transition-colors"
                    >
                      Join
                    </button>
                  ) : (
                    <span className="text-xs text-gray-500">Private</span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4">
              <a
                href={`/circles/${circle.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View Circle →
              </a>
            </div>
          </div>
        ))}
      </div>

      {circles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No circles found.</p>
          {user && (
            <p className="text-gray-500 mt-2">Create the first circle to get started!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CirclesPage;