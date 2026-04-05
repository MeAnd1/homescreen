import './App.css'
import background from './assets/background.webp'
import Taskbar from './components/Taskbar/Taskbar'

function App() {
  return (
    <div
      className="app"
      style={{ backgroundImage: `url(${background})` }}
    >
      <Taskbar />
    </div>
  )
}

export default App
