import { useState } from 'react'
import {
  Download,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  FolderOpen
} from 'lucide-react'

export default function DownloadQueue({ downloads, onRemove, queue }) {
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const getStatusIcon = (status) => {
    switch (status) {
      case 'queued':
        return <Clock className="w-5 h-5 text-warning" />
      case 'downloading':
        return <Download className="w-5 h-5 text-primary animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-error" />
      default:
        return <Clock className="w-5 h-5 text-base-content text-opacity-50" />
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'queued':
        return 'Queued'
      case 'downloading':
        return 'Downloading'
      case 'completed':
        return 'Completed'
      case 'error':
        return 'Error'
      default:
        return 'Unknown'
    }
  }

  const getFilteredDownloads = () => {
    let filtered = downloads

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter((d) => d.status === filter)
    }

    // Apply sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.addedAt) - new Date(a.addedAt)
        case 'oldest':
          return new Date(a.addedAt) - new Date(b.addedAt)
        case 'progress':
          return b.progress - a.progress
        case 'name':
          return a.video.name.localeCompare(b.video.name)
        default:
          return 0
      }
    })
  }

  const handlePauseResume = () => {
    const status = queue?.getStatus()
    if (status?.paused) {
      queue.resume()
    } else {
      queue.pause()
    }
  }

  const handleClearCompleted = () => {
    downloads.filter((d) => d.status === 'completed').forEach((d) => onRemove(d.id))
  }

  const handleClearAll = () => {
    if (queue) {
      queue.clear()
    }
    downloads.forEach((d) => onRemove(d.id))
  }

  const openDownloadFolder = () => {
    // This would need to be implemented in the main process
    console.log('Open download folder')
  }

  const filteredDownloads = getFilteredDownloads()
  const queueStatus = queue?.getStatus()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Download Queue</h2>
          <p className="text-base-content text-opacity-60">
            {downloads.length} total downloads • Queue for bulk downloads
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost btn-sm" onClick={openDownloadFolder}>
            <FolderOpen className="w-4 h-4" />
            Open Folder
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handlePauseResume}
            disabled={!queueStatus}
          >
            {queueStatus?.paused ? (
              <>
                <Play className="w-4 h-4" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            )}
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleClearCompleted}
            disabled={!downloads.some((d) => d.status === 'completed')}
          >
            <RefreshCw className="w-4 h-4" />
            Clear Completed
          </button>
        </div>
      </div>

      {/* Queue Status */}
      {queueStatus && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Queued</div>
            <div className="stat-value text-warning">{queueStatus.queued}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Active</div>
            <div className="stat-value text-primary">{queueStatus.active}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Completed</div>
            <div className="stat-value text-success">{queueStatus.completed}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Failed</div>
            <div className="stat-value text-error">{queueStatus.failed}</div>
          </div>
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Status</div>
            <div className="stat-value text-sm">{queueStatus.paused ? 'Paused' : 'Running'}</div>
          </div>
        </div>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <select
            className="select select-bordered select-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Downloads</option>
            <option value="queued">Queued</option>
            <option value="downloading">Downloading</option>
            <option value="completed">Completed</option>
            <option value="error">Failed</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm">Sort by:</span>
          <select
            className="select select-bordered select-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="progress">Progress</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Downloads List */}
      <div className="space-y-4">
        {filteredDownloads.length === 0 ? (
          <div className="text-center py-12">
            <Download className="w-16 h-16 mx-auto text-base-content text-opacity-30 mb-4" />
            <h3 className="text-lg font-medium text-base-content text-opacity-60 mb-2">
              No downloads {filter !== 'all' ? `with status "${filter}"` : ''}
            </h3>
            <p className="text-sm text-base-content text-opacity-40">
              {filter !== 'all'
                ? 'Try changing the filter to see more downloads'
                : 'Add a video to start downloading'}
            </p>
          </div>
        ) : (
          filteredDownloads.map((download) => (
            <div key={download.id} className="card bg-base-200 shadow-lg">
              <div className="card-body p-4">
                <div className="flex items-start gap-4">
                  {/* Video Placeholder */}
                  <div className="w-20 h-14 bg-base-300 rounded flex-shrink-0 flex items-center justify-center">
                    <Play className="w-6 h-6 text-base-content text-opacity-30" />
                  </div>

                  {/* Download Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate" title={download.video.name}>
                          {download.video.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-base-content text-opacity-60 mt-1">
                          <span>{download.quality?.quality || 'Unknown quality'}</span>
                          {download.video.uploader && <span>by {download.video.uploader}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(download.status)}
                          <span className="text-sm">{getStatusText(download.status)}</span>
                        </div>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => onRemove(download.id)}
                          disabled={download.status === 'downloading'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {download.status === 'downloading' && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>
                            {download.downloadInstance ? 'Direct Download' : 'Queue Download'}
                          </span>
                          <span>{download.progress.toFixed(1)}%</span>
                        </div>
                        <progress
                          className="progress progress-primary w-full"
                          value={download.progress}
                          max="100"
                        />
                      </div>
                    )}

                    {/* Error Message */}
                    {download.status === 'error' && download.error && (
                      <div className="alert alert-error mt-3">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{download.error}</span>
                      </div>
                    )}

                    {/* Completed Info */}
                    {download.status === 'completed' && download.filepath && (
                      <div className="mt-2">
                        <div className="text-xs text-success">
                          Downloaded to: {download.filepath}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear All Button */}
      {downloads.length > 0 && (
        <div className="text-center">
          <button className="btn btn-error btn-outline" onClick={handleClearAll}>
            <Trash2 className="w-4 h-4" />
            Clear All Downloads
          </button>
        </div>
      )}
    </div>
  )
}
