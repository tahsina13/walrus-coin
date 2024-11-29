import React, { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom'
import SignInLogIn from './components/SignInLogIn'
import RegisterPage from './components/RegisterPage'
import Sidebar from './components/Sidebar'
import StatusPage from './components/StatusPage'
import FilesPage from './components/FilesPage'
import TransactionsPage from './components/TransactionsPage'
import Explorepage from './components/ExplorePage'
import MiningPage from './components/MiningPage'
import AccountPage from './components/AccountPage'
import ProxyPage from './components/ProxyPage'
import LoginPage from './components/LoginPage'
import FirstLoginPage from './components/FirstLoginPage'
{
  /* Add the pages */
}

function App(): JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  const location = useLocation()
  const isSignInPage = location.pathname === '/sign-in'
  const isRegisterPage = location.pathname === '/register'
  const isLoginPage = location.pathname === '/login'
  const isFirstLoginPage = location.pathname === '/firstLogin'

  return (
    <div className="flex">
      {!isSignInPage && !isRegisterPage && !isLoginPage && !isFirstLoginPage && <Sidebar />}
      <div className="menu-options w-screen">
        <Routes>
          <Route path="/sign-in" element={<SignInLogIn />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/firstLogin" element={<FirstLoginPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/proxy" element={<ProxyPage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/explore" element={<Explorepage />} />
          <Route path="/mining" element={<MiningPage />} />
          <Route path="/account" element={<AccountPage />} />
          {/* Add the pages */}
          <Route path="*" element={<Navigate to="/sign-in" />} />
        </Routes>
      </div>
    </div>
  )
}

// Wrap App in Router to enable routing
const AppWithRouter = () => (
  <Router>
    <App />
  </Router>
)

export default AppWithRouter
