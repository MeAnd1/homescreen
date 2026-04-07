import { useState } from 'react'
import './App.css'
import background from './assets/background.webp'
import DesktopIcons from './components/DesktopIcons/DesktopIcons'
import CharacterList from './components/CharacterList/CharacterList'
import Taskbar from './components/Taskbar/Taskbar'

export interface OcEntry {
  name: string;
  avatar?: string;
}

function App() {
  const [showCharacters, setShowCharacters] = useState(false)
  const [selectedCharacters, setSelectedCharacters] = useState<OcEntry[]>([])

  const toggleCharacter = (oc: OcEntry) => {
    setSelectedCharacters(prev => {
      const exists = prev.some(c => c.name === oc.name)
      if (exists) return prev.filter(c => c.name !== oc.name)
      return [...prev, oc]
    })
  }

  return (
    <div
      className="app"
      style={{ backgroundImage: `url(${background})` }}
    >
      <DesktopIcons onIconClick={(name) => {
        if (name === 'Characters') setShowCharacters(true)
      }} />
      {showCharacters && (
        <CharacterList
          onClose={() => setShowCharacters(false)}
          selectedCharacters={selectedCharacters}
          onToggleCharacter={toggleCharacter}
        />
      )}
      <Taskbar selectedCharacters={selectedCharacters} />
    </div>
  )
}

export default App
