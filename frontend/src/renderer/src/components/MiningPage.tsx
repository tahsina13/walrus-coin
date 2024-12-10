import { useState, useEffect } from 'react'
import Pickaxe from '../assets/pickaxe.png'
import { PageHeader } from './Components'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function MiningPage(): JSX.Element {
  const navigate = useNavigate();
  const [isMining, setIsMining] = useState<boolean>(() => {
    const savedMiningState = sessionStorage.getItem('isMining')
    return savedMiningState === 'true'
  })
  const [blocksMined, setBlocksMined] = useState<number>(() => {
    const savedBlocksMined = sessionStorage.getItem('blocksMined')
    return savedBlocksMined ? parseInt(savedBlocksMined) : 0
  })
  // const [balance, setBalance] = useState<number>(() => {
  //   const savedBalance = localStorage.getItem('balance')
  //   return savedBalance ? parseFloat(savedBalance) : 10
  // })
  const [currentSessionDuration, setCurrentSessionDuration] = useState<number>(() => {
    const savedSessionDuration = sessionStorage.getItem('currentSessionDuration')
    return savedSessionDuration ? parseInt(savedSessionDuration) : 0
  })

  // const hashRate:string = '0';

  const [hashRate, setHashRate] = useState<string>('0');

  type MinedBlock = {
    hash: string
    date: string
  }

  // let minedBlocks: Array<MinedBlock> = [
    // {
    //   hash: '00000000df47bd925f',
    //   date: new Date(Date.now() - 60 * 1000),
    //   reward: 5,
    // },
    // {
    //   hash: '0000000008afeec166',
    //   date: new Date(Date.now() - 60 * 60 * 1000),
    //   reward: 5,
    // },
    // {
    //   hash: '0000000027999560b9',
    //   date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    //   reward: 5,
    // },
  // ]

  const [minedBlocks, setMinedBlocks] = useState<Array<MinedBlock>>([]);
  const [balance, setBalance] = useState<string>('0');

  const toggleMining = () => {
    setIsMining((prev) => !prev)
  }

  useEffect(() => {
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

    const fetchTransactions = async () => {
        try {
          // const response = await fetch('https://api.example.com/data');
          const transactions = await getTransactions();
          // let disptrans = [];
          // for (let i=0; i<transactions.length; i++) {
            // if (transactions[i].category == "generate") {
              // let minedBlock = {
              //   hash: transactions[i].blockhash,
              //   date: transactions[i].time,
              // }
              // disptrans.push(transactions[i]);
            // }
          // }
          setMinedBlocks(transactions);
          // minedBlocks = transactions
          // const result = await response.json();
          // setData(result);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
          
    };

    fetchWalletBalance();
    fetchTransactions();
  }, []); // Empty depend

  useEffect(() => {
    sessionStorage.setItem('isMining', String(isMining))

    // const balance = await getWalletBalance();
    // setBalance(balance);
    // setBalance
    // startMining()
    let timer: NodeJS.Timeout
    if (isMining) {
      startMining();
      timer = setInterval(() => {
        setCurrentSessionDuration((prev) => prev + 1)
      }, 1000)
    } else {
      stopMining();
    }

    return () => clearInterval(timer)
  }, [isMining])

  useEffect(() => {
    sessionStorage.setItem('currentSessionDuration', String(currentSessionDuration))

    if (currentSessionDuration % 5 === 0 && currentSessionDuration > 0) {
      sessionStorage.setItem('blocksMined', String(blocksMined))
      localStorage.setItem('balance', String(balance))
      setBlocksMined((prev) => prev)
      setBalance((prev) => prev)
      // setMineHistory((prev) => [{ hash: generateRandomHash(), date: new Date(), reward: 5 }, ...prev])
    }
  }, [currentSessionDuration])

  useEffect(() => {
    const fetchHashRate = async () => {
      console.log(isMining);
      if (isMining) {
        const rate = await getHashRate();
        setHashRate(rate);
        const balance = await getWalletBalance();
        setBalance(balance);
        const transactions = await getTransactions();
        setMinedBlocks(transactions);
      } else {
        console.log("off");
        setHashRate('0');
      }
    }
    const intervalId = setInterval(fetchHashRate, 2000);

    return () => clearInterval(intervalId);
  }, [isMining]);


  function generateRandomHash(length: number = 10): string {
    const characters = 'abcdef0123456789'
    let hash = ''

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length)
      hash += characters[randomIndex]
    }

    return `00000000${hash}`
  }

  function timeFormat(duration: number): string {
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = Math.floor(duration % 60)

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  async function getTransactions(): Promise<Array<MinedBlock>> {
    // const transrpc = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "listtransactions", params: []}, {
    //   auth: {
    //     username: 'user',
    //     password: 'password'
    //   },
    //   headers: {
    //     'Content-Type': 'text/plain;',
    //   },
    // });
    // let transactions = transrpc.data.result;
    let transactions = await window.versions.getTransactions();
    let disptrans: Array<MinedBlock> = [];
    console.log(transactions);
    let mineCount = 0
    for (let i=0; i<transactions.length; i++) {
      if (transactions[i].category == "generate") {
        let minedBlock = {
          hash: transactions[i].blockhash,
          date: new Date(transactions[i].time * 1000).toLocaleTimeString() + " " + new Date(transactions[i].time * 1000).toLocaleDateString(),
        }
        console.log(minedBlock.date);
        disptrans.push(minedBlock);
        mineCount += 1;
        if (mineCount >= 5) {
          break;
        }
      }
    }
    // console.log(transrpc);
    console.log(disptrans);
    return disptrans;
  }

  async function getHashRate(): Promise<string> {
    const minerpc = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "gethashespersec", params: []}, {
      auth: {
        username: 'user',
        password: 'password'
      },
      headers: {
        'Content-Type': 'text/plain;',
      },
    });
    console.log(minerpc);
    return minerpc.data.result;
  }

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

  async function getMiningInfo(): Promise<string> {
    const minerpc = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "getmininginfo", params: []}, {
      auth: {
        username: 'user',
        password: 'password'
      },
      headers: {
        'Content-Type': 'text/plain;',
      },
    });
    console.log(minerpc);
    const result = minerpc.data.result;
    const blocks = result.blocks;
    const curblocksz = result.currentblocksize;
    const curblocktx = result.currentblocktx;
    const hashpersec = result.hashespersec;
    const nethasps = result.networkhashps;
    return minerpc.data.result;
  }

  async function startMining() {
    const numblocks = 100;

    const minerpc = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "generate", params: [numblocks]}, {
      auth: {
        username: 'user',
        password: 'password'
      },
      headers: {
        'Content-Type': 'text/plain;',
      },
    });
    console.log(minerpc);
  }

  async function stopMining() {
    // const numblocks = 99999;

    const minerpc = await axios.post('http://localhost:8332/', {jsonrpc: '1.0', id: 1, method: "setgenerate", params: [false]}, {
      auth: {
        username: 'user',
        password: 'password'
      },
      headers: {
        'Content-Type': 'text/plain;',
      },
    });
    console.log(minerpc);
  }

  return (
    <div className="mining-container pl-10">
      <PageHeader name={'Mining'}/>
      <div className="flex flex-col items-center justify-center mt-10">
        <div>
          <img className={`w-64 h-64 mb-4 ${isMining ? 'animate-spin' : ''}`} src={Pickaxe} alt="Mining" />
        </div>
        <div className="mining-button">
          <button onClick={toggleMining} className="mt-2 p-2 bg-blue-500 text-white rounded">
            {!isMining ? 'Start Mining' : 'Stop Mining'}
          </button>
        </div>
        <div className="mt-5"> Current Session Length: {timeFormat(currentSessionDuration)}</div>
        <div className="stats-container grid grid-cols-3 gap-3 mt-10 mb-5">
          <div className="border p-3"> {blocksMined} Blocks Mined </div>
          <div className="border p-3"> Hashes Per Second: {hashRate}</div>
          <div className="border p-3"> Balance: {balance} WACO</div>
        </div>
        <div> Latest blocks </div>
        <ul style={{ height: '40%', overflowY: 'auto' }}>
          {minedBlocks.map((item) => (
            <li key={item.hash}>
              Block {item.hash.substring(0, 5) + '-' + item.hash.substring(item.hash.length-5, item.hash.length)} mined at {item.date} for a reward of {50} WACO
            </li>
          ))}
        </ul>
        <button 
          onClick={() => navigate("/mining-history")}
          className='border m-2 p-1'
        > 
          Show all blocks 
        </button>
      </div>
    </div>
  )
}

export default MiningPage
