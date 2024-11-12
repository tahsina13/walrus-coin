import React, { Link, useLocation } from 'react-router-dom'
import StatusIcon from '../assets/status-icon.png'
import ProxyIcon from '../assets/proxy1.png'
import FilesIcon from '../assets/file-text.svg'
import TransactionsIcon from '../assets/transactions-icon.png'
import ExploreIcon from '../assets/icon.svg'
import PeersIcon from '../assets/peers-icon.png'
import MiningIcon from '../assets/mining-icon.png'
import AccountIcon from '../assets/avatar.png'
import WalrusCoinLogo from '../assets/walrus-coin-icon.png'
import ProxyIcon2 from '../assets/proxy-icon.jpg'
import { useState } from 'react'

function Sidebar(): JSX.Element {
  const menuItems = [
    { label: 'Status', icon: StatusIcon, path: '/status' },
    { label: 'Proxy', icon: ProxyIcon, path: '/proxy' },
    { label: 'Files', icon: FilesIcon, path: '/files' },
    { label: 'Transactions', icon: TransactionsIcon, path: '/transactions' },
    { label: 'Explore', icon: ExploreIcon, path: '/explore' },
    { label: 'Mine', icon: MiningIcon, path: '/mining' },
    { label: 'Account', icon: AccountIcon, path: '/account' },
  ]

  const location = useLocation()

  const currentPath = location.pathname
  const activeIndex = menuItems.findIndex(item => item.path === currentPath)

  return (
    <div style={{ backgroundColor: '#997777' }} className="w-1/6 min-h-screen flex-col flex items-center">
      <div className="flex justify-center p-4 mt-6">
        <img src={WalrusCoinLogo} alt="WalrusCoin" className="w-40 h-40" />
      </div>
      <div className="flex justify-center p-4">
        <span className="text-white text-4xl">{'WalrusCoin'}</span>
      </div>
      <ul className="mt-0 space-y-0 w-full">
        {menuItems.map((item, index) => (
          <li key={index} className="menu-item items-center">
            <Link to={item.path} 
              className={activeIndex == index ? "flex items-center space-x-8 duration-300 bg-yellow-900 py-3 text-white text-2xl" : "flex items-center space-x-4 duration-300 hover:bg-yellow-900 py-3 text-white text-lg"}
              >
              {item.icon && (
                <span className="h-12 space-x-4">
                  <img src={item.icon} alt={`${item.label}`} className="w-8 h-8 mx-4 mt-2" />
                </span>
              )}
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="float-right">
      </div>
    </div>
  )
}

export default Sidebar
