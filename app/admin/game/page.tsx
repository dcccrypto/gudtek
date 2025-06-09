'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Users, 
  Trophy, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
  TrendingUp,
  Activity
} from 'lucide-react'

interface GameStats {
  totalUsers: number
  totalGames: number
  todayGames: number
  highestScore: number
}

interface GameSettings {
  min_token_balance: string
  game_enabled: string
  max_score_per_session: string
  leaderboard_size: string
  token_contract_address: string
  daily_game_limit: string
}

interface GameUser {
  id: string
  wallet_address: string
  username?: string
  token_balance: number
  is_verified: boolean
  is_banned: boolean
  created_at: string
}

interface GameSession {
  id: string
  wallet_address: string
  score: number
  duration_ms: number
  tokens_collected: number
  obstacles_hit: number
  is_valid: boolean
  created_at: string
}

export default function GameAdminPage() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<GameStats>({
    totalUsers: 0,
    totalGames: 0,
    todayGames: 0,
    highestScore: 0
  })
  
  const [settings, setSettings] = useState<GameSettings>({
    min_token_balance: '1000',
    game_enabled: 'true',
    max_score_per_session: '10000',
    leaderboard_size: '100',
    token_contract_address: '5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk',
    daily_game_limit: '50'
  })
  
  const [users, setUsers] = useState<GameUser[]>([])
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      // Load stats, settings, users, and sessions in parallel
      const [statsRes, settingsRes, usersRes, sessionsRes] = await Promise.all([
        fetch('/api/admin/game/stats'),
        fetch('/api/admin/game/settings'),
        fetch('/api/admin/game/users'),
        fetch('/api/admin/game/sessions?limit=50')
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        const settingsMap: GameSettings = {} as GameSettings
        settingsData.settings?.forEach((setting: any) => {
          settingsMap[setting.setting_key as keyof GameSettings] = setting.setting_value
        })
        setSettings(settingsMap)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData.users || [])
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json()
        setSessions(sessionsData.sessions || [])
      }
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: string, value: string) => {
    try {
      const response = await fetch('/api/admin/game/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })

      if (response.ok) {
        setSettings(prev => ({ ...prev, [key]: value }))
      } else {
        alert('Failed to update setting')
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      alert('Error updating setting')
    }
  }

  const banUser = async (walletAddress: string, banned: boolean) => {
    try {
      const response = await fetch('/api/admin/game/ban-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, banned })
      })

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user.wallet_address === walletAddress 
            ? { ...user, is_banned: banned }
            : user
        ))
      } else {
        alert('Failed to update user status')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      alert('Error updating user status')
    }
  }

  const saveAllSettings = async () => {
    setSaving(true)
    try {
      for (const [key, value] of Object.entries(settings)) {
        await updateSetting(key, value)
      }
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Game Admin Panel
          </h1>
          <p className="text-lg text-white/90">
            Manage Token Dodge game settings, users, and analytics
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Games</p>
                  <p className="text-2xl font-bold text-white">{stats.totalGames}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Today's Games</p>
                  <p className="text-2xl font-bold text-white">{stats.todayGames}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-md bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Highest Score</p>
                  <p className="text-2xl font-bold text-white">{stats.highestScore}</p>
                </div>
                <Trophy className="w-8 h-8 text-white/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-md">
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-white/20">
              Settings
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-white/20">
              Users
            </TabsTrigger>
            <TabsTrigger value="sessions" className="text-white data-[state=active]:bg-white/20">
              Sessions
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-white/20">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card className="backdrop-blur-md bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Game Settings
                </CardTitle>
                <CardDescription className="text-white/70">
                  Configure game parameters and anti-cheat measures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white">Minimum Token Balance</Label>
                    <Input
                      type="number"
                      value={settings.min_token_balance}
                      onChange={(e) => setSettings(prev => ({ ...prev, min_token_balance: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Max Score Per Session</Label>
                    <Input
                      type="number"
                      value={settings.max_score_per_session}
                      onChange={(e) => setSettings(prev => ({ ...prev, max_score_per_session: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Daily Game Limit</Label>
                    <Input
                      type="number"
                      value={settings.daily_game_limit}
                      onChange={(e) => setSettings(prev => ({ ...prev, daily_game_limit: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Leaderboard Size</Label>
                    <Input
                      type="number"
                      value={settings.leaderboard_size}
                      onChange={(e) => setSettings(prev => ({ ...prev, leaderboard_size: e.target.value }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Token Contract Address</Label>
                  <Input
                    value={settings.token_contract_address}
                    onChange={(e) => setSettings(prev => ({ ...prev, token_contract_address: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white font-mono"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Label className="text-white">Game Enabled</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={settings.game_enabled === 'true'}
                        onCheckedChange={(checked) => setSettings(prev => ({ ...prev, game_enabled: checked ? 'true' : 'false' }))}
                      />
                      <span className="text-white/80">
                        {settings.game_enabled === 'true' ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={saveAllSettings}
                    disabled={saving}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card className="backdrop-blur-md bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription className="text-white/70">
                  Manage players and their access permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-white font-medium">
                            {user.username || 'Anonymous'}
                          </p>
                          <p className="text-white/60 text-sm font-mono">
                            {user.wallet_address.slice(0, 8)}...{user.wallet_address.slice(-8)}
                          </p>
                          <p className="text-white/60 text-xs">
                            Balance: {user.token_balance.toLocaleString()} tokens
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.is_verified && (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                        
                        {user.is_banned ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive" className="bg-red-500/20 text-red-100">
                              <XCircle className="w-3 h-3 mr-1" />
                              Banned
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => banUser(user.wallet_address, false)}
                              className="border-green-500 text-green-400 hover:bg-green-500/20"
                            >
                              Unban
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => banUser(user.wallet_address, true)}
                            className="border-red-500 text-red-400 hover:bg-red-500/20"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Ban
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card className="backdrop-blur-md bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Sessions
                </CardTitle>
                <CardDescription className="text-white/70">
                  Monitor game sessions for suspicious activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="text-white font-medium font-mono">
                            {session.wallet_address.slice(0, 8)}...{session.wallet_address.slice(-8)}
                          </p>
                          <p className="text-white/60 text-sm">
                            Score: {session.score} • Tokens: {session.tokens_collected} • Duration: {Math.round(session.duration_ms / 1000)}s
                          </p>
                          <p className="text-white/60 text-xs">
                            {new Date(session.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {session.is_valid ? (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-100">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-500/20 text-red-100">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Flagged
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card className="backdrop-blur-md bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Game Analytics
                </CardTitle>
                <CardDescription className="text-white/70">
                  Game performance and security metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Security Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-white">
                        <span>Valid Sessions:</span>
                        <span>{sessions.filter(s => s.is_valid).length}/{sessions.length}</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Flagged Sessions:</span>
                        <span className="text-red-400">
                          {sessions.filter(s => !s.is_valid).length}
                        </span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Banned Users:</span>
                        <span className="text-red-400">
                          {users.filter(u => u.is_banned).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-white">
                        <span>Avg Score:</span>
                        <span>
                          {sessions.length > 0 
                            ? Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length)
                            : 0
                          }
                        </span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Avg Duration:</span>
                        <span>
                          {sessions.length > 0 
                            ? Math.round(sessions.reduce((acc, s) => acc + s.duration_ms, 0) / sessions.length / 1000)
                            : 0
                          }s
                        </span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Verified Players:</span>
                        <span className="text-green-400">
                          {users.filter(u => u.is_verified).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 