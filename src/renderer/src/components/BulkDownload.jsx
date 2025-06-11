import { useState } from 'react'
import { Plus, Trash2, Download, AlertCircle, Loader } from 'lucide-react'

export default function BulkDownload({ onAddToQueue }) {
  const [urls, setUrls] = useState([''])
  const [processing, setProcessing] = useState(false)
  const [errors, setErrors] = useState([])
  const [selectedQuality, setSelectedQuality] = useState('best')

  const addUrlField = () => {
    setUrls([...urls, ''])
  }

  const removeUrlField = (index) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index))
      // Remove corresponding error if exists
      setErrors(errors.filter((_, i) => i !== index))
    }
  }

  const updateUrl = (index, value) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)

    // Clear error for this field when user types
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

  const handleBulkAdd = async () => {
    setProcessing(true)
    setErrors([])

    const validUrls = urls.filter((url) => url.trim())
    const newErrors = new Array(urls.length).fill(null)

    // Validate URLs
    let hasErrors = false
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

    // Process each URL
    let successCount = 0
    for (let i = 0; i < validUrls.length; i++) {
      const url = validUrls[i].trim()
      const originalIndex = urls.findIndex((u) => u === url)

      try {
        const video = new window.api.VideoData(url)
        await video.fetchMetadata()

        // Determine quality
        let quality
        switch (selectedQuality) {
          case 'best':
            quality = video.getBestQuality()
            break
          case 'native':
            quality = video.getBestNativeCombinedQuality()
            break
          default:
            quality = video.getQuality(parseInt(selectedQuality)) || video.getBestQuality()
        }

        await onAddToQueue(video, quality)
        successCount++
      } catch (error) {
        newErrors[originalIndex] = error.message
      }
    }

    setErrors(newErrors)
    setProcessing(false)

    if (successCount > 0) {
      // Clear successful URLs
      const remainingUrls = urls.filter((url, index) => newErrors[index] !== null || !url.trim())
      setUrls(remainingUrls.length > 0 ? remainingUrls : [''])
    }
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
    <div className="card bg-base-200 shadow-lg">
      <div className="card-body">
        <h3 className="card-title mb-4">Bulk Download</h3>

        {/* Quality Selection */}
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Quality for all videos</span>
          </label>
          <select
            className="select select-bordered"
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
          >
            {qualityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* URL Input Fields */}
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

        {/* Actions */}
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
        </div>

        {/* Bulk Add Button */}
        <div className="card-actions justify-end mt-4">
          <button
            className={`btn btn-primary ${processing ? 'loading' : ''}`}
            onClick={handleBulkAdd}
            disabled={processing || urls.every((url) => !url.trim())}
          >
            {processing ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {processing ? 'Processing...' : 'Add All to Queue'}
          </button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-base-content text-opacity-60 mt-4">
          <p className="mb-1">💡 Tips:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Paste multiple URLs separated by line breaks</li>
            <li>URLs will be processed and added to the download queue</li>
            <li>Invalid URLs will be highlighted with errors</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
