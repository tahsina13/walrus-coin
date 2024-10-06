import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Homepage from './components/Homepage'
import Versions from './components/Versions'
{/* Add the pages */}

function App(): JSX.Element {
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')
  
  return (
    <Router>
      <div className='flex min-h-screen'>
        <Sidebar />
        <div>
          <Routes>
            <Route path='/status' element={<Homepage />} />
            <Route path='/files' element={<Versions />} />
            {/* Add the pages */}
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
