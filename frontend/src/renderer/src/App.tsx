import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import StatusPage from './components/StatusPage'
import Versions from './components/Versions'
import FilesPage from './components/FilesPage'
import Explorepage from './components/ExplorePage'
import PeersPage from './components/PeersPage'
import AccountPage from './components/AccountPage'
{/* Add the pages */}

function App(): JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  
  return (
    <Router>
      <div style={{backgroundColor: "#f6eedd"}} className='flex min-h-screen'>
        <Sidebar />
        <div className='flex-1'>
          <Routes>
            <Route path='/status' element={<StatusPage />} />
            <Route path='/files' element={<FilesPage />} />
            <Route path='/explore' element={<Explorepage />} />
            <Route path='/peers' element={<PeersPage />} />
            <Route path='/account' element={<AccountPage />} />
            {/* Add the pages */}
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
