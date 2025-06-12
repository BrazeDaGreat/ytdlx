/* eslint-disable react/prop-types */

import { Home, Download, Settings, Activity, Folders, Github } from 'lucide-react'
import VERSION from '../../../lib/VERSION'

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

      <div className="p-4 border-t border-base-300 space-y-2">
        <div className="text-xs text-base-content opacity-60 text-center">
          <span>&copy; 2025.</span>
        </div>
        <div className="text-xs text-base-content opacity-60 flex items-center justify-center gap-2">
          <FooterBtn
            icon={<Github className="w-4 h-4" />}
            url="https://github.com/BrazeDaGreat/ytdlx"
          />
          <FooterBtn icon={<DiscordJsx />} url="https://discord.gg/wRj2gNaNUF" />
        </div>
      </div>
    </div>
  )
}

function DiscordJsx() {
  return (
    <svg width="16" height="11.93" viewBox="0 0 59 44" className="brandLogo-2oAxnA">
      <g fill="currentColor">
        <path
          xmlns="http://www.w3.org/2000/svg"
          d="M37.1937 0C36.6265 1.0071 36.1172 2.04893 35.6541 3.11392C31.2553 2.45409 26.7754 2.45409 22.365 3.11392C21.9136 2.04893 21.3926 1.0071 20.8254 0C16.6928 0.70613 12.6644 1.94475 8.84436 3.69271C1.27372 14.9098 -0.775214 25.8374 0.243466 36.6146C4.67704 39.8906 9.6431 42.391 14.9333 43.9884C16.1256 42.391 17.179 40.6893 18.0819 38.9182C16.3687 38.2815 14.7133 37.4828 13.1274 36.5567C13.5442 36.2557 13.9493 35.9432 14.3429 35.6422C23.6384 40.0179 34.4039 40.0179 43.711 35.6422C44.1046 35.9663 44.5097 36.2789 44.9264 36.5567C43.3405 37.4943 41.6852 38.2815 39.9604 38.9298C40.8633 40.7009 41.9167 42.4025 43.109 44C48.3992 42.4025 53.3653 39.9137 57.7988 36.6377C59.0027 24.1358 55.7383 13.3007 49.1748 3.70429C45.3663 1.95633 41.3379 0.717706 37.2053 0.0231518L37.1937 0ZM19.3784 29.9816C16.5192 29.9816 14.1461 27.3886 14.1461 24.1821C14.1461 20.9755 16.4266 18.371 19.3669 18.371C22.3071 18.371 24.6455 20.9871 24.5992 24.1821C24.5529 27.377 22.2956 29.9816 19.3784 29.9816ZM38.6639 29.9816C35.7931 29.9816 33.4431 27.3886 33.4431 24.1821C33.4431 20.9755 35.7236 18.371 38.6639 18.371C41.6042 18.371 43.9309 20.9871 43.8846 24.1821C43.8383 27.377 41.581 29.9816 38.6639 29.9816Z"
        ></path>
      </g>
    </svg>
  )
}

function FooterBtn({ icon, url }) {
  return (
    <button
      className="btn btn-soft btn-primary rounded-full p-0 w-8 h-8"
      onClick={() => window.open(url, '_blank')}
    >
      {icon}
      {/* <icon className="w-4 h-4" /> */}
    </button>
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
        <span className="text-xs opacity-60">{VERSION}</span>
      </div>
    </div>
  )
}
