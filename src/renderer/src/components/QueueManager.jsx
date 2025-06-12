/* eslint-disable react/prop-types */
import { useState } from 'react'
import {
  Plus,
  Trash2,
  Download,
  AlertCircle,
  Loader,
  Search,
  Zap,
  CardSim,
  Binary,
  Clock,
  User
} from 'lucide-react'

export default function QueueManager({ onAddToQueue, settings }) {
  const [urls, setUrls] = useState([''])
  const [fetchedVideos, setFetchedVideos] = useState([])
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState([])

  const addUrlField = () => {
    setUrls([...urls, ''])
  }

  const removeUrlField = (index) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index))
      setErrors(errors.filter((_, i) => i !== index))
    }
  }

  const updateUrl = (index, value) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)

    if (errors[index]) {
      const newErrors = [...errors]
      newErrors[index] = null
      setErrors(newErrors)
    }
  }

  const isValidYouTubeUrl = (url) => {
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\//,
      /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=/
    ]
    return patterns.some((pattern) => pattern.test(url))
  }

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const lines = text.split('\n').filter((line) => line.trim())

      if (lines.length > 0) {
        setUrls(lines.length === 1 ? [lines[0]] : lines)
        setErrors([])
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error)
    }
  }

  const fetchVideos = async () => {
    setProcessing(true)
    setErrors([])
    setFetchedVideos([])

    const validUrls = urls.filter((url) => url.trim())
    const newErrors = new Array(urls.length).fill(null)

    // Validate URLs
    let hasErrors = false
    // eslint-disable-next-line no-unused-vars
    validUrls.forEach((url, originalIndex) => {
      const urlIndex = urls.findIndex((u) => u === url)
      if (!isValidYouTubeUrl(url.trim())) {
        newErrors[urlIndex] = 'Invalid YouTube URL'
        hasErrors = true
      }
    })

    if (hasErrors) {
      setErrors(newErrors)
      setProcessing(false)
      return
    }

    // Fetch metadata for each URL
    const videos = []
    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i].trim()
      const originalIndex = urls.findIndex((u) => u === url)

      try {
        const video = new window.api.VideoData(url)
        await video.fetchMetadata()

        // Determine default quality based on settings
        let selectedQuality
        switch (settings.defaultQuality) {
          case 'best':
            selectedQuality = video.getBestQuality()
            break
          case 'native':
            selectedQuality = video.getBestNativeCombinedQuality()
            break
          case '2160':
          case '1440':
          case '1080':
          case '720':
          case '480':
            selectedQuality =
              video.getQuality(parseInt(settings.defaultQuality)) || video.getBestQuality()
            break
          default:
            selectedQuality = video.getBestQuality()
        }

        videos.push({
          id: `${Date.now()}-${i}`,
          video,
          selectedQuality,
          error: null
        })
      } catch (error) {
        newErrors[originalIndex] = error.message
        videos.push({
          id: `${Date.now()}-${i}`,
          video: null,
          selectedQuality: null,
          error: error.message
        })
      }
    }

    setErrors(newErrors)
    setFetchedVideos(videos)
    setProcessing(false)
  }

  const updateVideoQuality = (videoId, quality) => {
    setFetchedVideos((prev) =>
      prev.map((v) => (v.id === videoId ? { ...v, selectedQuality: quality } : v))
    )
  }

  const removeVideo = (videoId) => {
    setFetchedVideos((prev) => prev.filter((v) => v.id !== videoId))
  }

  const startDownloads = async () => {
    const validVideos = fetchedVideos.filter((v) => v.video && v.selectedQuality)

    for (const videoData of validVideos) {
      await onAddToQueue(videoData.video, videoData.selectedQuality)
    }

    // Clear the form
    setUrls([''])
    setFetchedVideos([])
    setErrors([])
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getQualityBadge = (quality, video) => {
    if (!quality || !video) return null

    if (quality.isNativeCombined) {
      return <span className="badge badge-secondary badge-sm">Native</span>
    }
    if (video.requiresFFmpeg(quality)) {
      return <span className="badge badge-primary badge-sm">FFmpeg</span>
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Queue Manager</h2>
        <p className="text-base-content text-opacity-60">
          Paste YouTube URLs, fetch metadata, select quality, and add to download queue
        </p>
      </div>

      {/* URL Input Section */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h3 className="card-title mb-4">Add URLs</h3>

          <div className="space-y-3 max-h-80 overflow-y-auto">
            {urls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={`input input-bordered w-full ${errors[index] ? 'input-error' : ''}`}
                    value={url}
                    onChange={(e) => updateUrl(index, e.target.value)}
                    disabled={processing}
                  />
                  {errors[index] && (
                    <div className="text-error text-xs mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors[index]}
                    </div>
                  )}
                </div>

                {urls.length > 1 && (
                  <button
                    className="btn btn-ghost btn-square"
                    onClick={() => removeUrlField(index)}
                    disabled={processing}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn btn-ghost btn-sm" onClick={addUrlField} disabled={processing}>
              <Plus className="w-4 h-4" />
              Add URL
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={pasteFromClipboard}
              disabled={processing}
            >
              Paste from Clipboard
            </button>

            <button
              className={`btn btn-primary btn-sm ${processing ? 'loading' : ''}`}
              onClick={fetchVideos}
              disabled={processing || urls.every((url) => !url.trim())}
            >
              {processing ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {processing ? 'Fetching...' : 'Fetch Videos'}
            </button>
          </div>
        </div>
      </div>

      {/* Fetched Videos Section */}
      {fetchedVideos.length > 0 && (
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title">
                Fetched Videos ({fetchedVideos.filter((v) => v.video).length})
              </h3>
              <button
                className="btn btn-primary"
                onClick={startDownloads}
                disabled={!fetchedVideos.some((v) => v.video && v.selectedQuality)}
              >
                <Download className="w-5 h-5" />
                Add All to Queue
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {fetchedVideos.map((videoData) => (
                <div key={videoData.id} className="border border-base-300 rounded-lg p-4">
                  {videoData.video ? (
                    <div className="space-y-4">
                      {/* Video Info */}
                      <div className="flex gap-4">
                        <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0">
                          <img
                            src={videoData.video.thumbnail}
                            alt={videoData.video.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate" title={videoData.video.name}>
                            {videoData.video.name}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-base-content text-opacity-60 mt-1">
                            {videoData.video.uploader && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{videoData.video.uploader}</span>
                              </div>
                            )}
                            {videoData.video.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDuration(videoData.video.duration)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm btn-square"
                          onClick={() => removeVideo(videoData.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quality Selection */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Quality:</span>
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={() =>
                                updateVideoQuality(videoData.id, videoData.video.getBestQuality())
                              }
                            >
                              <Zap className="w-3 h-3" />
                              Best
                            </button>
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={() =>
                                updateVideoQuality(
                                  videoData.id,
                                  videoData.video.getBestNativeCombinedQuality()
                                )
                              }
                            >
                              <Binary className="w-3 h-3" />
                              Native
                            </button>
                            <button
                              className="btn btn-xs btn-outline"
                              onClick={() =>
                                updateVideoQuality(
                                  videoData.id,
                                  videoData.video.qualityOptions[
                                    videoData.video.qualityOptions.length - 1
                                  ]
                                )
                              }
                            >
                              <CardSim className="w-3 h-3" />
                              Lowest
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          {videoData.video.getAllQualities().map((quality) => (
                            <div
                              key={quality.formatId}
                              className={`p-2 rounded border cursor-pointer transition-all ${
                                videoData.selectedQuality?.formatId === quality.formatId
                                  ? 'border-primary bg-primary bg-opacity-10'
                                  : 'border-base-300 hover:border-base-400'
                              }`}
                              onClick={() => updateVideoQuality(videoData.id, quality)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    className="radio radio-primary radio-xs"
                                    checked={
                                      videoData.selectedQuality?.formatId === quality.formatId
                                    }
                                    onChange={() => updateVideoQuality(videoData.id, quality)}
                                  />
                                  <span className="text-sm font-medium">{quality.quality}</span>
                                </div>
                                {getQualityBadge(quality, videoData.video)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-error">
                      <AlertCircle className="w-5 h-5" />
                      <span>Failed to fetch video: {videoData.error}</span>
                      <button
                        className="btn btn-ghost btn-sm btn-square ml-auto"
                        onClick={() => removeVideo(videoData.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
