import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
// const configStore = require('../lib/config-store.js')
import configStore from '../lib/config-store.cjs'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Config IPC handlers
  ipcMain.handle('config:getSettings', () => configStore.getSettings())
  ipcMain.handle('config:setSettings', (_, settings) => configStore.setSettings(settings))
  ipcMain.handle('config:getDownloads', () => configStore.getDownloads())
  ipcMain.handle('config:addDownload', (_, download) => configStore.addDownload(download))
  ipcMain.handle('config:updateDownload', (_, id, updates) =>
    configStore.updateDownload(id, updates)
  )
  ipcMain.handle('config:removeDownload', (_, id) => configStore.removeDownload(id))
  ipcMain.handle('config:clearCompletedDownloads', () => configStore.clearCompletedDownloads())
  ipcMain.handle('config:clearAllDownloads', () => configStore.clearAllDownloads())

  // File system IPC handlers
  ipcMain.handle('open:path', (_, path) => {
    shell.openPath(path)
  })

  ipcMain.handle('select:folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
  })

  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
