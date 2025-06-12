/* eslint-disable react/prop-types */
/* eslint-disable react/prop-types */
import { useState } from 'react'
import {
  Settings as SettingsIcon,
  FolderOpen,
  Save,
  RotateCcw,
  Info,
  Clipboard
} from 'lucide-react'
import VERSION from '../../../lib/VERSION'

export default function Settings({ settings, onSettingsChange }) {
  const [localSettings, setLocalSettings] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSettingChange = (key, value) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(settings))
  }

  const handleSave = () => {
    onSettingsChange(localSettings)
    setHasChanges(false)
  }

  const handleReset = () => {
    setLocalSettings(settings)
    setHasChanges(false)
  }

  const handleBrowseFolder = async () => {
    try {
      const folderPath = await window.api.selectFolder()
      if (folderPath) {
        handleSettingChange('downloadPath', folderPath + '/')
      }
    } catch (error) {
      console.error('Failed to select folder:', error)
    }
  }

  const handlePastePath = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        // Ensure path ends with /
        const path = text.trim().endsWith('/') ? text.trim() : text.trim() + '/'
        handleSettingChange('downloadPath', path)
  const handleBrowseFolder = async () => {
    try {
      const folderPath = await window.api.selectFolder()
      if (folderPath) {
        handleSettingChange('downloadPath', folderPath + '/')
      }
    } catch (error) {
      console.error('Failed to select folder:', error)
    }
  }

  const handlePastePath = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        // Ensure path ends with /
        const path = text.trim().endsWith('/') ? text.trim() : text.trim() + '/'
        handleSettingChange('downloadPath', path)
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error)
    }
    } catch (error) {
      console.error('Failed to read clipboard:', error)
    }
  }

  const qualityOptions = [
    { value: 'best', label: 'Best Available' },
    { value: '2160', label: '4K (2160p)' },
    { value: '1440', label: '1440p' },
    { value: '1080', label: '1080p' },
    { value: '720', label: '720p' },
    { value: '480', label: '480p' },
    { value: 'native', label: 'Best Native (No FFmpeg)' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-7 h-7" />
            Settings
          </h2>
          <p className="text-base-content text-opacity-60 mt-1">
            Configure your download preferences
          </p>
        </div>

        {hasChanges && (
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {/* Settings Sections */}
      <div className="space-y-8">
        {/* Download Settings */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Download Settings</h3>

            <div className="space-y-6">
              {/* Download Path */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Download Folder</span>
                  <span className="label-text-alt">Where to save downloaded videos</span>
                </label>
                <div className="flex gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="input input-bordered flex-1"
                    value={localSettings.downloadPath}
                    onChange={(e) => handleSettingChange('downloadPath', e.target.value)}
                    placeholder="./downloads/"
                  />
                  <button
                    className="btn btn-outline"
                    onClick={handlePastePath}
                    title="Paste path from clipboard"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={handlePastePath}
                    title="Paste path from clipboard"
                  >
                    <Clipboard className="w-4 h-4" />
                  </button>
                  <button className="btn btn-outline" onClick={handleBrowseFolder}>
                    <FolderOpen className="w-4 h-4" />
                    Browse
                  </button>
                </div>
                <div className="label">
                  <span className="label-text-alt text-xs">
                    You can paste a folder path from your clipboard or browse to select one
                  </span>
                </div>
                <div className="label">
                  <span className="label-text-alt text-xs">
                    You can paste a folder path from your clipboard or browse to select one
                  </span>
                </div>
              </div>

              {/* Max Concurrent Downloads */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Concurrent Downloads</span>
                  <span className="label-text-alt">Maximum simultaneous downloads</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  className="range range-primary"
                  value={localSettings.maxConcurrent}
                  onChange={(e) => handleSettingChange('maxConcurrent', parseInt(e.target.value))}
                />
                <div className="flex justify-between text-xs px-2 mt-1">
                  <span>1</span>
                  <span className="font-medium">{localSettings.maxConcurrent}</span>
                  <span>10</span>
                </div>
                <div className="label">
                  <span className="label-text-alt">Higher values may cause network congestion</span>
                </div>
              </div>

              {/* Default Quality */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Default Quality</span>
                  <span className="label-text-alt">
                    Auto-select this quality when fetching videos in queue
                    Auto-select this quality when fetching videos in queue
                  </span>
                </label>
                <select
                  className="select select-bordered"
                  value={localSettings.defaultQuality}
                  onChange={(e) => handleSettingChange('defaultQuality', e.target.value)}
                >
                  {qualityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="label">
                  <span className="label-text-alt">
                    This will be pre-selected when you fetch videos in the Queue tab
                  </span>
                </div>
                <div className="label">
                  <span className="label-text-alt">
                    This will be pre-selected when you fetch videos in the Queue tab
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Advanced Settings</h3>

            <div className="space-y-6">
              {/* Auto-clear completed */}
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">
                    <span className="font-medium">Auto-clear completed downloads</span>
                    <br />
                    <span className="text-sm opacity-60">
                      Automatically remove completed downloads from the downloads list
                      Automatically remove completed downloads from the downloads list
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={localSettings.autoClearCompleted || false}
                    onChange={(e) => handleSettingChange('autoClearCompleted', e.target.checked)}
                  />
                </label>
              </div>

              {/* Show notifications */}
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">
                    <span className="font-medium">Show desktop notifications</span>
                    <br />
                    <span className="text-sm opacity-60">
                      Get notified when downloads complete or fail
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={localSettings.showNotifications !== false}
                    onChange={(e) => handleSettingChange('showNotifications', e.target.checked)}
                  />
                </label>
              </div>

              {/* Embed subtitles */}
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">
                    <span className="font-medium">Embed subtitles</span>
                    <br />
                    <span className="text-sm opacity-60">
                      Download and embed subtitles when available
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={localSettings.embedSubtitles || false}
                    onChange={(e) => handleSettingChange('embedSubtitles', e.target.checked)}
                  />
                </label>
              </div>

              {/* Download thumbnails */}
              <div className="form-control">
                <label className="cursor-pointer label">
                  <span className="label-text">
                    <span className="font-medium">Download thumbnails</span>
                    <br />
                    <span className="text-sm opacity-60">
                      Save video thumbnails alongside downloads
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={localSettings.downloadThumbnails || false}
                    onChange={(e) => handleSettingChange('downloadThumbnails', e.target.checked)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Storage & Data */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Storage & Data</h3>

            <div className="space-y-4">
              <div className="text-sm text-base-content text-opacity-60">
                <p className="mb-2">
                  Your settings and download history are automatically saved and will persist
                  between app sessions.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Settings are saved immediately when you click &quot;Save Changes&quot;</li>
                  <li>Download history is saved automatically as downloads progress</li>
                  <li>Data is stored locally on your computer</li>
                </ul>
              </div>

              <div className="divider"></div>

              <div className="flex gap-2">
                <button
                  className="btn btn-warning btn-outline btn-sm"
                  onClick={async () => {
                    if (
                      confirm(
                        'Are you sure you want to clear all download history? This cannot be undone.'
                      )
                    ) {
                      await window.api.config.clearAllDownloads()
                      window.location.reload()
                    }
                  }}
                >
                  Clear Download History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Storage & Data */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">Storage & Data</h3>

            <div className="space-y-4">
              <div className="text-sm text-base-content text-opacity-60">
                <p className="mb-2">
                  Your settings and download history are automatically saved and will persist
                  between app sessions.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Settings are saved immediately when you click &quot;Save Changes&quot;</li>
                  <li>Download history is saved automatically as downloads progress</li>
                  <li>Data is stored locally on your computer</li>
                </ul>
              </div>

              <div className="divider"></div>

              <div className="flex gap-2">
                <button
                  className="btn btn-warning btn-outline btn-sm"
                  onClick={async () => {
                    if (
                      confirm(
                        'Are you sure you want to clear all download history? This cannot be undone.'
                      )
                    ) {
                      await window.api.config.clearAllDownloads()
                      window.location.reload()
                    }
                  }}
                >
                  Clear Download History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card bg-base-200 shadow-lg">
          <div className="card-body">
            <h3 className="card-title mb-4">About</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-medium">YTDL-X {VERSION}</h4>
                  <p className="text-sm text-base-content text-opacity-60 mt-1">
                    A modern YouTube downloader built with React and yt-dlp.
                  </p>
                </div>
              </div>

              <div className="divider"></div>

              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-base-content text-opacity-60">yt-dlp version</span>
                  <span>Latest</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content text-opacity-60">FFmpeg</span>
                  <span className="badge badge-success badge-sm">Available</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-base-content text-opacity-60">Node.js</span>
                  <span>v18+</span>
                </div>
              </div>

              <div className="divider"></div>

              <div className="text-xs text-base-content text-opacity-50 text-center">
                <p>
                  Please respect YouTube&apos;s Terms of Service and content creators&apos; rights.
                  This tool is for personal use only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {hasChanges && (
        <div className="alert alert-warning">
          <Info className="w-5 h-5" />
          <div>
            <h4 className="font-medium">Unsaved Changes</h4>
            <p className="text-sm">You have unsaved changes. Don&apos;t forget to save them!</p>
            <p className="text-sm">You have unsaved changes. Don&apos;t forget to save them!</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-xs" onClick={handleReset}>
              Discard
            </button>
            <button className="btn btn-primary btn-xs" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
