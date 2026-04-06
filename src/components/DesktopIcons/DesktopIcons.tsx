import './DesktopIcons.css'

import charactersIcon from '../../assets/icons/characters.png'
import infectionsIcon from '../../assets/icons/infections.png'
import favouritesIcon from '../../assets/icons/favourites.png'
import meAndIIcon from '../../assets/icons/me-and-i.png'
import infoIcon from '../../assets/icons/info.png'
import mysteryIcon from '../../assets/icons/mystery.png'

const icons = [
  { name: 'Characters', src: charactersIcon },
  { name: 'Infections', src: infectionsIcon },
  { name: 'Favourites', src: favouritesIcon },
  { name: 'Me and I', src: meAndIIcon },
  { name: 'Info', src: infoIcon },
  { name: '???', src: mysteryIcon },
]

function DesktopIcons() {
  return (
    <div className="desktop-icons">
      {icons.map((icon) => (
        <button
          key={icon.name}
          className="desktop-icon"
          onClick={() => console.log(`Clicked: ${icon.name}`)}
        >
          <img src={icon.src} alt={icon.name} draggable={false} />
          <span className="desktop-icon-label">{icon.name}</span>
        </button>
      ))}
    </div>
  )
}

export default DesktopIcons
