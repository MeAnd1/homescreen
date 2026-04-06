import { useState } from 'react'
import './App.css'
import background from './assets/background.webp'
import DesktopIcons from './components/DesktopIcons/DesktopIcons'
import FileExplorer from './components/FileExplorer/FileExplorer'
import Taskbar from './components/Taskbar/Taskbar'

function App() {
  const [showCharacters, setShowCharacters] = useState(false)

  return (
    <div
      className="app"
      style={{ backgroundImage: `url(${background})` }}
    >
      <DesktopIcons onIconClick={(name) => {
        if (name === 'Characters') setShowCharacters(true)
      }} />
      {showCharacters && <FileExplorer onClose={() => setShowCharacters(false)} />}
      <Taskbar />
    </div>
  )
}

export default App
