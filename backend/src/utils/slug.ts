export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '')
}

export function generateUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug
  let counter = 1
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`
    counter++
  }
  
  return slug
}

export function generateCircleSlug(name: string): string {
  return generateSlug(name)
}

export function generateTournamentSlug(name: string, date: Date): string {
  const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD format
  const nameSlug = generateSlug(name)
  return `${dateString}-${nameSlug}`
}