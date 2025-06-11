const { spawn } = require('child_process')
const { EventEmitter } = require('events')
const path = require('path')
const fs = require('fs').promises

let ffmpegPath = 'ffmpeg'

try {
  ffmpegPath = require('ffmpeg-static')
} catch (error) {
  console.warn(
    'ffmpeg-static not found, using system ffmpeg. Install with: npm install ffmpeg-static'
  )
}

class VideoData {
  /**
   * @param {string} url - YouTube video URL
   * @prop {string} url - YouTube video URL
   * @prop {string} name - Video title
   * @prop {string} description - Video description
   * @prop {Array<object>} qualityOptions - Array of available qualities
   * @prop {number} duration - Video duration in seconds
   * @prop {string} thumbnail - Video thumbnail URL
   * @prop {string} uploader - Video uploader
   * @prop {boolean} _metadataFetched - Whether metadata has been fetched
   */
  constructor(url) {
    this.url = url
    this.name = ''
    this.description = ''
    this.qualityOptions = []
    this.duration = 0
    this.thumbnail = ''
    this.uploader = ''
    this._metadataFetched = false
  }

  /**
   * Fetches and parses metadata for the video from the given URL using yt-dlp.
   * Populates the instance properties such as name, description, duration,
   * thumbnail, uploader, and available quality options.
   *
   * @returns {Promise<VideoData>} Resolves to the VideoData instance if successful.
   * @throws {Error} If yt-dlp execution fails or metadata parsing fails.
   */

  async fetchMetadata() {
    if (this._metadataFetched) return

    return new Promise((resolve, reject) => {
      const args = ['--dump-json', '--no-playlist', this.url]

      const ytdlp = spawn('yt-dlp', args)
      let output = ''
      let errorOutput = ''

      ytdlp.stdout.on('data', (data) => {
        output += data.toString()
      })

      ytdlp.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      ytdlp.on('close', (code) => {
        if (code === 0) {
          try {
            const metadata = JSON.parse(output)
            this.name = metadata.title || 'Unknown Title'
            this.description = metadata.description || ''
            this.duration = metadata.duration || 0
            this.thumbnail = metadata.thumbnail || ''
            this.uploader = metadata.uploader || ''

            this.qualityOptions = this._parseFormats(metadata.formats || [])
            this._metadataFetched = true
            resolve(this)
          } catch (error) {
            reject(new Error(`Failed to parse metadata: ${error.message}`))
          }
        } else {
          reject(new Error(`yt-dlp failed: ${errorOutput}`))
        }
      })

      ytdlp.on('error', (error) => {
        reject(new Error(`Failed to spawn yt-dlp: ${error.message}`))
      })
    })
  }

  /**
   * Parses and organizes video and audio formats into a structured array of quality objects.
   *
   * This function filters through the provided formats to separate video formats (both combined and video-only)
   * and selects the best audio format for merging with video-only streams. It groups formats by video height,
   * preferring native combined formats when available. For each height, it creates quality objects with detailed
   * information such as format ID, file extension, filesize, frames per second, codec information, and merging
   * requirements.
   *
   * @param {Array<object>} formats - Array of format objects retrieved from yt-dlp metadata.
   * @returns {Array<object>} Array of quality objects, each representing a unique video quality option,
   * including details on whether ffmpeg is needed for merging audio.
   */

  _parseFormats(formats) {
    // Get all video formats (both combined and video-only)
    const videoFormats = formats.filter((f) => f.vcodec !== 'none' && f.height)

    // Get best audio format for merging with video-only streams
    const audioFormats = formats.filter((f) => f.acodec !== 'none' && f.vcodec === 'none')
    const bestAudio =
      audioFormats.length > 0
        ? audioFormats.reduce((best, current) =>
            (current.abr || 0) > (best.abr || 0) ? current : best
          )
        : null

    // Group by height and prefer combined formats, but create virtual combined for all
    const qualityMap = new Map()

    videoFormats.forEach((format) => {
      const height = format.height
      const isNativeCombined = format.acodec !== 'none'

      if (!qualityMap.has(height)) {
        qualityMap.set(height, {
          native: isNativeCombined ? format : null,
          videoOnly: !isNativeCombined ? format : null
        })
      } else {
        const existing = qualityMap.get(height)
        if (isNativeCombined) {
          existing.native = format
        } else if (!existing.videoOnly || format.vbr > (existing.videoOnly.vbr || 0)) {
          existing.videoOnly = format
        }
      }
    })

    const uniqueQualities = Array.from(qualityMap.keys()).sort((a, b) => b - a)

    return uniqueQualities.map((height) => {
      const formatData = qualityMap.get(height)
      const preferredFormat = formatData.native || formatData.videoOnly
      const hasNativeCombined = !!formatData.native

      return {
        quality: `${height}p`,
        height: height,
        formatId: preferredFormat.format_id,
        ext: preferredFormat.ext || 'mp4',
        filesize: preferredFormat.filesize,
        fps: preferredFormat.fps,
        hasAudio: hasNativeCombined, // This now indicates if it's natively combined
        vcodec: preferredFormat.vcodec,
        acodec: preferredFormat.acodec,
        // New fields for handling merging
        isNativeCombined: hasNativeCombined,
        needsMerging: !hasNativeCombined && !!bestAudio,
        bestAudioFormat: bestAudio ? bestAudio.format_id : null,
        // Virtual combined - all qualities are now "available" as combined
        virtualCombined: true
      }
    })
  }

  /**
   * Downloads a video at the specified quality to the given download path.
   * Will automatically fetch video metadata if it hasn't been fetched yet.
   * @param {object} quality - The quality object to download.
   * @param {string} downloadPath - The directory to save the video.
   * @returns {Promise<DownloadInstance>} A promise resolving to a DownloadInstance.
   */
  async download(quality, downloadPath) {
    if (!this._metadataFetched) {
      await this.fetchMetadata()
    }
    return new DownloadInstance(this, quality, downloadPath)
  }

  /**
   * Gets the best available quality for the video.
   * @returns {object|null} The best quality object, or null if no qualities are available.
   */
  getBestQuality() {
    return this.qualityOptions[0] || null
  }

  /**
   * Gets the best available quality for the video that is "combined" (either
   * natively or through merging).
   * @returns {object|null} The best combined quality object, or null if no
   * qualities are available.
   */
  getBestCombinedQuality() {
    // Now all qualities are "combined" (either natively or through merging)
    return this.qualityOptions[0] || null
  }

  /**
   * Gets the best available quality for the video that is natively combined
   * (i.e. doesn't require merging).
   * @returns {object|null} The best natively combined quality object, or null if no
   * qualities are available.
   */
  getBestNativeCombinedQuality() {
    // Get best quality that doesn't require merging
    return this.qualityOptions.find((q) => q.isNativeCombined) || null
  }

  /**
   * Gets the quality object with the specified height, or null if not found.
   * @param {number} height - The height of the desired quality.
   * @returns {object|null} The quality object with the specified height, or null if not found.
   */
  getQuality(height) {
    return this.qualityOptions.find((q) => q.height === height) || null
  }

  /**
   * Gets all available qualities for the video.
   * @returns {object[]} An array of all available quality objects.
   */
  getAllQualities() {
    // All qualities are now available as "combined"
    return this.qualityOptions
  }

  /**
   * Gets all available qualities that are combined (either natively or
   * virtually), i.e. have both video and audio.
   * @returns {object[]} An array of all available combined quality objects.
   */
  getCombinedQualities() {
    // All qualities are now combined (either natively or virtually)
    return this.qualityOptions
  }

  /**
   * Gets all available qualities that are natively combined (i.e. have both
   * video and audio without requiring ffmpeg for merging).
   * @returns {object[]} An array of all available natively combined quality
   * objects.
   */
  getNativeCombinedQualities() {
    // Only qualities that don't require ffmpeg
    return this.qualityOptions.filter((q) => q.isNativeCombined)
  }

  /**
   * Gets all available qualities that are video-only, requiring audio merging.
   * @returns {object[]} An array of all video-only quality objects, which need ffmpeg for merging.
   */

  getVideoOnlyQualities() {
    // Qualities that will require merging
    return this.qualityOptions.filter((q) => !q.isNativeCombined)
  }

  /**
   * Checks if the specified quality requires ffmpeg for merging audio.
   * @param {object} quality - The quality object to check.
   * @returns {boolean} True if ffmpeg is required, false if not.
   */
  requiresFFmpeg(quality) {
    return quality && !quality.isNativeCombined
  }

  /**
   * Gets a raw list of formats for the video, without processing them into
   * quality objects. This is useful for debugging or for advanced format
   * selection.
   * @returns {Promise<string>} A promise that resolves to a raw list of formats
   * as a string.
   */
  async getAllFormats() {
    if (!this._metadataFetched) {
      await this.fetchMetadata()
    }

    return new Promise((resolve, reject) => {
      const args = ['--list-formats', '--no-playlist', this.url]

      const ytdlp = spawn('yt-dlp', args)
      let output = ''

      ytdlp.stdout.on('data', (data) => {
        output += data.toString()
      })

      ytdlp.on('close', (code) => {
        if (code === 0) {
          resolve(output)
        } else {
          reject(new Error('Failed to list formats'))
        }
      })
    })
  }
}

class DownloadInstance extends EventEmitter {
  /**
   * Creates a new download instance for the given video and quality.
   * @param {VideoData} videoData - The video data to download.
   * @param {object} quality - The quality object to download.
   * @param {string} downloadPath - The directory to save the video.
   * @prop {VideoData} videoData - The video data to download.
   * @prop {object} quality - The quality object to download.
   * @prop {string} downloadPath - The directory to save the video.
   * @prop {boolean} isStarted - Whether the download has started.
   * @prop {boolean} isCompleted - Whether the download has completed.
   * @prop {boolean} isCancelled - Whether the download has been cancelled.
   * @prop {string} filePath - The path to the downloaded video.
   * @prop {ChildProcess} process - The child process for the download.
   */
  constructor(videoData, quality, downloadPath) {
    super()
    this.videoData = videoData
    this.quality = quality
    this.downloadPath = downloadPath
    this.isStarted = false
    this.isCompleted = false
    this.isCancelled = false
    this.filePath = ''
    this.process = null
  }

  /**
   * Registers a callback function to be called with the download progress as a
   * percentage.
   * @param {function(number)} callback - The callback function to register.
   * @returns {DownloadInstance} This DownloadInstance for chaining.
   */
  onProgress(callback) {
    this.on('progress', callback)
    return this
  }

  /**
   * Registers a callback function to be called when the download has completed.
   * The callback is called with the file path of the downloaded video.
   * @param {function(string)} callback - The callback function to register.
   * @returns {DownloadInstance} This DownloadInstance for chaining.
   */
  onComplete(callback) {
    this.on('complete', callback)
    return this
  }

  /**
   * Registers a callback function to be called if the download encounters an error.
   * The callback is called with the error object.
   * @param {function(error)} callback - The callback function to register.
   * @returns {DownloadInstance} This DownloadInstance for chaining.
   */
  onError(callback) {
    this.on('error', callback)
    return this
  }

  /**
   * Starts the download process for the given video and quality.
   * @returns {Promise<DownloadInstance>} This DownloadInstance for chaining.
   * @throws {Error} If the download has already started.
   */
  async start() {
    if (this.isStarted) {
      throw new Error('Download already started')
    }

    this.isStarted = true

    try {
      await fs.access(this.downloadPath)
    } catch {
      await fs.mkdir(this.downloadPath, { recursive: true })
    }

    // Smart format selection strategy
    let formatId

    if (this.quality.isNativeCombined) {
      // Use native combined format directly
      formatId = this.quality.formatId
      console.log(`Using native combined format: ${this.quality.quality}`)
    } else if (this.quality.needsMerging && this.quality.bestAudioFormat) {
      // Use specific video + best audio with fallbacks
      formatId = `${this.quality.formatId}+${this.quality.bestAudioFormat}/bestvideo[height<=${this.quality.height}]+bestaudio/best[height<=${this.quality.height}]`
      console.log(`Merging ${this.quality.quality} video with audio (requires ffmpeg)`)
    } else {
      // Fallback to best available for this height
      formatId = `best[height<=${this.quality.height}]`
      console.log(`Using best available format for ${this.quality.quality}`)
    }

    const filename = `${this.videoData.name.replace(/[<>:"/\\|?*]/g, '_')}.%(ext)s`
    this.filePath = path.join(this.downloadPath, filename)

    const args = [
      '--format',
      formatId,
      '--output',
      this.filePath,
      '--merge-output-format',
      'mp4', // Ensure consistent output format
      '--newline'
    ]

    // Add ffmpeg location if available
    if (ffmpegPath !== 'ffmpeg') {
      args.splice(-1, 0, '--ffmpeg-location', ffmpegPath)
    }

    args.push(this.videoData.url)

    this.process = spawn('yt-dlp', args)

    this.process.stdout.on('data', (data) => {
      const output = data.toString()

      // Better progress parsing
      const progressMatch = output.match(/(\d+\.?\d*)%/)
      if (progressMatch) {
        const percent = parseFloat(progressMatch[1])
        this.emit('progress', percent)
      }

      // Log download info
      if (output.includes('[download]') && output.includes('Destination:')) {
        console.log('Download started:', output.trim())
      }
    })

    this.process.stderr.on('data', (data) => {
      const errorOutput = data.toString()

      // Handle ffmpeg warnings gracefully
      if (errorOutput.includes('WARNING') && errorOutput.includes('ffmpeg')) {
        console.warn('⚠️  FFmpeg warning:', errorOutput.trim())

        // Suggest fallback but don't stop the download
        if (errorOutput.includes('not installed') || errorOutput.includes('not found')) {
          console.log('💡 Installing ffmpeg-static will enable higher quality downloads:')
          console.log('   npm install ffmpeg-static')
          console.log('   Continuing with available format...')
        }
        return
      }

      // Handle other warnings
      if (errorOutput.includes('WARNING')) {
        console.warn('⚠️  Warning:', errorOutput.trim())
        return
      }

      // Only emit error for actual errors
      if (
        errorOutput.includes('ERROR') ||
        errorOutput.includes('error:') ||
        errorOutput.includes('Unable to download') ||
        errorOutput.includes('HTTP Error')
      ) {
        this.emit('error', new Error(errorOutput.trim()))
      }
    })

    this.process.on('close', (code) => {
      if (code === 0 && !this.isCancelled) {
        this.isCompleted = true
        // Try to determine actual file extension
        const possibleExts = ['mp4', 'webm', 'mkv']
        const basePath = this.filePath.replace('.%(ext)s', '')

        // Find the actual downloaded file
        possibleExts.forEach((ext) => {
          const testPath = `${basePath}.${ext}`
          require('fs').access(testPath, require('fs').constants.F_OK, (err) => {
            if (!err && !this.actualFilePath) {
              this.actualFilePath = testPath
              this.emit('complete', testPath)
            }
          })
        })

        // Fallback to expected path
        setTimeout(() => {
          if (!this.actualFilePath) {
            const fallbackPath = `${basePath}.mp4`
            this.emit('complete', fallbackPath)
          }
        }, 100)
      } else if (!this.isCancelled) {
        this.emit('error', new Error(`Download failed with exit code ${code}`))
      }
    })

    this.process.on('error', (error) => {
      if (error.code === 'ENOENT') {
        this.emit(
          'error',
          new Error(
            'yt-dlp not found. Please install yt-dlp: https://github.com/yt-dlp/yt-dlp#installation'
          )
        )
      } else {
        this.emit('error', error)
      }
    })

    return this
  }

  /**
   * Cancels the download if it has not completed yet.
   * @returns {this} The DownloadInstance for chaining.
   */
  cancel() {
    if (this.process && !this.isCompleted) {
      this.isCancelled = true
      this.process.kill('SIGTERM')
    }
  }
}

class DownloadQueue extends EventEmitter {
  /**
   * Creates a new DownloadQueue.
   * @param {string} downloadPath - The directory to save all downloads.
   * @param {number} [maxConcurrent=3] - The maximum number of downloads to run concurrently.
   * @constructs DownloadQueue
   * @prop {string} downloadPath - The directory to save all downloads.
   * @prop {number} maxConcurrent - The maximum number of downloads to run concurrently.
   * @prop {VideoData[]} queue - The queue of videos to download.
   * @prop {Map<string, DownloadInstance>} activeDownloads - The currently active downloads.
   * @prop {string[]} completedDownloads - The list of completed downloads.
   * @prop {string[]} failedDownloads - The list of failed downloads.
   */
  constructor(downloadPath, maxConcurrent = 3) {
    super()
    this.downloadPath = downloadPath
    this.maxConcurrent = maxConcurrent
    this.queue = []
    this.activeDownloads = new Map()
    this.completedDownloads = []
    this.failedDownloads = []
  }

  /**
   * Registers a callback function to be called with the download progress of the
   * most recently started download as a percentage.
   * @param {function(number)} callback - The callback function to register.
   * @returns {DownloadQueue} This DownloadQueue for chaining.
   */
  onProgress(callback) {
    this.on('progress', callback)
    return this
  }

  /**
   * Registers a callback function to be called when a video has finished downloading.
   * The callback is called with the VideoData instance and the file path of the
   * downloaded video.
   * @param {function(VideoData, string)} callback - The callback function to register.
   * @returns {DownloadQueue} This DownloadQueue for chaining.
   */
  onVideoComplete(callback) {
    this.on('videoComplete', callback)
    return this
  }

  /**
   * Registers a callback function to be called when the download queue has
   * finished. The callback is called with an object containing the number of
   * completed and failed downloads.
   * @param {function({completed: number, failed: number})} callback - The
   * callback function to register.
   * @returns {DownloadQueue} This DownloadQueue for chaining.
   */
  onQueueComplete(callback) {
    this.on('queueComplete', callback)
    return this
  }

  /**
   * Registers a callback function to be called when any download encounters an error.
   * The callback is called with the error object.
   * @param {function(Error)} callback - The callback function to register.
   * @returns {DownloadQueue} This DownloadQueue for chaining.
   */
  onError(callback) {
    this.on('error', callback)
    return this
  }

  /**
   * Add a video to the download queue. If the video metadata has not been
   * fetched, it will be done automatically. If a quality function is provided,
   * it will be called with the videoData as an argument to determine the
   * quality to use. Otherwise, the first available quality will be used.
   *
   * @param {VideoData} videoData
   * @param {function(VideoData):Quality} quality
   * @return {Promise<string>} unique queue item ID
   */
  async add(videoData, quality = null) {
    if (!videoData._metadataFetched) {
      await videoData.fetchMetadata()
    }

    const selectedQuality = quality(videoData) || videoData.qualityOptions[0]
    const queueItem = {
      videoData,
      quality: selectedQuality,
      id: Date.now() + Math.random()
    }

    this.queue.push(queueItem)
    this._processQueue()

    return queueItem.id
  }

  /**
   * Removes a video from the download queue if it has not been started yet.
   * If the video is currently being downloaded, it will be cancelled.
   * @param {string} id - The unique queue item ID returned by `add()`.
   * @returns {boolean} True if the item was removed from the queue or the
   * active downloads, false if the item was not found in either.
   */
  remove(id) {
    const index = this.queue.findIndex((item) => item.id === id)
    if (index !== -1) {
      this.queue.splice(index, 1)
      return true
    }

    if (this.activeDownloads.has(id)) {
      const download = this.activeDownloads.get(id)
      download.instance.cancel()
      this.activeDownloads.delete(id)
      return true
    }

    return false
  }

  pause() {
    this.paused = true
  }

  resume() {
    this.paused = false
    this._processQueue()
  }

  clear() {
    this.queue = []
    for (const [id, download] of this.activeDownloads) {
      download.instance.cancel()
    }
    this.activeDownloads.clear()
  }

  getStatus() {
    return {
      queued: this.queue.length,
      active: this.activeDownloads.size,
      completed: this.completedDownloads.length,
      failed: this.failedDownloads.length,
      paused: this.paused || false
    }
  }

  async _processQueue() {
    if (this.paused || this.activeDownloads.size >= this.maxConcurrent || this.queue.length === 0) {
      return
    }

    const queueItem = this.queue.shift()
    const downloadInstance = await queueItem.videoData.download(
      queueItem.quality,
      this.downloadPath
    )

    this.activeDownloads.set(queueItem.id, {
      instance: downloadInstance,
      videoData: queueItem.videoData
    })

    downloadInstance.onProgress((percent) => {
      this.emit('progress', queueItem.videoData, percent)
    })

    downloadInstance.onComplete((filepath) => {
      this.activeDownloads.delete(queueItem.id)
      this.completedDownloads.push({
        videoData: queueItem.videoData,
        filepath,
        completedAt: new Date()
      })

      this.emit('videoComplete', queueItem.videoData, filepath)

      if (this.activeDownloads.size === 0 && this.queue.length === 0) {
        this.emit('queueComplete', {
          completed: this.completedDownloads.length,
          failed: this.failedDownloads.length
        })
      }

      this._processQueue()
    })

    downloadInstance.onError((error) => {
      this.activeDownloads.delete(queueItem.id)
      this.failedDownloads.push({
        videoData: queueItem.videoData,
        error: error.message,
        failedAt: new Date()
      })

      this.emit('error', queueItem.videoData, error)
      this._processQueue()
    })

    downloadInstance.start()
    this._processQueue()
  }
}

module.exports = {
  VideoData,
  DownloadInstance,
  DownloadQueue
}
