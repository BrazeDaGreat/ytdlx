/* eslint-disable react/prop-types */

import { Home, Download, Settings, Activity, Folders } from 'lucide-react'

export default function Sidebar({ currentView, onViewChange, downloadCount, activeDownloads }) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'queue', label: 'Queue', icon: Folders },
    { id: 'downloads', label: 'Downloads', icon: Download, badge: downloadCount },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="bg-base-200 h-full w-[256px] rounded-lg shadow-lg flex flex-col">
      <YTDLX />

      {activeDownloads > 0 && (
        <div className="mx-4 mb-4">
          <div className="bg-primary bg-opacity-20 rounded-lg p-3 border border-primary border-opacity-30">
            <div className="flex items-center gap-2 text-primary">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">
                {activeDownloads} active download{activeDownloads !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-4">
        <ul className="menu menu-md gap-1 w-full">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.id

            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center gap-3 transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-pink-500 to-violet-500 text-secondary-content'
                      : 'hover:bg-base-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="badge badge-primary badge-sm">{item.badge}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-base-300">
        <div className="text-xs text-base-content text-opacity-60 text-center">
          Built with yt-dlp
        </div>
      </div>
    </div>
  )
}

function YTDLX() {
  return (
    <div className="flex p-4 items-center gap-4 border-b border-base-300">
      <div className="w-12 h-12 flex items-center justify-center text-xl font-bold bg-gradient-to-br from-pink-500 to-violet-500 rounded-lg select-none">
        YX
      </div>
      <div className="flex flex-col">
        <span className="font-semibold">YTDL-X</span>
        <span className="text-xs opacity-60">v0.1.0-alpha</span>
      </div>
    </div>
  )
}
