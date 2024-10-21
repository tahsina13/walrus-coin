import React, { useState, useEffect } from 'react';
import MiningIcon from '../assets/image-1.png';
import Dollar from '../assets/DollarIcon.png';
import { PageHeader } from '../components/Components'
import BandwidthChart from './BandwidthChart';

enum ConnectionStatus {
  Connected = "Connected",
  Disconnected = "Disconnected",
  Connecting = "Connecting",
}

function StatusPage(): JSX.Element {
  const [waco, set_waco] = useState<number>(()=>{
    const savedWaco = localStorage.getItem('balance')
    return savedWaco ? parseInt(savedWaco) : 0
  })
  const [peers, set_peers] = useState<number>(0)
  const [status, set_status] = useState<ConnectionStatus>(ConnectionStatus.Connected);
  const [sampleData, setSampleData] = useState<{ timestamp: string; bandwidth: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timestamp = now.toLocaleTimeString();
      const bandwidth = Math.floor(Math.random() * (500 - 100 + 1)) + 100; // Random value between 100 and 500
      setSampleData(prevData => [...prevData, { timestamp, bandwidth }]);
      
      // Keep the last 24 hours of data
      if (prevData.length >= 24) {
        prevData.shift();
      }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case ConnectionStatus.Connected:
        return <span className="text-green-500">&#9679;</span>;
      case ConnectionStatus.Disconnected:
        return <span className="text-red-500">&#9679;</span>;
      case ConnectionStatus.Connecting:
        return <span className="text-yellow-500">&#9679;</span>;
      default:
        return null;
    }
  };

  return (
    <div className="container flex flex-col h-screen pl-10">
      <PageHeader name={'Status'} />
      <div className="info-container flex flex-col justify-center items-center h-screen">
        <div className="temp w-3/4">
          <BandwidthChart data={sampleData} />
        </div>

        {/* <img src={MiningIcon} alt="WalrusCoin" className="h-3/4 object-cover rounded w-1/2" /> */}
        <div className="container flex flex-row justify-center items-center bg-yellow-200 w-1/2 rounded-xl">
          <div className="flex flex-row items-center w-3/4">
            <img src={Dollar} alt="Dollar" className="h-20" />
            <text className="text-5xl ml-10">{waco} WACO</text>
          </div>
          <div className="flex-col justify-center items-center ml-20 bg-blue-200 w-1/4 h-full rounded-xl">
            <div className="text-xl mt-10 flex items-center">
              <span className="ml-4">{status}</span> {getStatusIcon()}
            </div>
            <div className="text-xl ml-4 mt-10"> Peers: {peers}</div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default StatusPage
