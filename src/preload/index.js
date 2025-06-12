import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { DownloadInstance, DownloadQueue, VideoData } from '../lib/ytdlp-wrapper.cjs'

const api = {
  VideoData,
  DownloadQueue,
  DownloadInstance,
  config: {
    getSettings: () => ipcRenderer.invoke('config:getSettings'),
    setSettings: (settings) => ipcRenderer.invoke('config:setSettings', settings),
    getDownloads: () => ipcRenderer.invoke('config:getDownloads'),
    addDownload: (download) => ipcRenderer.invoke('config:addDownload', download),
    updateDownload: (id, updates) => ipcRenderer.invoke('config:updateDownload', id, updates),
    removeDownload: (id) => ipcRenderer.invoke('config:removeDownload', id),
    clearCompletedDownloads: () => ipcRenderer.invoke('config:clearCompletedDownloads'),
    clearAllDownloads: () => ipcRenderer.invoke('config:clearAllDownloads')
  },
  openPath: (path) => ipcRenderer.invoke('open:path', path),
  selectFolder: () => ipcRenderer.invoke('select:folder')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
