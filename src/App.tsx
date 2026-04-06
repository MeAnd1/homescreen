import './App.css'
import background from './assets/background.webp'
import DesktopIcons from './components/DesktopIcons/DesktopIcons'
import Taskbar from './components/Taskbar/Taskbar'

function App() {
  return (
    <div
      className="app"
      style={{ backgroundImage: `url(${background})` }}
    >
      <DesktopIcons />
      <Taskbar />
    </div>
  )
}

export default App
