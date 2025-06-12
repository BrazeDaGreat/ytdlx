/* eslint-disable react/prop-types */
import { useState } from 'react'
import {
  Download,
  Trash2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  FolderOpen,
  Play
} from 'lucide-react'

export default function Downloads({ downloads, onRemove, settings }) {
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
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  const getFilteredDownloads = () => {
    let filtered = downloads

    if (filter !== 'all') {
      filtered = filtered.filter((d) => d.status === filter)
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.addedAt) - new Date(a.addedAt)
        case 'oldest':
          return new Date(a.addedAt) - new Date(b.addedAt)
        case 'progress':
          return b.progress - a.progress
        case 'name':
          return (a.videoName || '').localeCompare(b.videoName || '')
        default:
          return 0
      }
    })
  }

  const handleClearCompleted = async () => {
    const completedDownloads = downloads.filter((d) => d.status === 'completed')
    for (const download of completedDownloads) {
      await onRemove(download.id)
    }
    await window.api.config.clearCompletedDownloads()
  }

  const handleClearAll = async () => {
    for (const download of downloads) {
      await onRemove(download.id)
    }
    await window.api.config.clearAllDownloads()
  }

  const openDownloadFolder = () => {
    window.api.openPath(settings.downloadPath)
  }

  const openFile = (filepath) => {
    if (filepath) {
      window.api.openPath(filepath)
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString()
  }

  const filteredDownloads = getFilteredDownloads()
  const stats = {
    total: downloads.length,
    completed: downloads.filter((d) => d.status === 'completed').length,
    downloading: downloads.filter((d) => d.status === 'downloading').length,
    failed: downloads.filter((d) => d.status === 'error').length,
    queued: downloads.filter((d) => d.status === 'queued').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Downloads</h2>
          <p className="text-base-content text-opacity-60">
            {stats.total} total downloads • Download history and management
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost btn-sm" onClick={openDownloadFolder}>
            <FolderOpen className="w-4 h-4" />
            Open Folder
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleClearCompleted}
            disabled={stats.completed === 0}
          >
            <RefreshCw className="w-4 h-4" />
            Clear Completed
          </button>
          <button
            className="btn btn-error btn-outline btn-sm"
            onClick={handleClearAll}
            disabled={stats.total === 0}
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Stats */}
      {/* <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-title">Total</div>
          <div className="stat-value text-primary">{stats.total}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-title">Completed</div>
          <div className="stat-value text-success">{stats.completed}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-title">Downloading</div>
          <div className="stat-value text-warning">{stats.downloading}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-title">Queued</div>
          <div className="stat-value text-info">{stats.queued}</div>
        </div>
        <div className="stat bg-base-200 rounded-lg">
          <div className="stat-title">Failed</div>
          <div className="stat-value text-error">{stats.failed}</div>
        </div>
      </div> */}

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
            <option value="completed">Completed</option>
            <option value="downloading">Downloading</option>
            <option value="queued">Queued</option>
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
                : 'Downloads will appear here as you add them'}
            </p>
          </div>
        ) : (
          filteredDownloads.map((download) => (
            <div key={download.id} className="card bg-base-200 shadow-lg">
              <div className="card-body p-4">
                <div className="flex items-start gap-4">
                  {/* Video Thumbnail */}
                  <div className="w-24 h-16 bg-base-300 rounded flex-shrink-0 overflow-hidden">
                    {download.videoThumbnail ? (
                      <img
                        src={download.videoThumbnail}
                        alt={download.videoName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="w-6 h-6 text-base-content text-opacity-30" />
                      </div>
                    )}
                  </div>

                  {/* Download Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4
                          className="font-medium truncate cursor-pointer hover:text-primary"
                          title={download.videoName}
                          onClick={() => window.open(download.videoUrl, '_blank')}
                        >
                          {download.videoName || 'Unknown Title'}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-base-content text-opacity-60 mt-1">
                          <span className="font-semibold opacity-70">
                            {download.quality?.quality || 'Unknown quality'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(download.status)}
                          <span className="text-sm">{getStatusText(download.status)}</span>
                        </div>

                        {download.status === 'completed' && download.filepath && (
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => openFile(download.filepath)}
                            title="Open file"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </button>
                        )}

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
                          <span>{(download.progress || 0).toFixed(1)}%</span>
                        </div>
                        <progress
                          className="progress progress-primary w-full"
                          value={download.progress || 0}
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
                    {download.status === 'completed' && (
                      <div className="mt-2">
                        <div className="text-xs text-success flex items-center gap-2">
                          <span>
                            Completed {download.completedAt ? formatDate(download.completedAt) : ''}
                          </span>
                          {download.filepath && (
                            <button
                              className="link text-success"
                              onClick={() => openFile(download.filepath)}
                            >
                              Open file
                            </button>
                          )}
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
    </div>
  )
}
