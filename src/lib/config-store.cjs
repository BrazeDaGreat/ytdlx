const Store = require('electron-store')

const schema = {
  settings: {
    type: 'object',
    properties: {
      downloadPath: { type: 'string', default: './downloads/' },
      maxConcurrent: { type: 'number', default: 3 },
      defaultQuality: { type: 'string', default: 'best' },
      autoClearCompleted: { type: 'boolean', default: false },
      showNotifications: { type: 'boolean', default: true },
      embedSubtitles: { type: 'boolean', default: false },
      downloadThumbnails: { type: 'boolean', default: false }
    },
    default: {}
  },
  downloads: {
    type: 'array',
    default: []
  }
}

class ConfigStore {
  constructor() {
    this.store = new Store({
      schema,
      name: 'ytdlx-config'
    })
  }

  getSettings() {
    return this.store.get('settings')
  }

  setSettings(settings) {
    this.store.set('settings', settings)
  }

  getDownloads() {
    return this.store.get('downloads')
  }

  addDownload(download) {
    const downloads = this.getDownloads()
    downloads.push({
      ...download,
      id: download.id,
      videoUrl: download.videoUrl || download.video?.url,
      videoName: download.videoName || download.video?.name,
      videoUploader: download.videoUploader || download.video?.uploader,
      videoThumbnail: download.videoThumbnail || download.video?.thumbnail,
      quality: download.quality,
      status: download.status,
      progress: download.progress || 0,
      addedAt: download.addedAt,
      completedAt: download.completedAt || null,
      filepath: download.filepath || null,
      error: download.error || null
    })
    this.store.set('downloads', downloads)
  }

  updateDownload(id, updates) {
    const downloads = this.getDownloads()
    const index = downloads.findIndex((d) => d.id === id)
    if (index !== -1) {
      downloads[index] = { ...downloads[index], ...updates }
      this.store.set('downloads', downloads)
    }
  }

  removeDownload(id) {
    const downloads = this.getDownloads()
    const filtered = downloads.filter((d) => d.id !== id)
    this.store.set('downloads', filtered)
  }

  clearCompletedDownloads() {
    const downloads = this.getDownloads()
    const filtered = downloads.filter((d) => d.status !== 'completed')
    this.store.set('downloads', filtered)
  }

  clearAllDownloads() {
    this.store.set('downloads', [])
  }
}

module.exports = new ConfigStore()
