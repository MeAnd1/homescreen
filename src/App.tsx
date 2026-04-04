import './App.css'
import background from './assets/background.webp'

function App() {
  return (
    <div
      className="app"
      style={{ backgroundImage: `url(${background})` }}
    />
  )
}

export default App
