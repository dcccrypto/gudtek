export async function GET() {
  try {
    const res = await fetch('https://t.me/gudteksolana', { next: { revalidate: 3600 } })
    const text = await res.text()
    const match = text.match(/tgme_page_extra[^>]*>([^<]+) members/)
    const count = match ? parseInt(match[1].replace(/[^0-9]/g, '')) : 0
    return Response.json({ count })
  } catch (err) {
    return Response.json({ count: 0 })
  }
}
