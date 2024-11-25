import React, { useState, useEffect } from 'react';
import MiningIcon from '../assets/image-1.png';
import Dollar from '../assets/DollarIcon.png';
import { PageHeader } from '../components/Components'
import BandwidthChart from './BandwidthChart';
import axios from 'axios';

enum ConnectionStatus {
  Connected = "Connected",
  Disconnected = "Disconnected",
  Connecting = "Connecting",
}

function StatusPage(): JSX.Element {

  const [currentSessionDuration, setCurrentSessionDuration] = useState<number>(() => {
    const savedSessionDuration = sessionStorage.getItem('currentSessionDuration')
    return savedSessionDuration ? parseInt(savedSessionDuration) : 0
  })
  
  const [waco, set_waco] = useState<number>(()=>{
    const savedWaco = localStorage.getItem('balance')
    return savedWaco ? parseFloat(savedWaco) : 0
  })
  const [balance, setBalance] = useState<string>('0');
  const [peers, set_peers] = useState<number>(0)
  const [status, set_status] = useState<ConnectionStatus>(ConnectionStatus.Connected);
  const [sampleData, setSampleData] = useState<{ timestamp: string; bandwidth: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const fetchWalletBalance = async () => {
        try {
          // const response = await fetch('https://api.example.com/data');
          const balance = await getWalletBalance();
          setBalance(balance);
          // const result = await response.json();
          // setData(result);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchWalletBalance();
      const now = new Date();
      const timestamp = now.toLocaleTimeString();
      const bandwidth = Math.floor(Math.random() * (500 - 100 + 1)) + 100; // Random value between 100 and 500
      setSampleData(prevData => [...prevData, { timestamp, bandwidth }]);
      
      // Keep the last 24 hours of data
      // if (prevData.length >= 24) {
      //   prevData.shift();
      // }
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    // sessionStorage.setItem('currentSessionDuration', String(currentSessionDuration))

    // if (currentSessionDuration % 5 === 0 && currentSessionDuration > 0) {
    //   sessionStorage.setItem('blocksMined', String(blocksMined))
    //   localStorage.setItem('balance', String(balance))
    //   setBlocksMined((prev) => prev)
    const fetchWalletBalance = async () => {
      try {
        // const response = await fetch('https://api.example.com/data');
        const balance = await getWalletBalance();
        setBalance(balance);
        // const result = await response.json();
        // setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchWalletBalance();
      // setMineHistory((prev) => [{ hash: generateRandomHash(), date: new Date(), reward: 5 }, ...prev])
    // }
  }, [])

  async function getWalletBalance(): Promise<string> {
    const balancerpc = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "getbalance", params: []}, {
      auth: {
        username: 'user',
        password: 'password'
      },
      headers: {
        'Content-Type': 'text/plain;',
      },
    });
    console.log(balancerpc);
    return balancerpc.data.result;
  }

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
            <div className="text-5xl ml-10">{balance} WACO</div>
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
