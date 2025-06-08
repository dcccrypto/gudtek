"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Clock, AlertTriangle, CheckCircle, Info, Megaphone, ArrowLeft, Upload, X, ImageIcon, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import Image from "next/image"
import { uploadAnnouncementImage, deleteAnnouncementImage } from "@/lib/supabase"

interface Announcement {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'announcement'
  priority: number
  is_active: boolean
  expires_at?: string
  image_url?: string
  image_path?: string
  created_at: string
  updated_at: string
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement' as 'info' | 'warning' | 'success' | 'announcement',
    priority: 5,
    expires_at: '',
    image_url: '',
    image_path: ''
  })

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/admin/announcements', {
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)
    try {
      const result = await uploadAnnouncementImage(file, file.name)
      setFormData(prev => ({
        ...prev,
        image_url: result.publicUrl,
        image_path: result.filePath
      }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = async () => {
    if (formData.image_path) {
      try {
        await deleteAnnouncementImage(formData.image_path)
      } catch (error) {
        console.error('Error deleting image:', error)
      }
    }
    setFormData(prev => ({
      ...prev,
      image_url: '',
      image_path: ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = '/api/announcements'
      const method = editingAnnouncement ? 'PUT' : 'POST'
      
      const payload = editingAnnouncement 
        ? { ...formData, id: editingAnnouncement.id }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        await fetchAnnouncements()
        resetForm()
        alert(editingAnnouncement ? 'Announcement updated!' : 'Announcement created!')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save announcement')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    }
  }

  const toggleAnnouncementStatus = async (announcement: Announcement) => {
    try {
      const response = await fetch('/api/announcements', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token'
        },
        body: JSON.stringify({
          id: announcement.id,
          is_active: !announcement.is_active
        })
      })

      if (response.ok) {
        await fetchAnnouncements()
      } else {
        alert('Failed to update announcement status')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    }
  }

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const response = await fetch(`/api/announcements?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      })

      if (response.ok) {
        await fetchAnnouncements()
        alert('Announcement deleted!')
      } else {
        alert('Failed to delete announcement')
      }
    } catch (error) {
      alert('Network error. Please try again.')
    }
  }

  const startEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      priority: announcement.priority,
      expires_at: announcement.expires_at || '',
      image_url: announcement.image_url || '',
      image_path: announcement.image_path || ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingAnnouncement(null)
    setFormData({
      title: '',
      message: '',
      type: 'announcement',
      priority: 5,
      expires_at: '',
      image_url: '',
      image_path: ''
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />
      case 'success':
        return <CheckCircle className="w-4 h-4" />
      case 'info':
        return <Info className="w-4 h-4" />
      case 'announcement':
      default:
        return <Megaphone className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-orange-600 bg-orange-100'
      case 'success':
        return 'text-green-600 bg-green-100'
      case 'info':
        return 'text-blue-600 bg-blue-100'
      case 'announcement':
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority <= 3) return 'text-red-600 bg-red-100 border-red-200'
    if (priority <= 7) return 'text-yellow-600 bg-yellow-100 border-yellow-200'
    return 'text-green-600 bg-green-100 border-green-200'
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 py-8">
      <div className="max-w-7xl mx-auto px-4">
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
                  <CardTitle className="text-3xl font-bold text-gray-900">Manage Announcements</CardTitle>
                  <p className="text-gray-600 mt-1">Create and manage site-wide announcements with images</p>
                </div>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => resetForm()}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetForm}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="md:col-span-2">
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter announcement title"
                        required
                        className="mt-1"
                      />
                    </div>

                    {/* Type and Priority */}
                    <div>
                      <Label htmlFor="type">Type *</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="announcement">📢 Announcement</SelectItem>
                          <SelectItem value="info">ℹ️ Info</SelectItem>
                          <SelectItem value="warning">⚠️ Warning</SelectItem>
                          <SelectItem value="success">✅ Success</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="priority">Priority (1-10) *</Label>
                      <Input
                        id="priority"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.priority}
                        onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 5 }))}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">1 = Highest priority, 10 = Lowest priority</p>
                    </div>

                    {/* Expiration */}
                    <div className="md:col-span-2">
                      <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
                      <Input
                        id="expires_at"
                        type="datetime-local"
                        value={formData.expires_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                        className="mt-1"
                      />
                    </div>

                    {/* Image Upload */}
                    <div className="md:col-span-2">
                      <Label>Image (Optional)</Label>
                      <div className="mt-2">
                        {formData.image_url ? (
                          <div className="relative">
                            <div className="relative h-48 w-full rounded-lg overflow-hidden border">
                              <Image
                                src={formData.image_url}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={removeImage}
                              className="mt-2"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Remove Image
                            </Button>
                          </div>
                        ) : (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleImageUpload(file)
                              }}
                              disabled={uploadingImage}
                              className="hidden"
                              id="image-upload"
                            />
                            <Label htmlFor="image-upload" className="cursor-pointer">
                              <div className="flex flex-col items-center">
                                {uploadingImage ? (
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                ) : (
                                  <ImageIcon className="w-8 h-8 text-gray-400" />
                                )}
                                <p className="mt-2 text-sm text-gray-600">
                                  {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                                </p>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                              </div>
                            </Label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message */}
                    <div className="md:col-span-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                        placeholder="Enter announcement message"
                        required
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {editingAnnouncement ? 'Update' : 'Create'} Announcement
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Announcements List */}
        {isLoading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading announcements...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Announcements</h3>
                  <p className="text-gray-600">Create your first announcement to get started.</p>
                </CardContent>
              </Card>
            ) : (
              announcements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`${announcement.is_active ? 'bg-white' : 'bg-gray-50 opacity-75'}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between space-x-4">
                        {/* Image */}
                        {announcement.image_url && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden border flex-shrink-0">
                            <Image
                              src={announcement.image_url}
                              alt={announcement.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`p-1 rounded ${getTypeColor(announcement.type)}`}>
                                {getTypeIcon(announcement.type)}
                              </div>
                              <Badge variant="outline" className={getPriorityColor(announcement.priority)}>
                                Priority: {announcement.priority}
                              </Badge>
                              {!announcement.is_active && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={announcement.is_active}
                                onCheckedChange={() => toggleAnnouncementStatus(announcement)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(announcement)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteAnnouncement(announcement.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <h3 className="font-semibold text-gray-900 mb-1 truncate">
                            {announcement.title}
                          </h3>
                          
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {announcement.message}
                          </p>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span>Created: {formatDate(announcement.created_at)}</span>
                              {announcement.expires_at && (
                                <span>Expires: {formatDate(announcement.expires_at)}</span>
                              )}
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {announcement.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
} 