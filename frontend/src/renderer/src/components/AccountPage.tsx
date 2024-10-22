import { useState, useEffect } from 'react'
import { PageHeader } from '../components/Components'
import { useNavigate } from 'react-router-dom'

function AccountPage(): JSX.Element {
  const [defaultFileCost, setDefaultFileCost] = useState<number | string>(() => {
    const defaultFileCost = localStorage.getItem('defaultFileCost')
    if (defaultFileCost) {
      return defaultFileCost
    }
    return 1
  })
  const navigate = useNavigate()
  const [address, setAddress] = useState<string>('aweproi328234923')
  const [showPasswordFields, setShowPasswordFields] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState('')
  const [nodeID, setNodeID] = useState(() => {
    const nodeID = localStorage.getItem('nodeID')
    if (nodeID) {
      return nodeID
    }
    return '123456'
  })
  const [newIDSuccess, setnewIDSuccess] = useState(false)

  useEffect(() => {
    localStorage.setItem('defaultFileCost', defaultFileCost.toString())
  }, [defaultFileCost])

  const handleLogout = () => {
    console.log('Logged out')
    sessionStorage.clear()
    navigate('/sign-in')
  }

  function changeSBUID(){
    localStorage.setItem('nodeID', nodeID)
    setnewIDSuccess(true)
  }

  const handlePasswordChange = () => {
    setError('')
    // const storedCurrentPassword = 'myCorrectPassword';

    // if (currentPassword !== storedCurrentPassword) {
    //   setError('Incorrect current password.');
    //   return;
    // }

    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match.')
      return
    }

    // Simulate password update (you would send a request to your server here)
    console.log('Password successfully changed')
    setError('Password successfully changed!')
  }

  return (
    <div className="container flex flex-col h-screen pl-10">
      <PageHeader name={'Account'} />
      <div style={{ marginTop: '50px' }}>
        <div style={{ display: 'inline' }}>Default file cost: </div>
        <input
          style={{
            width: defaultFileCost.toString().length + 'ch',
            display: 'inline',
            background: 'inherit',
            backgroundColor: 'lightgray',
            minWidth: '50px',
          }}
          value={defaultFileCost}
          onChange={(event) =>
            event.target.value == '.' ? setDefaultFileCost(parseFloat(event.target.value)) : setDefaultFileCost(event.target.value)
          }
          type="number"
        ></input>
        <div>
          Current Address: <span style={{ backgroundColor: 'lightgray', cursor: 'default' }}>{address}</span>
        </div>

        <div style={{ display: 'inline' }}>SBU ID: </div>
        <input
          style={{
            width: nodeID.length + 'ch',
            display: 'inline',
            background: 'inherit',
            backgroundColor: 'lightgray',
            minWidth: '50px',
          }}
          value={nodeID}
          onChange={(event) => setNodeID(event.target.value)}
          type="text"
        ></input>
        <button onClick={changeSBUID} style={{ display: 'inline', marginLeft: '10px', backgroundColor: 'lightblue' }}>Set New ID</button>
        {newIDSuccess && <div style={{ color: 'green', marginTop: '10px' }}>ID successfully changed!</div>}

        <button
          className="logout-button"
          style={{ background: 'lightblue', display: 'block', marginTop: '50px', width: '300px' }}
          onClick={() => setShowPasswordFields(!showPasswordFields)}
        >
          Change Password
        </button>

        {showPasswordFields && (
          <div style={{ marginTop: '20px' }}>
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ display: 'block', marginBottom: '10px', width: '300px', backgroundColor: 'lightgray' }}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ display: 'block', marginBottom: '10px', width: '300px', backgroundColor: 'lightgray' }}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              style={{ display: 'block', marginBottom: '10px', width: '300px', backgroundColor: 'lightgray' }}
            />
            <button style={{ background: 'lightgreen', display: 'block', marginTop: '10px', width: '300px' }} onClick={handlePasswordChange}>
              Submit
            </button>

            {error && <div style={{ color: error === 'Password successfully changed!' ? 'green' : 'red', marginTop: '10px' }}>{error}</div>}
          </div>
        )}

        <button
          className="logout-button"
          style={{ background: 'lightblue', display: 'block', marginTop: '50px', width: '100px' }}
          onClick={handleLogout}
        >
          Logout
        </button>

        <button
          className="logout-button"
          style={{ background: 'lightblue', display: 'block', marginTop: '50px', width: '300px' }}
          onClick={()=>{
            localStorage.clear()
            handleLogout()}}
        >
          Reset(testing)
        </button>
      </div>
    </div>
  )
}

export default AccountPage
