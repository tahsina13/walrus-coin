import React, { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import SignInLogIn from './components/SignInLogIn';
import RegisterPage from './components/RegisterPage';
import Sidebar from './components/Sidebar'
import StatusPage from './components/StatusPage'
import FilesPage from './components/FilesPage'
import TransactionsPage from './components/TransactionsPage';
import Explorepage from './components/ExplorePage'
import PeersPage from './components/PeersPage'
import MiningPage from './components/MiningPage';
import {AccountPage} from './components/AccountPage'
import Profile from './components/Profile';
import ProxyPage from'./components/ProxyPage';
{/* Add the pages */}

function App(): JSX.Element {
// const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const location = useLocation();
  const isSignInPage = location.pathname === '/sign-in';
  const isRegisterPage = location.pathname === '/register';

  return (
    <div className='flex'>
      {!isSignInPage && !isRegisterPage && <Sidebar />}
      <div className='menu-options w-screen'>
        <Routes>
            <Route path='/sign-in' element={<SignInLogIn />} />
            <Route path='/register' element={<RegisterPage />} />
            <Route path='/status' element={<StatusPage />} />
            <Route path='/proxy' element={<ProxyPage />} />
            <Route path='/files' element={<FilesPage />} />
            <Route path='/transactions' element={<TransactionsPage />} />
            <Route path='/explore' element={<Explorepage />} />
            <Route path='/peers' element={<PeersPage />} />
            <Route path='/mining' element={<MiningPage />} />
            <Route path='/account' element={<AccountPage />} />
           {/* Add the pages */}
          <Route path='*' element={<Navigate to="/sign-in" />} />
        </Routes>
      </div>
      <div className="flex justify-end items-top">
        {!isSignInPage && !isRegisterPage &&<Profile/>}
      </div>
    </div>
  );
}

// Wrap App in Router to enable routing
const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
);

export default AppWithRouter;