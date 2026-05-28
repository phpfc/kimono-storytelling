import './main.scss'
import Slider from "./components.tsx/Slider"

function App() {
  return (
    <>
      <Slider slides={[<p>hi</p>, <p>hello</p>, <p>wazza</p>]} />
    </>
  )
}

export default App
