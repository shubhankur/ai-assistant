'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { SERVER_URL } from '@/utils/constants'

export default function NavBar() {
  const [name, setName] = useState<string>('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`${SERVER_URL}/auth/validate`, { credentials: 'include' })
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
    await fetch(`${SERVER_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
    window.location.assign('/')
  }

  return (
    <nav className="bg-black text-white p-4 flex items-center justify-between relative">
      <button className="font-bold text-lg" onClick={() => window.location.assign('/')}>Ease In</button>
      <button className="lg:hidden" onClick={() => setOpen(!open)}>
        &#9776;
      </button>
      <ul className={`lg:flex gap-4 overflow-hidden transition-all duration-500 ${open ? 'max-h-60' : 'max-h-0'} lg:max-h-full lg:block lg:static lg:bg-transparent absolute right-4 top-full bg-black rounded-md py-2`} style={{display: open ? 'block' : 'none'}}>
        {name && <li className="px-4 py-2 border-b lg:border-none">{name}</li>}
        <li className="px-4 py-2 lg:p-0"><Link href="/about">About</Link></li>
        <li className="px-4 py-2 lg:p-0"><Link href="/privacy">Privacy Policy</Link></li>
        <li className="px-4 py-2 lg:p-0"><a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a></li>
        {name && <li className="px-4 py-2 lg:p-0"><button onClick={handleSignOut}>Sign Out</button></li>}
      </ul>
    </nav>
  )
}
