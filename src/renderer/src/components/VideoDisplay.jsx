/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */

import { useState } from 'react'
import { Download, Clock, User, Zap, Plus, CardSim, Binary } from 'lucide-react'

export default function VideoDisplay({ video, onDownload, onAddToQueue, settings }) {
  const [selectedQuality, setSelectedQuality] = useState(null)

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getDisplayedQualities = () => {
    return video.getAllQualities()
  }

  const handleDownload = () => {
    if (!selectedQuality) return
    onDownload(video, selectedQuality)
  }

  const handleAddToQueue = () => {
    if (!selectedQuality) return
    onAddToQueue(video, selectedQuality)
  }

  const getQualityBadge = (quality) => {
    if (quality.isNativeCombined) {
      return <span className="badge badge-secondary badge-sm">Native</span>
    }
    if (video.requiresFFmpeg(quality)) {
      return <span className="badge badge-primary badge-sm">FFmpeg</span>
    }
    return null
  }

  return (
    <div className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <div className="flex gap-6">
          {/* Video Embed */}
          <div
            className="w-1/2 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => window.open(video.url, '_blank')}
          >
            <img src={video.thumbnail} alt={video.name} />
          </div>

          {/* Video Info */}
          <div className="lg:w-2/3 space-y-4">
            <div>
              <h3 className="text-base font-semibold mb-2">{video.name}</h3>

              <div className="flex flex-wrap gap-4 text-sm text-base-content text-opacity-70">
                {video.uploader && (
                  <div className="flex items-center gap-1 text-xs opacity-60">
                    <User className="w-3 h-3" />
                    <span>{video.uploader}</span>
                  </div>
                )}

                {video.duration && (
                  <div className="flex items-center gap-1 text-xs opacity-60">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quality Selection */}
        <div className="divider">Quality Selection</div>

        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              className="btn btn-soft btn-primary rounded-lg btn-sm"
              onClick={() => setSelectedQuality(video.getBestQuality())}
            >
              <Zap className="w-4 h-4" />
              Best Quality
            </button>
            <button
              className="btn btn-ghost btn-warning rounded-lg btn-sm"
              onClick={() =>
                setSelectedQuality(video.qualityOptions[video.qualityOptions.length - 1])
              }
            >
              <CardSim className="w-4 h-4" />
              Data Saver
            </button>
            <button
              className="btn btn-soft btn-secondary rounded-lg btn-sm"
              onClick={() => setSelectedQuality(video.getBestNativeCombinedQuality())}
            >
              <Binary className="w-4 h-4" />
              Native Quality
            </button>
          </div>

          {/* Quality List */}
          <div className="space-y-2 h-49 pr-4 lg:p-0 lg:h-auto overflow-y-auto">
            {getDisplayedQualities().map((quality, index) => (
              <div
                key={quality.formatId}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedQuality?.formatId === quality.formatId
                    ? 'border-primary bg-base-300 bg-opacity-10'
                    : 'border-base-300 hover:border-base-400 hover:bg-base-100'
                }`}
                onClick={() => setSelectedQuality(quality)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      className="radio radio-primary radio-sm"
                      checked={selectedQuality?.formatId === quality.formatId}
                      onChange={() => setSelectedQuality(quality)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{quality.quality}</span>
                        {getQualityBadge(quality)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Download Buttons */}
        <div className="card-actions justify-end">
          <button
            className="btn btn-soft btn-primary"
            onClick={handleDownload}
            disabled={!selectedQuality}
          >
            <Download className="w-5 h-5" />
            Download Now
          </button>
          <button
            className="btn btn-soft btn-secondary"
            onClick={handleAddToQueue}
            disabled={!selectedQuality}
          >
            <Plus className="w-5 h-5" />
            Add to Queue
          </button>
        </div>
      </div>
    </div>
  )
}
