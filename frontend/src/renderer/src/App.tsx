import React from 'react'
import Versions from './components/Versions'
import Homepage from './components/Homepage'
import electronLogo from './assets/electron.svg'

function App(): JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <Homepage></Homepage>
      {/* <Versions></Versions> */}
    </>
  )
}

export default App
