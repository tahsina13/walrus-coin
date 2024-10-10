import MiningIcon from '../assets/image-1.png'
import React, { useState } from 'react'

function StatusPage(): JSX.Element {
  return (
    <div className="container flex justify-center items-center h-screen">
      <img src={MiningIcon} alt="WalrusCoin" className="h-3/4 object-cover" />
      <div className="flex flex-col items-center"></div>
    </div>
  )
}

export default StatusPage
