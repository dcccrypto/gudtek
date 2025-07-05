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
    { name: "Games", href: "/games" },
    { name: "Memes", href: "/memes" },
    { name: "GudMusic", href: "/music" },
    { name: "GUD AI", href: "/pfp" },
    { name: "Utility", href: "/utility" }
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
            
            {/* Social Media Links */}
            <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-orange-400/30">
              {/* X/Twitter */}
              <a
                href="https://x.com/gudtek_solana"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-gray-800 hover:text-gray-900 hover:bg-white/10 transition-colors duration-200"
                title="Follow us on X"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              
              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@gudteksolana"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-gray-800 hover:text-gray-900 hover:bg-white/10 transition-colors duration-200"
                title="Follow us on TikTok"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12.94,1.61V15.78a2.83,2.83,0,0,1-2.83,2.83h0a2.83,2.83,0,0,1-2.83-2.83h0a2.84,2.84,0,0,1,2.83-2.84h0V9.17h0A6.61,6.61,0,0,0,3.5,15.78h0a6.61,6.61,0,0,0,6.61,6.61h0a6.61,6.61,0,0,0,6.61-6.61V9.17l.2.1a8.08,8.08,0,0,0,3.58.84h0V6.33l-.11,0a4.84,4.84,0,0,1-3.67-4.7H12.94Z"/>
                </svg>
              </a>
              
              {/* Telegram */}
              <a
                href="https://t.me/gudteksolana"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-gray-800 hover:text-gray-900 hover:bg-white/10 transition-colors duration-200"
                title="Join our Telegram"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
              </a>
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
          
          {/* Mobile Social Media Links */}
          <div className="flex items-center justify-center space-x-4 pt-4 mt-4 border-t border-orange-400/30">
            {/* X/Twitter */}
            <a
              href="https://x.com/gudtek_solana"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-md text-gray-800 hover:text-gray-900 hover:bg-white/10 transition-colors duration-200"
              title="Follow us on X"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            
            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@gudteksolana"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-md text-gray-800 hover:text-gray-900 hover:bg-white/10 transition-colors duration-200"
              title="Follow us on TikTok"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12.94,1.61V15.78a2.83,2.83,0,0,1-2.83,2.83h0a2.83,2.83,0,0,1-2.83-2.83h0a2.84,2.84,0,0,1,2.83-2.84h0V9.17h0A6.61,6.61,0,0,0,3.5,15.78h0a6.61,6.61,0,0,0,6.61,6.61h0a6.61,6.61,0,0,0,6.61-6.61V9.17l.2.1a8.08,8.08,0,0,0,3.58.84h0V6.33l-.11,0a4.84,4.84,0,0,1-3.67-4.7H12.94Z"/>
              </svg>
            </a>
            
            {/* Telegram */}
            <a
              href="https://t.me/gudteksolana"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-md text-gray-800 hover:text-gray-900 hover:bg-white/10 transition-colors duration-200"
              title="Join our Telegram"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
} 