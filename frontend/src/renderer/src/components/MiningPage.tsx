import { useState, useEffect } from 'react'
import Pickaxe from '../assets/pickaxe.png'

function MiningPage(): JSX.Element {
  const [isMining, setIsMining] = useState<boolean>(() => {
    const savedMiningState = sessionStorage.getItem('isMining')
    return savedMiningState === 'true'
  })
  const [blocksMined, setBlocksMined] = useState<number>(() => {
    const savedBlocksMined = sessionStorage.getItem('blocksMined')
    return savedBlocksMined ? parseInt(savedBlocksMined) : 0
  })
  const [balance, setBalance] = useState<number>(() => {
    const savedBalance = localStorage.getItem('balance')
    return savedBalance ? parseInt(savedBalance) : 10
  })
  const [currentSessionDuration, setCurrentSessionDuration] = useState<number>(() => {
    const savedSessionDuration = sessionStorage.getItem('currentSessionDuration')
    return savedSessionDuration ? parseInt(savedSessionDuration) : 0
  })

  type MinedBlock = {
    hash: string
    date: Date
    reward: number
  }

  const minedBlocks: MinedBlock[] = [
    {
      hash: '00000000df47bd925f',
      date: new Date(Date.now() - 60 * 1000),
      reward: 5,
    },
    {
      hash: '0000000008afeec166',
      date: new Date(Date.now() - 60 * 60 * 1000),
      reward: 5,
    },
    {
      hash: '0000000027999560b9',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      reward: 5,
    },
  ]

  const [mineHistory, setMineHistory] = useState<MinedBlock[]>(minedBlocks)

  const toggleMining = () => {
    setIsMining((prev) => !prev)
  }

  useEffect(() => {
    sessionStorage.setItem('isMining', String(isMining))
    let timer: NodeJS.Timeout
    if (isMining) {
      timer = setInterval(() => {
        setCurrentSessionDuration((prev) => prev + 1)
      }, 1000)
    }

    return () => clearInterval(timer)
  }, [isMining])

  useEffect(() => {
    sessionStorage.setItem('currentSessionDuration', String(currentSessionDuration))

    if (currentSessionDuration % 5 === 0 && currentSessionDuration > 0) {
      sessionStorage.setItem('blocksMined', String(blocksMined + 1))
      localStorage.setItem('balance', String(balance + 5))
      setBlocksMined((prev) => prev + 1)
      setBalance((prev) => prev + 5)
      setMineHistory((prev) => [{ hash: generateRandomHash(), date: new Date(), reward: 5 }, ...prev])
    }
  }, [currentSessionDuration])

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

  return (
    <div className="mining-container flex justify-center mt-10">
      <div className="flex flex-col items-center">
        <div>
          <img className={`w-64 h-64 mb-4 ${isMining ? 'animate-spin' : ''}`} src={Pickaxe} alt="Mining" />
        </div>
        <div className="mining-button">
          <button onClick={toggleMining} className="mt-2 p-2 bg-blue-500 text-white rounded">
            {!isMining ? 'Start Mining' : 'Stop Mining'}
          </button>
        </div>
        <div className="mt-5"> Current Session Length: {timeFormat(currentSessionDuration)}</div>
        <div className="stats-container grid grid-cols-2 gap-10 p-10">
          <div className="border p-3"> {blocksMined} Blocks Mined </div>
          <div className="border p-3"> Balance: {balance} WACO</div>
        </div>
        <ul style={{ height: '40%', overflowY: 'auto' }}>
          {mineHistory.map((item) => (
            <li key={item.hash}>
              Block {item.hash} mined at {item.date.toLocaleString()} for a reward of {item.reward} WACO
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default MiningPage
