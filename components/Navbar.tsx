"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavItem {
  name: string
  href: string
}

export default function Navbar() {
  const [isNavOpen, setIsNavOpen] = useState(false)
  const pathname = usePathname()
  
  // Define the navigation items
  const navItems: NavItem[] = [
    { name: "Home", href: "/" },
    { name: "Game", href: "/game" },
    { name: "Announcements", href: "/announcements" },
    { name: "Memes", href: "/memes" },
    { name: "PFP", href: "/pfp" }
  ]
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsNavOpen(false)
  }, [pathname])

  // Check if current path matches nav item
  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="fixed left-0 right-0 top-0 bg-white/10 backdrop-filter backdrop-blur-lg z-50 shadow-lg border-b border-orange-400/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img
                src="/images/gudtek-logo.png"
                alt="Gud Tek Logo"
                className="h-8 w-8 rounded-full mr-2"
                width={32}
                height={32}
              />
              <span className="text-gray-900 font-black text-xl tracking-tight">GUD TEK</span>
            </Link>
          </div>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Main Navigation */}
            <div className="flex items-center space-x-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'text-gray-900 bg-white/20 font-bold' 
                      : 'text-gray-800 hover:text-gray-900 hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Mobile Nav Button */}
          <div className="flex md:hidden">
            <Button
              onClick={() => setIsNavOpen(!isNavOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-800 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-400 bg-transparent hover:bg-transparent"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {!isNavOpen ? (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <X className="block h-6 w-6" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${isNavOpen ? 'block' : 'hidden'} md:hidden`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/20 backdrop-filter backdrop-blur-lg border-t border-orange-400/30">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                isActive(item.href)
                  ? 'text-gray-900 bg-white/20 font-bold' 
                  : 'text-gray-800 hover:text-gray-900 hover:bg-white/10'
              }`}
              onClick={() => setIsNavOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
} 