import { NextRequest, NextResponse } from 'next/server'
import { 
  getActiveAnnouncements, 
  getAllAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} from '@/lib/supabase'

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const activeAnnouncements = await getActiveAnnouncements()

    return NextResponse.json({
      announcements: activeAnnouncements
    })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, message, type, priority, expires_at, image_url, image_path } = await request.json()

    // Basic validation
    if (!title || !message || !type || priority === undefined) {
      return NextResponse.json(
        { error: 'Title, message, type, and priority are required' },
        { status: 400 }
      )
    }

    const announcement = await createAnnouncement({
      title: title.trim(),
      message: message.trim(),
      type: type as 'info' | 'warning' | 'success' | 'announcement',
      priority: parseInt(priority),
      ...(expires_at && { expires_at }),
      ...(image_url && { image_url }),
      ...(image_path && { image_path })
    })

    return NextResponse.json(
      { message: 'Announcement created successfully!', announcement },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, title, message, type, priority, is_active, expires_at, image_url, image_path } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      )
    }

    const updates: any = {}
    if (title) updates.title = title.trim()
    if (message) updates.message = message.trim()
    if (type) updates.type = type
    if (priority !== undefined) updates.priority = parseInt(priority)
    if (typeof is_active === 'boolean') updates.is_active = is_active
    if (expires_at) updates.expires_at = expires_at
    if (image_url !== undefined) updates.image_url = image_url
    if (image_path !== undefined) updates.image_path = image_path

    const updatedAnnouncement = await updateAnnouncement(id, updates)

    return NextResponse.json({
      message: 'Announcement updated successfully!',
      announcement: updatedAnnouncement
    })
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { error: 'Failed to update announcement' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Announcement ID is required' },
        { status: 400 }
      )
    }

    await deleteAnnouncement(id)

    return NextResponse.json({
      message: 'Announcement deleted successfully!'
    })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Failed to delete announcement' },
      { status: 500 }
    )
  }
} 