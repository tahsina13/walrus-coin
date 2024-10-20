import React, { useState, useEffect } from 'react';
import Pickaxe from '../assets/pickaxe.png'

function MiningPage(): JSX.Element {

    const [isMining, setIsMining] = useState(false);
    const walletBalance = 10 // Update with actual balance
    const [blocksMined, setBlocksMined] = useState(0);
    const [balance, setBalance] = useState(walletBalance);
    const [currentSessionDuration, setCurrentSessionDuration] = useState(0);
    
    type MinedBlock = {
        hash: string,
        date: Date,
        reward: number
    }
    
    const minedBlocks: MinedBlock[] = [
        {
            hash: "00000000df47bd925f",
            date: new Date(Date.now() - 60 * 1000),
            reward: 5
        },
        {
            hash: "0000000008afeec166",
            date: new Date(Date.now() - 60 * 60 * 1000),
            reward: 5
        },
        {
            hash: "0000000027999560b9",
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            reward: 5
        }
    ]

    const [mineHistory, setMineHistory] = useState(minedBlocks);
    
    const toggleMining = () => {
        setIsMining((prev) => !prev);
    }

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isMining) {
            timer = setInterval(() => {
                setCurrentSessionDuration(prev => prev + 1);
            }, 1000);
        }
    
        return () => clearInterval(timer);
    }, [isMining]);

    useEffect(() => {
        if((currentSessionDuration) % 5 === 0 && currentSessionDuration > 0) {
            setBlocksMined(prev => prev + 1);
        }
    }, [currentSessionDuration])

    useEffect(() => {
        if(currentSessionDuration === 0)
            return;
        setBalance(prev => prev+5);
        setMineHistory(prev => [{hash: generateRandomHash(), date: new Date(), reward: 5}, ...prev])
    }, [blocksMined])
    
    function generateRandomHash(length: number = 10): string {
        const characters = 'abcdef0123456789'; // Hexadecimal characters
        let hash = '';
      
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          hash += characters[randomIndex];
        }
      
        return `00000000${hash}`; // Adding '0x' to mimic the look of a hash
      }


    return (
        <div className="mining-container flex justify-center mt-10">
            <div className='flex flex-col items-center'>
                <div>
                    <img
                        className={`w-64 h-64 mb-4 ${isMining ? 'animate-spin' : ''}`}
                        src={Pickaxe}
                        alt='Mining'
                    />
                </div>
                <div className="mining-button">
                    <button onClick={toggleMining} className='mt-2 p-2 bg-blue-500 text-white rounded'>
                        {!isMining ? 'Start Mining' : 'Stop Mining'}
                    </button>
                </div>
                <div className='mt-5'> Current Session Length: {currentSessionDuration} seconds</div>
                <div className="stats-container grid grid-cols-2 gap-10 p-10">
                    <div className='border p-3'> {blocksMined} Blocks Mined </div>
                    <div className='border p-3'> Balance: {balance} WACO</div>
                </div>
                <ul style={{height: '40%', overflowY: 'auto'}}>
                    {mineHistory.map((item) => <li>Block {item.hash} mined at {item.date.toLocaleString()} for a reward of {item.reward} WACO</li>)}
                </ul>
            </div>
        </div>
    );
};

export default MiningPage;
