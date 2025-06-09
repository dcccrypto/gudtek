"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Database, Upload, MessageSquare, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"
import Link from "next/link"
import { 
  supabase, 
  uploadAnnouncementImage, 
  createFeedback, 
  getAllFeedback,
  createAnnouncement,
  getAllAnnouncements
} from "@/lib/supabase"

export default function AdminDebug() {
  const [logs, setLogs] = useState<Array<{type: 'info' | 'success' | 'error', message: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [testFile, setTestFile] = useState<File | null>(null)
  const [testFeedback, setTestFeedback] = useState({
    name: 'Test User',
    email: 'test@example.com',
    subject: 'Test Feedback',
    message: 'This is a test feedback message.'
  })

  const addLog = (type: 'info' | 'success' | 'error', message: string) => {
    setLogs(prev => [...prev, { type, message }])
    console.log(`[${type.toUpperCase()}]`, message)
  }

  const clearLogs = () => setLogs([])

  const testSupabaseConnection = async () => {
    setIsLoading(true)
    addLog('info', 'Testing Supabase connection...')
    
    try {
      const { data, error } = await supabase.from('announcements').select('count').single()
      
      if (error) {
        addLog('error', `Supabase connection failed: ${error.message}`)
      } else {
        addLog('success', 'Supabase connection successful!')
      }
    } catch (error) {
      addLog('error', `Supabase connection error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testStorageBuckets = async () => {
    setIsLoading(true)
    addLog('info', 'Testing storage buckets...')
    
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets()
      
      if (error) {
        addLog('error', `Storage buckets error: ${error.message}`)
      } else {
        addLog('success', `Found ${buckets.length} storage buckets: ${buckets.map(b => b.name).join(', ')}`)
        
        // Test bucket policies
        for (const bucket of buckets) {
          try {
            const { data: files } = await supabase.storage.from(bucket.name).list('', { limit: 1 })
            addLog('success', `✓ ${bucket.name} bucket accessible`)
          } catch (bucketError) {
            addLog('error', `✗ ${bucket.name} bucket access failed`)
          }
        }
      }
    } catch (error) {
      addLog('error', `Storage buckets test error: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testImageUpload = async () => {
    if (!testFile) {
      addLog('error', 'No test file selected')
      return
    }

    setIsLoading(true)
    addLog('info', `Testing image upload: ${testFile.name}`)
    
    try {
      const result = await uploadAnnouncementImage(testFile, 'test-upload')
      addLog('success', `Image upload successful! URL: ${result.publicUrl}`)
      addLog('info', `File path: ${result.filePath}`)
    } catch (error) {
      addLog('error', `Image upload failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testFeedbackDatabase = async () => {
    setIsLoading(true)
    addLog('info', 'Testing feedback database operations...')
    
    try {
      // Test create feedback
      const newFeedback = await createFeedback(testFeedback)
      addLog('success', `Feedback created successfully! ID: ${newFeedback.id}`)
      
      // Test get all feedback
      const allFeedback = await getAllFeedback()
      addLog('success', `Retrieved ${allFeedback.length} feedback records`)
      
    } catch (error) {
      addLog('error', `Feedback database test failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testAnnouncementDatabase = async () => {
    setIsLoading(true)
    addLog('info', 'Testing announcement database operations...')
    
    try {
      // Test create announcement
      const testAnnouncement = {
        title: 'Test Announcement',
        message: 'This is a test announcement message.',
        type: 'info' as const,
        priority: 5
      }
      
      const newAnnouncement = await createAnnouncement(testAnnouncement)
      addLog('success', `Announcement created successfully! ID: ${newAnnouncement.id}`)
      
      // Test get all announcements
      const allAnnouncements = await getAllAnnouncements()
      addLog('success', `Retrieved ${allAnnouncements.length} announcement records`)
      
    } catch (error) {
      addLog('error', `Announcement database test failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testAPIEndpoints = async () => {
    setIsLoading(true)
    addLog('info', 'Testing API endpoints...')
    
    // Test feedback API
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testFeedback)
      })
      
      if (response.ok) {
        addLog('success', 'Feedback API endpoint working!')
      } else {
        const error = await response.text()
        addLog('error', `Feedback API failed: ${error}`)
      }
    } catch (error) {
      addLog('error', `Feedback API error: ${error}`)
    }

    // Test announcements API
    try {
      const response = await fetch('/api/announcements')
      
      if (response.ok) {
        const data = await response.json()
        addLog('success', `Announcements API working! Found ${data.announcements?.length || 0} announcements`)
      } else {
        const error = await response.text()
        addLog('error', `Announcements API failed: ${error}`)
      }
    } catch (error) {
      addLog('error', `Announcements API error: ${error}`)
    }

    setIsLoading(false)
  }

  const runAllTests = async () => {
    clearLogs()
    addLog('info', '🚀 Starting comprehensive diagnostic tests...')
    
    await testSupabaseConnection()
    await testStorageBuckets()
    await testAnnouncementDatabase()
    await testFeedbackDatabase()
    await testAPIEndpoints()
    
    addLog('info', '✅ All tests completed!')
  }

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />
      default: return <Database className="w-4 h-4 text-blue-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href="/admin"
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-900">System Diagnostics</CardTitle>
                  <p className="text-gray-600 mt-1">Test Supabase connectivity, uploads, and database operations</p>
                </div>
              </div>
              <Badge variant="outline" className="text-sm">
                GUD TEK Debug Console
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Controls */}
          <div className="space-y-6">
            {/* Connection Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Connection Tests</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={testSupabaseConnection}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                  Test Supabase Connection
                </Button>
                
                <Button 
                  onClick={testStorageBuckets}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Test Storage Buckets
                </Button>
              </CardContent>
            </Card>

            {/* Upload Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>File Upload Test</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setTestFile(e.target.files?.[0] || null)}
                />
                
                <Button 
                  onClick={testImageUpload}
                  disabled={isLoading || !testFile}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Test Image Upload
                </Button>
              </CardContent>
            </Card>

            {/* Database Tests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Database Tests</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={testFeedbackDatabase}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                  Test Feedback Database
                </Button>
                
                <Button 
                  onClick={testAnnouncementDatabase}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                  Test Announcements Database
                </Button>

                <Button 
                  onClick={testAPIEndpoints}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Test API Endpoints
                </Button>
              </CardContent>
            </Card>

            {/* Run All Tests */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  onClick={runAllTests}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                  size="lg"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Run All Tests
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Test Results */}
          <div>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Test Results</CardTitle>
                <Button 
                  onClick={clearLogs}
                  variant="outline"
                  size="sm"
                >
                  Clear Logs
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      No test results yet. Run a test to see output.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {logs.map((log, index) => (
                        <div 
                          key={index}
                          className={`flex items-start space-x-2 text-sm p-2 rounded ${
                            log.type === 'error' ? 'bg-red-900/20 text-red-300' :
                            log.type === 'success' ? 'bg-green-900/20 text-green-300' :
                            'bg-blue-900/20 text-blue-300'
                          }`}
                        >
                          {getLogIcon(log.type)}
                          <span className="font-mono break-all">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Test Feedback Form */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Test Feedback Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Name"
                value={testFeedback.name}
                onChange={(e) => setTestFeedback(prev => ({ ...prev, name: e.target.value }))}
              />
              <Input
                placeholder="Email"
                type="email"
                value={testFeedback.email}
                onChange={(e) => setTestFeedback(prev => ({ ...prev, email: e.target.value }))}
              />
              <Input
                placeholder="Subject"
                value={testFeedback.subject}
                onChange={(e) => setTestFeedback(prev => ({ ...prev, subject: e.target.value }))}
                className="md:col-span-2"
              />
              <Textarea
                placeholder="Message"
                value={testFeedback.message}
                onChange={(e) => setTestFeedback(prev => ({ ...prev, message: e.target.value }))}
                className="md:col-span-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Supabase URL:</strong><br />
                <code className="text-xs bg-gray-100 p-1 rounded">{process.env.NEXT_PUBLIC_SUPABASE_URL}</code>
              </div>
              <div>
                <strong>Supabase Key:</strong><br />
                <code className="text-xs bg-gray-100 p-1 rounded">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 