import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import VideoInput from './components/VideoInput'
import VideoDisplay from './components/VideoDisplay'
import DownloadQueue from './components/DownloadQueue'
import BulkDownload from './components/BulkDownload'
import Settings from './components/Settings'

export default function App() {
  const [currentView, setCurrentView] = useState('home')
  const [currentVideo, setCurrentVideo] = useState(null)
  const [downloadQueue, setDownloadQueue] = useState(null)
  const [downloads, setDownloads] = useState([])
  const [settings, setSettings] = useState({
    downloadPath: './downloads/',
    maxConcurrent: 3,
    defaultQuality: 'best'
  })

  useEffect(() => {
    // Initialize download queue
    const queue = new window.api.DownloadQueue(settings.downloadPath, settings.maxConcurrent)

    // Setup queue event handlers
    queue.onProgress((video, percent) => {
      setDownloads((prev) =>
        prev.map((d) =>
          d.video.url === video.url ? { ...d, progress: percent, status: 'downloading' } : d
        )
      )
    })

    queue.onVideoComplete((video, filepath) => {
      setDownloads((prev) =>
        prev.map((d) =>
          d.video.url === video.url ? { ...d, progress: 100, status: 'completed', filepath } : d
        )
      )
    })

    queue.onError((video, error) => {
      setDownloads((prev) =>
        prev.map((d) =>
          d.video.url === video.url ? { ...d, status: 'error', error: error.message } : d
        )
      )
    })

    queue.onQueueComplete((stats) => {
      console.log('Queue completed:', stats)
    })

    setDownloadQueue(queue)
  }, [settings.downloadPath, settings.maxConcurrent])

  const addToQueue = async (video, quality) => {
    try {
      const id = await downloadQueue.add(video, () => quality)
      const newDownload = {
        id,
        video,
        quality,
        progress: 0,
        status: 'queued',
        addedAt: new Date()
      }
      setDownloads((prev) => [...prev, newDownload])
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
        quality,
        progress: 0,
        status: 'downloading',
        addedAt: new Date(),
        downloadInstance: download
      }

      setDownloads((prev) => [...prev, newDownload])

      download.onProgress((percent) => {
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === downloadId ? { ...d, progress: percent, status: 'downloading' } : d
          )
        )
      })

      download.onComplete((filepath) => {
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === downloadId ? { ...d, progress: 100, status: 'completed', filepath } : d
          )
        )
      })

      download.onError((error) => {
        setDownloads((prev) =>
          prev.map((d) =>
            d.id === downloadId ? { ...d, status: 'error', error: error.message } : d
          )
        )
      })

      download.start()
    } catch (error) {
      console.error('Failed to start download:', error)
    }
  }

  const removeFromQueue = (id) => {
    const download = downloads.find((d) => d.id === id)
    if (download) {
      // If it's a queue download, remove from queue
      if (!download.downloadInstance && downloadQueue.remove(id)) {
        setDownloads((prev) => prev.filter((d) => d.id !== id))
      }
      // If it's a direct download, cancel if running and remove
      else if (download.downloadInstance) {
        if (download.status === 'downloading') {
          download.downloadInstance.cancel()
        }
        setDownloads((prev) => prev.filter((d) => d.id !== id))
      }
      // Fallback: just remove from state
      else {
        setDownloads((prev) => prev.filter((d) => d.id !== id))
      }
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
        return (
          <div className="space-y-6">
            <BulkDownload onAddToQueue={addToQueue} />
            <DownloadQueue downloads={downloads} onRemove={removeFromQueue} queue={downloadQueue} />
          </div>
        )
      case 'settings':
        return <Settings settings={settings} onSettingsChange={setSettings} />
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
