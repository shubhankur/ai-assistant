'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function NavBar() {
  const [name, setName] = useState<string>('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('http://localhost:5005/auth/validate', { credentials: 'include' })
        if (res.ok) {
          const u = await res.json()
          setName(u.name)
        }
      } catch (e) {
        /* ignore */
      }
    }
    fetchUser()
  }, [])

  const handleSignOut = async () => {
    await fetch('http://localhost:5005/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.assign('/')
  }

  return (
    <nav className="bg-black text-white p-4 flex items-center justify-between relative">
      <button className="font-bold text-lg" onClick={() => window.location.assign('/')}>Ease In</button>
      <button className="lg:hidden" onClick={() => setOpen(!open)}>
        &#9776;
      </button>
      <ul className={`lg:flex gap-4 ${open ? 'block' : 'hidden'} lg:static lg:bg-transparent absolute right-4 top-full bg-black rounded-md py-2`}>
        {name && <li className="px-4 py-2 border-b lg:border-none">{name}</li>}
        <li className="px-4 py-2 lg:p-0"><Link href="/about">About</Link></li>
        <li className="px-4 py-2 lg:p-0"><Link href="/privacy">Privacy Policy</Link></li>
        <li className="px-4 py-2 lg:p-0"><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a></li>
        <li className="px-4 py-2 lg:p-0"><button onClick={handleSignOut}>Sign Out</button></li>
      </ul>
    </nav>
  )
}
