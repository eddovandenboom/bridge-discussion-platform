import { useState, useEffect } from 'react'
import axios from '../utils/api'
import TournamentCard from '../components/TournamentCard'
import { useAuth } from '../contexts/AuthContext'

interface Tournament {
  id: string;
  name: string;
  date: string;
  venue: string | null;
  filename: string;
  createdAt: string;
  uploader: {
    id: string;
    username: string;
  };
  circles: Array<{
    circle: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    comments: number;
  };
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchTournaments()
  }, [])

  const fetchTournaments = async () => {
    try {
      const response = await axios.get('/api/tournaments')
      setTournaments(response.data)
    } catch (err: any) {
      setError('Failed to load tournaments')
      console.error('Error fetching tournaments:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading tournaments...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Bridge Tournaments</h1>
        <p className="mt-2 text-gray-600">
          Browse and discuss bridge hands from various tournaments
        </p>
      </div>

      {tournaments.length === 0 ? (
        <div className="border-4 border-dashed border-gray-200 rounded-lg h-64 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No tournaments yet
            </h2>
            <p className="text-gray-500">
              {user ? 'Upload your first tournament to get started!' : 'Sign in to upload tournaments and join discussions'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      )}
    </div>
  )
}