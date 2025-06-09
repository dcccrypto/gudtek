'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Lock, Shield } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

function AdminLoginForm() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('from') || '/admin/memes'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        toast({
          title: "Access Granted",
          description: "Welcome to GUD TEK Admin Panel",
        })
        router.push(returnUrl)
      } else {
        setError('Incorrect password. Access denied.')
      }
    } catch (error) {
      setError('Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 flex items-center justify-center p-4">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#000_1px,transparent_1px),linear-gradient(180deg,#000_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      <Card className="w-full max-w-md bg-white/95 backdrop-filter backdrop-blur-lg border-4 border-gray-900 shadow-2xl relative z-10">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center border-4 border-gray-900">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-black text-gray-900">
            GUD TEK Admin
          </CardTitle>
          <CardDescription className="text-gray-700 font-bold text-lg">
            Enter admin password to access the meme management panel
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-900 font-bold">
                Admin Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="pl-10 pr-12 border-2 border-gray-300 font-bold text-gray-900 bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert className="border-red-300 bg-red-50">
                <AlertDescription className="text-red-700 font-medium">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-orange-500 hover:bg-orange-600 border-2 border-gray-900 font-bold text-lg py-3 disabled:opacity-50"
            >
              {loading ? '🔐 Authenticating...' : '🚀 Access Admin Panel'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium underline"
            >
              ← Back to Main Site
            </Link>
          </div>

          {/* Development hint */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700 font-medium text-center">
                💡 Dev Mode: You can also access with URL param<br />
                <code>/admin/memes?password=GudTekAdmin2025!</code>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading admin login...</p>
        </div>
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  )
} 