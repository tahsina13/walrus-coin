import React, { useState } from 'react';
import MiningIcon from '../assets/image-1.png'
import Temp from '../assets/walrus-coin-icon.png';

function MiningPage(): JSX.Element {

    const [isMining, setIsMining] = useState(false);

    const toggleMining = () => {
        setIsMining((prev) => !prev);
    }

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
            </div>
        </div>
    );
};

export default MiningPage;
