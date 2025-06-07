'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Trophy, Calendar, Users, LogOut, Shield, Home } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Meme } from '@/lib/supabase'
import Link from 'next/link'

export default function AdminMemesPage() {
  const [memes, setMemes] = useState<Meme[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadMemes()
  }, [])

  const loadMemes = async () => {
    try {
      const response = await fetch('/api/admin/memes')
      const data = await response.json()
      setMemes(data)
    } catch (error) {
      console.error('Error loading memes:', error)
      toast({
        title: "Error",
        description: "Failed to load memes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateMemeStatus = async (memeId: string, status: 'approved' | 'rejected') => {
    setActionLoading(memeId)
    try {
      const response = await fetch('/api/admin/memes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memeId, status }),
      })

      if (!response.ok) throw new Error('Failed to update meme')

      toast({
        title: "Success",
        description: `Meme ${status} successfully`,
      })
      
      loadMemes() // Refresh the list
    } catch (error) {
      console.error('Error updating meme:', error)
      toast({
        title: "Error",
        description: "Failed to update meme",
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const createNewContest = async () => {
    try {
      const response = await fetch('/api/admin/contests', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to create contest')

      toast({
        title: "Success",
        description: "New weekly contest created!",
      })
    } catch (error) {
      console.error('Error creating contest:', error)
      toast({
        title: "Error",
        description: "Failed to create contest",
        variant: "destructive",
      })
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
      toast({
        title: "Logged Out",
        description: "You have been logged out successfully",
      })
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  const pendingMemes = memes.filter(meme => meme.status === 'pending')
  const approvedMemes = memes.filter(meme => meme.status === 'approved')
  const rejectedMemes = memes.filter(meme => meme.status === 'rejected')

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center border-2 border-gray-900">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">GUD TEK Admin Panel</h1>
                <p className="text-gray-600">Manage meme submissions and weekly contests</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-gray-300">
                  <Home className="w-4 h-4 mr-2" />
                  Main Site
                </Button>
              </Link>
              
              <Button onClick={createNewContest} className="bg-orange-500 hover:bg-orange-600">
                <Trophy className="w-4 h-4 mr-2" />
                New Contest
              </Button>
              
              <Button variant="outline" onClick={handleLogout} className="border-red-300 text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingMemes.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{approvedMemes.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{rejectedMemes.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memes.reduce((sum, meme) => sum + meme.votes_count, 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Memes Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Review ({pendingMemes.length})</h2>
          
          {pendingMemes.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No memes pending review</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingMemes.map((meme) => (
                <Card key={meme.id} className="group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{meme.title}</CardTitle>
                        <CardDescription>By: {meme.creator_wallet.slice(0, 8)}...</CardDescription>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <img
                        src={meme.image_url}
                        alt={meme.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/images/placeholder-meme.jpg'
                        }}
                      />
                    </div>
                    
                    {meme.description && (
                      <p className="text-sm text-gray-600 mb-4">{meme.description}</p>
                    )}
                    
                    <div className="text-xs text-gray-500 mb-4">
                      Submitted: {new Date(meme.created_at).toLocaleDateString()}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 hover:bg-green-50 hover:border-green-300 hover:text-green-600"
                        onClick={() => updateMemeStatus(meme.id, 'approved')}
                        disabled={actionLoading === meme.id}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {actionLoading === meme.id ? 'Loading...' : 'Approve'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                        onClick={() => updateMemeStatus(meme.id, 'rejected')}
                        disabled={actionLoading === meme.id}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        {actionLoading === meme.id ? 'Loading...' : 'Reject'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* All Memes Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">All Memes ({memes.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {memes.map((meme) => (
              <Card key={meme.id} className="group">
                <CardContent className="p-3">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img
                      src={meme.image_url}
                      alt={meme.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-meme.jpg'
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm truncate">{meme.title}</h3>
                    <Badge 
                      variant={meme.status === 'approved' ? 'default' : meme.status === 'rejected' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {meme.status}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    {meme.votes_count} votes • {new Date(meme.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 