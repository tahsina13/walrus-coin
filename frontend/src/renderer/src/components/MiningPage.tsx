import React, { useState, useEffect } from 'react';
import MiningIcon from '../assets/image-1.png'
import Temp from '../assets/walrus-coin-icon.png';

function MiningPage(): JSX.Element {

    const [isMining, setIsMining] = useState(false);
    const blockMineTime = 5 // Update with actual time
    const walletBalance = 10 // Update with actual balance
    const [nextBlockTime, setNextBlockTime] = useState(blockMineTime); // change value to be actual
    const [blocksMined, setBlocksMined] = useState(0);
    const [balance, setBalance] = useState(walletBalance);

    const toggleMining = () => {
        setIsMining((prev) => !prev);
    }

    useEffect(() => {
        let timer: NodeJS.Timeout;
        let timeLeft = nextBlockTime;
    
        if (isMining) {
            timer = setInterval(() => {
                if (timeLeft > 1) {
                    timeLeft -= 1;
                    setNextBlockTime(timeLeft);
                } else {
                    setBlocksMined((prevCount) => prevCount + 1);
                    setBalance((balance) => balance + 1);
                    timeLeft = blockMineTime;
                    setNextBlockTime(timeLeft);
                }
            }, 1000);
        }
    
        return () => clearInterval(timer);
    }, [isMining]);
    

    return (
        <div className="mining-container flex justify-center">
            <div className='flex flex-col items-center'>
                <div>
                    <img
                        className='w-64 h-64 mb-4 object-cover'
                        src={!isMining ? MiningIcon : Temp}
                        alt='Mining'
                    />
                </div>
                <div className="mining-button">
                    <button onClick={toggleMining} className='mt-2 p-2 bg-blue-500 text-white rounded'>
                        {!isMining ? 'Start Mining' : 'Stop Mining'}
                    </button>
                </div>
                <div className='mt-5'> Next Block in {nextBlockTime} seconds</div>
                <div className="w-full bg-gray-300 rounded-full h-5 mb-4">
                    <div
                        className="bg-blue-600 h-5 rounded-full transition-all"
                        style={{ width:`${((blockMineTime - nextBlockTime) / blockMineTime) * 100}%`}}
                    />
                </div>
                <div className="stats-container grid grid-cols-2 gap-10 p-10">
                    <div className='border p-3'> {blocksMined} Blocks Mined </div>
                    <div className='border p-3'> Balance: {balance} WACO</div>
                </div>
            </div>
        </div>
    );
};

export default MiningPage;
