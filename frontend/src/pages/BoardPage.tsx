import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from '../utils/api'
import BridgeHandViewer from '../components/BridgeHandViewer'
import Comment, { CommentData } from '../components/Comment'
import { useCircle } from '../contexts/CircleContext'
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
  comments: CommentData[];
}


export default function BoardPage() {
  const { circleId, tournamentId } = useParams<{ circleId: string; tournamentId: string }>()
  const { setCurrentCircle, setCurrentTournament } = useCircle()
  const { user } = useAuth()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedBoard, setSelectedBoard] = useState(1)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (circleId && tournamentId) {
      fetchTournament()
    }
    
    // Cleanup function to reset tournament context when leaving
    return () => {
      setCurrentTournament(null)
    }
  }, [circleId, tournamentId])

  const fetchTournament = async () => {
    try {
      const response = await axios.get(`/api/circles/${circleId}/tournaments/${tournamentId}`)
      setTournament(response.data)
      
      // Set current circle context
      if (response.data.circles && response.data.circles.length > 0) {
        const currentCircleData = response.data.circles.find((tc: any) => tc.circle.id === circleId)
        if (currentCircleData) {
          setCurrentCircle({
            id: currentCircleData.circle.id,
            name: currentCircleData.circle.name
          })
        }
      }
      
      // Set current tournament context
      setCurrentTournament({
        id: response.data.id,
        name: response.data.name
      })
    } catch (err: any) {
      setError('Failed to load tournament')
      console.error('Error fetching tournament:', err)
    } finally {
      setLoading(false)
    }
  }


  const getBoardComments = (boardNumber: number) => {
    const allComments = tournament?.comments.filter(comment => 
      comment.boardNumber === boardNumber && comment.circle.id === circleId
    ) || []
    
    // Organize comments into threads
    const topLevelComments = allComments.filter(comment => !comment.parentCommentId)
    const repliesMap = new Map<string, CommentData[]>()
    
    // Group replies by parent comment ID
    allComments.forEach(comment => {
      if (comment.parentCommentId) {
        if (!repliesMap.has(comment.parentCommentId)) {
          repliesMap.set(comment.parentCommentId, [])
        }
        repliesMap.get(comment.parentCommentId)!.push(comment)
      }
    })
    
    // Sort replies by creation date
    repliesMap.forEach(replies => {
      replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    })
    
    return { topLevelComments, repliesMap }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user || submittingComment) return

    setSubmittingComment(true)
    setError('') // Clear any previous errors
    try {
      const response = await axios.post(`/api/circles/${circleId}/tournaments/${tournamentId}/comments`, {
        content: newComment.trim(),
        boardNumber: selectedBoard
      })

      // Add the new comment to the tournament state
      setTournament(prev => {
        if (!prev) return prev
        return {
          ...prev,
          comments: [response.data, ...prev.comments]
        }
      })

      setNewComment('')
    } catch (err: any) {
      console.error('Error creating comment:', err)
      setError('Failed to create comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleEditComment = async (commentId: string, content: string) => {
    try {
      const response = await axios.put(`/api/circles/${circleId}/tournaments/${tournamentId}/comments/${commentId}`, {
        content: content.trim()
      })

      // Update the comment in the tournament state
      setTournament(prev => {
        if (!prev) return prev
        return {
          ...prev,
          comments: prev.comments.map(comment => 
            comment.id === commentId ? response.data : comment
          )
        }
      })

    } catch (err: any) {
      console.error('Error updating comment:', err)
      setError('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      await axios.delete(`/api/circles/${circleId}/tournaments/${tournamentId}/comments/${commentId}`)

      // Remove the comment from the tournament state
      setTournament(prev => {
        if (!prev) return prev
        return {
          ...prev,
          comments: prev.comments.filter(comment => comment.id !== commentId)
        }
      })
    } catch (err: any) {
      console.error('Error deleting comment:', err)
      setError('Failed to delete comment')
    }
  }


  const handleReplyComment = async (parentId: string, content: string) => {
    if (!user) return

    try {
      const response = await axios.post(`/api/circles/${circleId}/tournaments/${tournamentId}/comments`, {
        content: content.trim(),
        boardNumber: selectedBoard,
        parentCommentId: parentId
      })

      // Add the new reply to the tournament state
      setTournament(prev => {
        if (!prev) return prev
        return {
          ...prev,
          comments: [response.data, ...prev.comments]
        }
      })
    } catch (err: any) {
      console.error('Error creating reply:', err)
      setError('Failed to create reply')
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading tournament...</div>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error || 'Tournament not found'}</div>
        </div>
      </div>
    )
  }

  const { topLevelComments, repliesMap } = getBoardComments(selectedBoard)
  const totalComments = tournament?.comments.filter(comment => 
    comment.boardNumber === selectedBoard && comment.circle.id === circleId
  ).length || 0

  return (
    <div className="px-3 py-4 sm:px-6 lg:px-8">
      {/* Header + Content Container - Aligned left edge */}
      <div className="xl:flex xl:justify-center">
        <div className="xl:w-[1332px]">
          {/* Main Content - Simple: Stack on small screens, side-by-side on large screens */}
          <div className="space-y-6 xl:space-y-0 xl:flex xl:gap-8">
            {/* Bridge Hand Viewer */}
            <div className="xl:w-[900px] xl:flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Board {selectedBoard}</h2>
              <div className="bg-white rounded-lg shadow-md p-4 lg:p-6">
                <BridgeHandViewer
                  pbnFileUrl={`/uploads/tournaments/${tournament.filename}`}
                  onBoardChange={(boardNumber) => setSelectedBoard(boardNumber)}
                />
              </div>
            </div>

            {/* Comments Section */}
            <div className="xl:min-w-[400px] xl:flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Comments ({totalComments})
              </h2>

              {/* Comment Creation Form */}
              {user && (
                <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
                  <form onSubmit={handleSubmitComment}>
                    <div className="mb-3">
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                        Add a comment for Board {selectedBoard}
                      </label>
                      <textarea
                        id="comment"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Share your thoughts about this board..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={submittingComment}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={!newComment.trim() || submittingComment}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingComment ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {topLevelComments.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-gray-500">No comments yet for this board.</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {user ? 'Be the first to share your thoughts!' : 'Sign in to join the discussion!'}
                    </p>
                  </div>
                ) : (
                  topLevelComments.map((comment) => (
                    <Comment
                      key={comment.id}
                      comment={comment}
                      currentUser={user}
                      onEdit={handleEditComment}
                      onDelete={handleDeleteComment}
                      onReply={handleReplyComment}
                      replies={repliesMap.get(comment.id) || []}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}