import MiningIcon from '../assets/image-1.png'
import Dollar from '../assets/DollarIcon.png'
import React, { useState } from 'react'



function StatusPage(): JSX.Element {
  const [waco, set_waco] = useState<number>(0)
  const [peers, set_peers] = useState<number>(0)
  return (
    <div className="container flex flex-col justify-center items-center h-screen">
      <img src={MiningIcon} alt="WalrusCoin" className="h-3/4 object-cover rounded w-1/2" />
      <div className="flex flex-row justify-center items-center h-screen bg-yellow-200 w-1/2">
        <div className="flex flex-row items-center w-3/4">
          <img src={Dollar} alt="Dollar" className="h-20" />
          <text className="text-5xl ml-10">{waco} WACO</text>
        </div>
        <div className="flex-col justify-center items-center ml-20 bg-blue-200 w-1/4minor status page changes">
          <div>Connected</div>
          <div>Peers: {peers}</div>
        </div>
      </div>

    </div>
  )
}

export default StatusPage
