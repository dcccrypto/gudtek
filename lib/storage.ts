// Shared in-memory storage for the application
// In production, this should be replaced with a proper database

export interface Announcement {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'announcement'
  priority: number // 1 = highest, 10 = lowest
  isActive: boolean
  expiresAt?: Date
  timestamp: Date
}

export interface Feedback {
  id: string
  name: string
  email: string
  subject: string
  message: string
  timestamp: Date
  isRead: boolean
  adminResponse?: string
}

// Announcements storage with initial demo announcements
export let announcementsStorage: Announcement[] = [
  // Demo announcements to show the system is working
  {
    id: 'demo-1',
    title: '🎉 Welcome to Gud Tek!',
    message: 'The #1 BONK Hackathon Winner is now live! Join our community and experience revolutionary DeFi on Solana.',
    type: 'announcement',
    priority: 1,
    isActive: true,
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
  },
  {
    id: 'demo-2',
    title: '🚀 Community Growth Update',
    message: 'Our community has reached 1,000+ members! Thank you for being part of the Gud Tek revolution. More exciting features coming soon.',
    type: 'success',
    priority: 5,
    isActive: true,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // Expires in 5 days
  },
  {
    id: 'demo-3',
    title: 'ℹ️ Trading Information',
    message: 'Gud Tek ($GUDTEK) is now available on Jupiter! Start trading with low fees and fast transactions on Solana.',
    type: 'info',
    priority: 3,
    isActive: true,
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: 'demo-4',
    title: '⚠️ Important: Verify Contract Address',
    message: 'Always verify our official contract address before trading: 5QUgMieD3YQr9sEZjMAHKs1cKJiEhnvRNZatvzvcbonk. Beware of scams!',
    type: 'warning',
    priority: 2,
    isActive: true,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  }
]

// Feedback storage
export let feedbackStorage: Feedback[] = []

// Helper functions
export const addAnnouncement = (announcement: Omit<Announcement, 'id' | 'timestamp'>) => {
  const newAnnouncement: Announcement = {
    ...announcement,
    id: `announcement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date()
  }
  announcementsStorage.push(newAnnouncement)
  return newAnnouncement
}

export const updateAnnouncement = (id: string, updates: Partial<Omit<Announcement, 'id' | 'timestamp'>>) => {
  const index = announcementsStorage.findIndex(a => a.id === id)
  if (index !== -1) {
    announcementsStorage[index] = { ...announcementsStorage[index], ...updates }
    return true
  }
  return false
}

export const deleteAnnouncement = (id: string) => {
  const index = announcementsStorage.findIndex(a => a.id === id)
  if (index !== -1) {
    const deleted = announcementsStorage.splice(index, 1)[0]
    return deleted
  }
  return null
}

export const addFeedback = (feedback: Omit<Feedback, 'id' | 'timestamp' | 'isRead'>) => {
  const newFeedback: Feedback = {
    ...feedback,
    id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    isRead: false
  }
  feedbackStorage.push(newFeedback)
  return newFeedback
}

export const getActiveAnnouncements = () => {
  const now = new Date()
  return announcementsStorage
    .filter(a => {
      if (!a.isActive) return false
      if (a.expiresAt && a.expiresAt < now) return false
      return true
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
}

export const getAllAnnouncements = () => {
  return [...announcementsStorage].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )
}

export const getAllFeedback = () => {
  return [...feedbackStorage].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  )
}

export const getFeedbackStats = () => {
  const total = feedbackStorage.length
  const unread = feedbackStorage.filter(f => !f.isRead).length
  const recent = feedbackStorage.filter(f => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return f.timestamp > oneDayAgo
  }).length

  return { total, unread, recent }
}

export const markFeedbackAsRead = (id: string) => {
  const feedback = feedbackStorage.find(f => f.id === id)
  if (feedback) {
    feedback.isRead = true
    return true
  }
  return false
}

export const addAdminResponse = (id: string, response: string) => {
  const feedback = feedbackStorage.find(f => f.id === id)
  if (feedback) {
    feedback.adminResponse = response
    feedback.isRead = true
    return true
  }
  return false
}

export const getAnnouncementStats = () => {
  const total = announcementsStorage.length
  const active = getActiveAnnouncements().length
  const expired = announcementsStorage.filter(a => {
    if (!a.expiresAt) return false
    return a.expiresAt < new Date()
  }).length

  return { total, active, expired }
} 