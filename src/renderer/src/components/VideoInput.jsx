/* eslint-disable react/prop-types */

import { useState } from 'react'
import { Search, AlertCircle } from 'lucide-react'

export default function VideoInput({ onVideoFetched, onError }) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isValidYouTubeUrl = (url) => {
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\//,
      /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=/
    ]
    return patterns.some((pattern) => pattern.test(url))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!url.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    if (!isValidYouTubeUrl(url.trim())) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const video = new window.api.VideoData(url.trim())
      await video.fetchMetadata()
      console.log(video)
      onVideoFetched(video)
      setUrl('')
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch video information'
      setError(errorMessage)
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUrlChange = (e) => {
    setUrl(e.target.value)
    if (error) setError(null)
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="w-full input-group flex gap-2 overflow-hidden">
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            className={`bg-base-200 rounded-lg shadow-lg px-4 flex-1`}
            value={url}
            onChange={handleUrlChange}
            disabled={loading}
            style={{
              outline: 'none'
            }}
          />
          <button
            type="submit"
            className={`btn bg-violet-500 rounded-lg shadow-lg text-white ${loading ? 'loading' : ''}`}
            disabled={loading || !url.trim()}
          >
            {loading ? <span className="custom_loader"></span> : <Search className="w-5 h-5" />}
          </button>
        </div>
        {error && (
          <div className="flex text-xs items-center gap-2 text-red-300 px-1 py-4 select-none">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </>
  )
}
