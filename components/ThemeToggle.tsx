'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('theme') ?? 'dark'
    setIsDark(saved === 'dark')
  }, [])

  const toggle = () => {
    const next = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('theme', next)
    document.documentElement.dataset.theme = next
  }

  return (
    <button
      className="pixel-btn pixel-btn-gray"
      onClick={toggle}
      style={{ fontSize: '10px', padding: '7px 10px', flexShrink: 0 }}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀' : '☽'}
    </button>
  )
}
