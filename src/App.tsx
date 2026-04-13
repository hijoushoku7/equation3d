import './App.css'
import Header from './components/header'
import DrawFunction from './canvascomponents/drawfunction'

function App() {

  return (
    <>
      <Header />
      <div className="app-content" style={{ padding: '2rem' }}>
        <input type="text" placeholder='数式を入力してください' id='equation-input'></input>
      </div>
      <DrawFunction />
    </>
  )
}

export default App
