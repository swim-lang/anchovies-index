import { useEffect, useState } from 'react'
import { onSoundChange, setSound, soundOn } from '../motion/sound.js'

// Sound on/off, in the header. Remembered per visitor.
export default function SoundToggle() {
  const [on, setOn] = useState(soundOn())
  useEffect(() => onSoundChange(setOn), [])
  return (
    <button type="button" className="sound-toggle label" aria-pressed={on} onClick={() => setSound(!on)} title={on ? 'Sound on' : 'Sound off'}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
        {on ? (
          <path d="M15 9c1.2 1.6 1.2 4.4 0 6M17.6 6.5c2.6 3 2.6 8 0 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        ) : (
          <path d="M15.5 9.5l5 5M20.5 9.5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        )}
      </svg>
      <span className="sr-only">Sound {on ? 'on' : 'off'}</span>
    </button>
  )
}
