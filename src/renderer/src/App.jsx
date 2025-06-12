import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import VideoInput from './components/VideoInput'
import VideoDisplay from './components/VideoDisplay'
import QueueManager from './components/QueueManager'
import Downloads from './components/Downloads'
import Settings from './components/Settings'

export default function App() {
  const [currentView, setCurrentView] = useState('home')
  const [currentVideo, setCurrentVideo] = useState(null)
  const [downloadQueue, setDownloadQueue] = useState(null)
  const [downloads, setDownloads] = useState([])
  const [settings, setSettings] = useState({
    downloadPath: './downloads/',
    maxConcurrent: 3,
    defaultQuality: 'best',
    autoClearCompleted: false,
    showNotifications: true,
    embedSubtitles: false,
    downloadThumbnails: false
  })

  // Load settings and downloads on startup
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const savedSettings = await window.api.config.getSettings()
        const savedDownloads = await window.api.config.getDownloads()

        setSettings(savedSettings)
        setDownloads(savedDownloads)
      } catch (error) {
        console.error('Failed to load config:', error)
      }
    }

    loadConfig()
  }, [])

  // Initialize download queue when settings change
  useEffect(() => {
    const queue = new window.api.DownloadQueue(settings.downloadPath, settings.maxConcurrent)

    queue.onProgress((video, percent) => {
      const updateData = { progress: percent, status: 'downloading' }
      setDownloads((prev) =>
        prev.map((d) => (d.videoUrl === video.url ? { ...d, ...updateData } : d))
      )
      // Update persistent storage
      const download = downloads.find((d) => d.videoUrl === video.url)
      if (download) {
        window.api.config.updateDownload(download.id, updateData)
      }
    })

    queue.onVideoComplete((video, filepath) => {
      const updateData = { progress: 100, status: 'completed', filepath, completedAt: new Date() }
      setDownloads((prev) =>
        prev.map((d) => (d.videoUrl === video.url ? { ...d, ...updateData } : d))
      )
      // Update persistent storage
      const download = downloads.find((d) => d.videoUrl === video.url)
      if (download) {
        window.api.config.updateDownload(download.id, updateData)
      }
    })

    queue.onError((video, error) => {
      const updateData = { status: 'error', error: error.message }
      setDownloads((prev) =>
        prev.map((d) => (d.videoUrl === video.url ? { ...d, ...updateData } : d))
      )
      // Update persistent storage
      const download = downloads.find((d) => d.videoUrl === video.url)
      if (download) {
        window.api.config.updateDownload(download.id, updateData)
      }
    })

    setDownloadQueue(queue)
  }, [settings.downloadPath, settings.maxConcurrent])

  const handleSettingsChange = async (newSettings) => {
    setSettings(newSettings)
    await window.api.config.setSettings(newSettings)
  }

  const addToQueue = async (video, quality) => {
    try {
      const id = await downloadQueue.add(video, () => quality)
      const newDownload = {
        id,
        video,
        videoUrl: video.url,
        videoName: video.name,
        videoUploader: video.uploader,
        videoThumbnail: video.thumbnail,
        quality,
        progress: 0,
        status: 'queued',
        addedAt: new Date()
      }
      setDownloads((prev) => [...prev, newDownload])
      await window.api.config.addDownload(newDownload)
    } catch (error) {
      console.error('Failed to add to queue:', error)
    }
  }

  const downloadSingle = async (video, quality) => {
    try {
      const download = await video.download(quality, settings.downloadPath)
      const downloadId = Date.now().toString()
      const newDownload = {
        id: downloadId,
        video,
        videoUrl: video.url,
        videoName: video.name,
        videoUploader: video.uploader,
        videoThumbnail: video.thumbnail,
        quality,
        progress: 0,
        status: 'downloading',
        addedAt: new Date(),
        downloadInstance: download
      }

      setDownloads((prev) => [...prev, newDownload])
      await window.api.config.addDownload(newDownload)

      download.onProgress((percent) => {
        const updateData = { progress: percent, status: 'downloading' }
        setDownloads((prev) => prev.map((d) => (d.id === downloadId ? { ...d, ...updateData } : d)))
        window.api.config.updateDownload(downloadId, updateData)
      })

      download.onComplete((filepath) => {
        const updateData = { progress: 100, status: 'completed', filepath, completedAt: new Date() }
        setDownloads((prev) => prev.map((d) => (d.id === downloadId ? { ...d, ...updateData } : d)))
        window.api.config.updateDownload(downloadId, updateData)
      })

      download.onError((error) => {
        const updateData = { status: 'error', error: error.message }
        setDownloads((prev) => prev.map((d) => (d.id === downloadId ? { ...d, ...updateData } : d)))
        window.api.config.updateDownload(downloadId, updateData)
      })

      download.start()
    } catch (error) {
      console.error('Failed to start download:', error)
    }
  }

  const removeDownload = async (id) => {
    const download = downloads.find((d) => d.id === id)
    if (download) {
      if (!download.downloadInstance && downloadQueue.remove(id)) {
        setDownloads((prev) => prev.filter((d) => d.id !== id))
      } else if (download.downloadInstance) {
        if (download.status === 'downloading') {
          download.downloadInstance.cancel()
        }
        setDownloads((prev) => prev.filter((d) => d.id !== id))
      } else {
        setDownloads((prev) => prev.filter((d) => d.id !== id))
      }
      await window.api.config.removeDownload(id)
    }
  }

  const renderMainContent = () => {
    switch (currentView) {
      case 'home':
        return (
          <div className="flex flex-col gap-6">
            <VideoInput
              onVideoFetched={setCurrentVideo}
              onError={(error) => console.error(error)}
            />
            {currentVideo && (
              <VideoDisplay
                video={currentVideo}
                onDownload={downloadSingle}
                onAddToQueue={addToQueue}
                settings={settings}
              />
            )}
          </div>
        )
      case 'queue':
        return <QueueManager onAddToQueue={addToQueue} settings={settings} />
      case 'downloads':
        return <Downloads downloads={downloads} onRemove={removeDownload} settings={settings} />
      case 'settings':
        return <Settings settings={settings} onSettingsChange={handleSettingsChange} />
      default:
        return <div>Unknown view</div>
    }
  }

  return (
    <main className="flex gap-2 w-screen h-screen p-2">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        downloadCount={downloads.length}
        activeDownloads={downloads.filter((d) => d.status === 'downloading').length}
      />
      <div className="flex-1 bg-base-100 rounded-lg shadow-lg p-6 overflow-auto">
        {renderMainContent()}
      </div>
    </main>
  )
}
