import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TempIcon from '../assets/walrus-coin-icon.png';

function Profile(): JSX.Element {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const handleLogout = () => {
        // Add your logout logic here
        console.log('Logged out');
        navigate('/sign-in');
    };

    const toggleDropdown = () => {
        setDropdownOpen(prev => !prev);
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setDropdownOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative flex items-center m-5">
            <div className="flex items-center cursor-pointer absolute top-0 right-0" onClick={toggleDropdown}>
                <img 
                    src="https://via.placeholder.com/40" // Temp URL
                    alt="User Avatar"
                    className="w-10 h-10 rounded-full border border-gray-300"
                />
            </div>
            {dropdownOpen && (
                <div 
                    ref={dropdownRef}
                    className="absolute left-2 top-0 w-24 bg-white border border-gray-300 shadow-lg rounded-md z-10"
                >
                    <ul className="py-1">
                        <li className="px-4 py-2 text-gray-700 hover:bg-gray-200 cursor-pointer" onClick={handleLogout}>
                            Log Out
                        </li>
                        {/* Add more options as needed */}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Profile;
