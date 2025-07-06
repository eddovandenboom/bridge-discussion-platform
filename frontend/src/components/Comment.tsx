import { useState } from 'react'

interface User {
  id: string
  username: string
}

interface Circle {
  id: string
  name: string
}

export interface CommentData {
  id: string
  content: string
  boardNumber: number
  createdAt: string
  user: User
  circle: Circle
  parentCommentId?: string | null
}

interface CommentProps {
  comment: CommentData
  currentUser?: User | null
  onEdit: (commentId: string, content: string) => void
  onDelete: (commentId: string) => void
  onReply: (parentId: string, content: string) => void
  replies?: CommentData[]
  level?: number
}

export default function Comment({ 
  comment, 
  currentUser, 
  onEdit, 
  onDelete, 
  onReply,
  replies = [],
  level = 0
}: CommentProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleEdit = () => {
    if (editContent.trim()) {
      onEdit(comment.id, editContent.trim())
      setIsEditing(false)
    }
  }

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent.trim())
      setReplyContent('')
      setIsReplying(false)
    }
  }

  const canEdit = currentUser && comment.user.id === currentUser.id
  const maxNestLevel = 3 // Limit nesting to avoid UI issues

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-gray-200 pl-4' : ''}`}>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{comment.user.username}</span>
              {level > 0 && (
                <span className="text-xs text-blue-600">Reply</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-xs text-gray-500">
                {formatDate(comment.createdAt)}
              </div>
              {canEdit && !isEditing && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(comment.id)}
                    className="text-red-600 hover:text-red-800 text-xs"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={handleEdit}
                  className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(comment.content)
                  }}
                  className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 text-gray-700 break-words">{comment.content}</div>
          )}
        </div>

        {/* Reply button and form */}
        {currentUser && level < maxNestLevel && !isEditing && (
          <div className="mt-3">
            {!isReplying ? (
              <button
                onClick={() => setIsReplying(true)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Reply
              </button>
            ) : (
              <div className="mt-2">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={handleReply}
                    disabled={!replyContent.trim()}
                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => {
                      setIsReplying(false)
                      setReplyContent('')
                    }}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render replies */}
      {replies.length > 0 && (
        <div className="mt-3 space-y-3">
          {replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}