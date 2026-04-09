import { useState } from 'react'
import './App.css'
import background from './assets/background.webp'
import DesktopIcons from './components/DesktopIcons/DesktopIcons'
import CharacterList from './components/CharacterList/CharacterList'
import CharacterProfile from './components/CharacterProfile/CharacterProfile'
import Taskbar from './components/Taskbar/Taskbar'

export interface OcEntry {
  slug: string;
  name: string;
  avatar?: string;
  images?: string[];
}

function App() {
  const [showCharacters, setShowCharacters] = useState(false)
  const [selectedCharacters, setSelectedCharacters] = useState<OcEntry[]>([])
  const [openProfiles, setOpenProfiles] = useState<OcEntry[]>([])

  const toggleCharacter = (oc: OcEntry) => {
    setSelectedCharacters(prev => {
      const exists = prev.some(c => c.slug === oc.slug)
      if (exists) return prev.filter(c => c.slug !== oc.slug)
      return [...prev, oc]
    })
  }

  const openCharacterProfile = (oc: OcEntry) => {
    setOpenProfiles(prev => {
      if (prev.some(c => c.slug === oc.slug)) return prev
      return [...prev, oc]
    })
  }

  const closeCharacterProfile = (slug: string) => {
    setOpenProfiles(prev => prev.filter(c => c.slug !== slug))
    setSelectedCharacters(prev => prev.filter(c => c.slug !== slug))
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
          onOpenProfile={openCharacterProfile}
        />
      )}
      {openProfiles.map(oc => (
        <CharacterProfile
          key={oc.slug}
          oc={oc}
          onClose={() => closeCharacterProfile(oc.slug)}
        />
      ))}
      <Taskbar selectedCharacters={selectedCharacters} />
    </div>
  )
}

export default App
