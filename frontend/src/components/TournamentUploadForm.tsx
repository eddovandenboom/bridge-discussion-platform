import { useState } from 'react'
import axios from '../utils/api'

interface Circle {
  id: string
  name: string
}

interface TournamentUploadFormProps {
  circles: Circle[]
  onSuccess: () => void
  onCancel: () => void
}

export default function TournamentUploadForm({ circles, onSuccess, onCancel }: TournamentUploadFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    venue: '',
    circleIds: [] as string[]
  })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [autoFilled, setAutoFilled] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCircleSelection = (circleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      circleIds: checked 
        ? [...prev.circleIds, circleId]
        : prev.circleIds.filter(id => id !== circleId)
    }))
  }

  const parsePBNFile = async (file: File) => {
    return new Promise<void>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        if (content) {
          // Parse PBN headers
          const eventMatch = content.match(/\[Event\s+"([^"]+)"\]/)
          const siteMatch = content.match(/\[Site\s+"([^"]+)"\]/)
          const dateMatch = content.match(/\[Date\s+"([^"]+)"\]/)
          
          const updatedFormData = { ...formData }
          let hasAutoFilled = false
          
          // Auto-fill name from Event field
          if (eventMatch && eventMatch[1] && !formData.name) {
            updatedFormData.name = eventMatch[1]
            hasAutoFilled = true
          }
          
          // Auto-fill venue from Site field
          if (siteMatch && siteMatch[1] && !formData.venue) {
            updatedFormData.venue = siteMatch[1]
            hasAutoFilled = true
          }
          
          // Auto-fill date from Date field (convert PBN format YYYY.M.D to YYYY-MM-DD)
          if (dateMatch && dateMatch[1] && !formData.date) {
            const pbnDate = dateMatch[1]
            // Convert from "2025.6.24" to "2025-06-24"
            const dateParts = pbnDate.split('.')
            if (dateParts.length === 3) {
              const year = dateParts[0]
              const month = dateParts[1].padStart(2, '0')
              const day = dateParts[2].padStart(2, '0')
              updatedFormData.date = `${year}-${month}-${day}`
              hasAutoFilled = true
            }
          }
          
          setFormData(updatedFormData)
          setAutoFilled(hasAutoFilled)
        }
        resolve()
      }
      reader.readAsText(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.pbn')) {
        setError('Please select a PBN file')
        return
      }
      setFile(selectedFile)
      setError('')
      
      // Parse PBN file and auto-fill form fields
      try {
        await parsePBNFile(selectedFile)
      } catch (err) {
        console.error('Error parsing PBN file:', err)
        // Don't show error to user, just continue without auto-fill
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file) {
      setError('Please select a PBN file')
      return
    }

    if (!formData.name.trim() || !formData.date) {
      setError('Please fill in tournament name and date')
      return
    }

    if (formData.circleIds.length === 0) {
      setError('Please select at least one circle to share this tournament with')
      return
    }

    setUploading(true)
    setError('')

    try {
      const uploadData = new FormData()
      uploadData.append('pbnFile', file)
      uploadData.append('name', formData.name.trim())
      uploadData.append('date', formData.date)
      if (formData.venue.trim()) {
        uploadData.append('venue', formData.venue.trim())
      }
      
      // Add circle IDs as JSON string to ensure proper array handling
      uploadData.append('circleIds', JSON.stringify(formData.circleIds))

      await axios.post('/api/tournaments', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      onSuccess()
    } catch (err: any) {
      console.error('Error uploading tournament:', err)
      setError(err.response?.data?.error || 'Failed to upload tournament')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Tournament</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* PBN File */}
            <div>
              <label htmlFor="pbnFile" className="block text-sm font-medium text-gray-700 mb-2">
                PBN File *
              </label>
              <input
                type="file"
                id="pbnFile"
                accept=".pbn,text/plain"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Select a PBN file containing the tournament hands
              </p>
              {autoFilled && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700">
                    ✓ Tournament information has been automatically extracted from the PBN file
                  </p>
                </div>
              )}
            </div>

            {/* Tournament Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Spring Championship 2025"
                required
              />
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Tournament Date *
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* Venue */}
            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700 mb-2">
                Venue (Optional)
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Bridge Club Downtown"
              />
            </div>

            {/* Circle Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Share with Circles *
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                {circles.map(circle => (
                  <label key={circle.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.circleIds.includes(circle.id)}
                      onChange={(e) => handleCircleSelection(circle.id, e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">{circle.name}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Select which circles can access this tournament
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : 'Upload Tournament'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}