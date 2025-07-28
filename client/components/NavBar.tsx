'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function NavBar() {
  const [name, setName] = useState<string>('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/user=([^;]+)/)
      if (match) {
        try {
          const u = JSON.parse(decodeURIComponent(match[1]))
          setName(u.name)
        } catch (e) {
          /* ignore */
        }
      }
    }
  }, [])

  return (
    <nav className="bg-black text-white p-4 flex items-center justify-between">
      <div className="font-bold text-lg">Ease In</div>
      <button className="lg:hidden" onClick={() => setOpen(!open)}>
        &#9776;
      </button>
      <ul className={`lg:flex gap-4 ${open ? 'block' : 'hidden'}`}>
        <li><Link href="/about">About</Link></li>
        <li><Link href="/privacy">Privacy Policy</Link></li>
        <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a></li>
        {name && <li>{name}</li>}
      </ul>
    </nav>
  )
}
