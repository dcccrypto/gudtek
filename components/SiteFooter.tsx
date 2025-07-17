"use client"

export default function SiteFooter() {
  return (
    <footer className="relative py-8 px-4 bg-white/20 backdrop-filter backdrop-blur-lg border-t-4 border-orange-400/50 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center">
        {/* Brand message */}
        <div className="flex items-center justify-center space-x-3 mb-4">
          <img
            src="/bonk1-bonk-logo.svg"
            alt="BONK Logo"
            className="w-8 h-8"
            width={32}
            height={32}
          />
          <p className="text-orange-700 font-bold text-lg">
            Built with passion for the future of DeFi. Gud Tek Forever 🧡
          </p>
        </div>

        {/* Social links */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <a
            href="https://x.com/gudtek_sol"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-white/20 hover:bg-white/40 border-2 border-orange-400 shadow-lg transition-all duration-200 hover:scale-110"
            title="Follow us on X"
          >
            <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <a
            href="https://www.tiktok.com/@gudteksolana"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-white/20 hover:bg-white/40 border-2 border-orange-400 shadow-lg transition-all duration-200 hover:scale-110"
            title="Follow us on TikTok"
          >
            <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.94,1.61V15.78a2.83,2.83,0,0,1-2.83,2.83h0a2.83,2.83,0,0,1-2.83-2.83h0a2.84,2.84,0,0,1,2.83-2.84h0V9.17h0A6.61,6.61,0,0,0,3.5,15.78h0a6.61,6.61,0,0,0,6.61,6.61h0a6.61,6.61,0,0,0,6.61-6.61V9.17l.2.1a8.08,8.08,0,0,0,3.58.84h0V6.33l-.11,0a4.84,4.84,0,0,1-3.67-4.7H12.94Z" />
            </svg>
          </a>

          <a
            href="https://t.me/gudteksolana"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-full bg-white/20 hover:bg-white/40 border-2 border-orange-400 shadow-lg transition-all duration-200 hover:scale-110"
            title="Join our Telegram"
          >
            <svg className="w-5 h-5 text-gray-800" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
          </a>
        </div>

        <div className="text-gray-700 text-sm space-y-2">
          <p>© 2025 Gud Tek. All rights reserved.</p>
          <p>
            <strong>Disclaimer:</strong> Cryptocurrency investments carry risk. Please do your own research before investing.
          </p>
        </div>
      </div>
    </footer>
  )
} 