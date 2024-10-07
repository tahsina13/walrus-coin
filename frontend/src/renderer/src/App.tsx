import React, { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import SignInLogIn from './components/SignInLogIn';
import Sidebar from './components/Sidebar'
import StatusPage from './components/StatusPage'
import FilesPage from './components/FilesPage'
import TransactionsPage from './components/TransactionsPage';
import Explorepage from './components/ExplorePage'
import PeersPage from './components/PeersPage'
import AccountPage from './components/AccountPage'
{/* Add the pages */}

function App(): JSX.Element {
// const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const location = useLocation();
  const isSignInPage = location.pathname === '/sign-in';

  return (
    <div style={{backgroundColor: "#f6eedd"}} className='flex min-h-screen'>
      {!isSignInPage && <Sidebar />}
      <div className='flex-1'>
        <Routes>
            <Route path='/sign-in' element={<SignInLogIn />} />
            <Route path='/status' element={<StatusPage />} />
            <Route path='/files' element={<FilesPage />} />
            <Route path='/transactions' element={<TransactionsPage />} />
            <Route path='/explore' element={<Explorepage />} />
            <Route path='/peers' element={<PeersPage />} />
            <Route path='/account' element={<AccountPage />} />
          {/* Add the pages */}
          <Route path='*' element={<Navigate to="/sign-in" />} />
        </Routes>
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