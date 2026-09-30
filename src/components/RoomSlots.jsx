import Typewriter from './Typewriter.jsx'
import VendingMachine from './VendingMachine.jsx'

// The rooms beyond the fridge.
export function RoomVending({ active, onOpenProject }) {
  return <VendingMachine active={active} onOpenProject={onOpenProject} />
}
export function RoomTypewriter({ active }) {
  return <Typewriter active={active} />
}
