import React, { Link } from 'react-router-dom';
import StatusIcon from '../assets/status-icon.png';
import FilesIcon from '../assets/file-text.svg';
import TransactionsIcon from '../assets/transactions-icon.png'
import ExploreIcon from "../assets/icon.svg";
import PeersIcon from '../assets/peers-icon.png';
import MiningIcon from '../assets/mining-icon.png'
import AccountIcon from '../assets/avatar.png';
import WalrusCoinLogo from '../assets/walrus-coin-icon.png';

function Sidebar(): JSX.Element {
    
    const menuItems = [
        { label: 'Status', icon: StatusIcon, path: '/status' },
        { label: 'Files', icon: FilesIcon, path: '/files' },
        { label: 'Transactions', icon: TransactionsIcon, path: '/transactions' },
        { label: 'Explore', icon: ExploreIcon, path: '/explore' },
        { label: 'Peers', icon: PeersIcon, path: '/peers' },
        { label: 'Mine', icon: MiningIcon, path: '/mining' },
        { label: 'Account', icon: AccountIcon, path: '/account' },
    ];

    return (
        <div style={{ backgroundColor: '#997777' }} className="w-1/5 min-h-screen flex-col flex items-center">
            <div className="flex justify-center p-4 mt-8">
                <img src={WalrusCoinLogo} alt="WalrusCoin" className="w-20 h-20" />
            </div>
            <ul className='mt-4 space-y-8 w-full'>
                {menuItems.map((item, index) => (
                    <li key={index} className='menu-item items-center'>
                        <Link to={item.path} className='flex items-center space-x-4 duration-300 hover:bg-yellow-900 py-3'>
                            {item.icon && (
                                <span>
                                    <img src={item.icon} alt={`${item.label}`} className='w-8 h-8 ml-4' />
                                </span>
                            )}
                            <span className="text-white text-lg">{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Sidebar;