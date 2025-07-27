import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Airtable configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID
const AIRTABLE_TABLE_NAME = 'TEAM_PROFILES'

interface AirtableRecord {
  id: string
  fields: {
    user_id?: string
    user_email?: string
    full_name?: string
    professional_title?: string
    bio?: string
    location?: string
    timezone?: string
    role_seeking?: string
    availability?: string
    start_timeline?: string
    skills?: string
    experience_years?: number
    industry_focus?: string
    previous_roles?: string
    startup_stage_preference?: string
    equity_expectations?: string
    compensation_needs?: string
    remote_preference?: string
    portfolio_url?: string
    linkedin_url?: string
    github_url?: string
    website_url?: string
    team_size_preference?: string
    investment_stage_preference?: string
    geographic_preference?: string
    status?: string
    created_at?: string
    updated_at?: string
  }
}

interface TeamProfile {
  id: string
  user_id: string
  user_email: string
  full_name: string
  professional_title: string
  bio: string
  location: string
  role_seeking: string
  availability: string
  skills: string[]
  experience_years: number
  industry_focus: string[]
  equity_expectations: string
  portfolio_url?: string
  linkedin_url?: string
  github_url?: string
  website_url?: string
  status: string
  created_at: string
}

async function callAirtable(endpoint: string, options: RequestInit = {}) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Airtable API Error:', response.status, errorText)
    throw new Error(`Airtable API error: ${response.status}`)
  }

  return response.json()
}

function parseArrayField(value: string | undefined): string[] {
  if (!value) return []
  if (typeof value !== 'string') return []
  
  // Handle comma-separated values
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

function transformAirtableRecord(record: AirtableRecord): TeamProfile {
  const fields = record.fields
  
  return {
    id: record.id,
    user_id: fields.user_id || '',
    user_email: fields.user_email || '',
    full_name: fields.full_name || '',
    professional_title: fields.professional_title || '',
    bio: fields.bio || '',
    location: fields.location || '',
    role_seeking: fields.role_seeking || 'co-founder',
    availability: fields.availability || 'full-time',
    skills: parseArrayField(fields.skills),
    experience_years: fields.experience_years || 0,
    industry_focus: parseArrayField(fields.industry_focus),
    equity_expectations: fields.equity_expectations || '',
    portfolio_url: fields.portfolio_url,
    linkedin_url: fields.linkedin_url,
    github_url: fields.github_url,
    website_url: fields.website_url,
    status: fields.status || 'active',
    created_at: fields.created_at || new Date().toISOString()
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user session
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if Airtable is configured
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.warn('Airtable not configured, returning empty profiles')
      return NextResponse.json({
        success: true,
        profiles: [],
        message: 'Airtable not configured'
      })
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role_seeking = searchParams.get('role_seeking') || ''
    const availability = searchParams.get('availability') || ''
    const location = searchParams.get('location') || ''
    const skills = searchParams.get('skills') || ''
    const industry = searchParams.get('industry') || ''
    const experience = searchParams.get('experience') || ''
    const sort_by = searchParams.get('sort_by') || 'recent'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build Airtable filter formula
    let filterParts: string[] = []
    
    // Only active profiles
    filterParts.push(`{status} = 'active'`)
    
    // Exclude current user
    filterParts.push(`{user_email} != '${session.user.email}'`)
    
    // Apply additional filters if provided
    if (role_seeking) {
      filterParts.push(`{role_seeking} = '${role_seeking}'`)
    }
    
    if (availability) {
      filterParts.push(`{availability} = '${availability}'`)
    }
    
    if (location) {
      filterParts.push(`FIND('${location}', LOWER({location})) > 0`)
    }
    
    if (skills) {
      filterParts.push(`FIND('${skills.toLowerCase()}', LOWER({skills})) > 0`)
    }
    
    if (industry) {
      filterParts.push(`FIND('${industry.toLowerCase()}', LOWER({industry_focus})) > 0`)
    }
    
    if (experience) {
      const [min, max] = experience.split('-').map(n => parseInt(n))
      if (max) {
        filterParts.push(`AND({experience_years} >= ${min}, {experience_years} <= ${max})`)
      } else if (experience.includes('+')) {
        filterParts.push(`{experience_years} > ${min}`)
      }
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filterParts.push(`OR(
        FIND('${searchLower}', LOWER({full_name})) > 0,
        FIND('${searchLower}', LOWER({professional_title})) > 0,
        FIND('${searchLower}', LOWER({bio})) > 0,
        FIND('${searchLower}', LOWER({skills})) > 0,
        FIND('${searchLower}', LOWER({industry_focus})) > 0
      )`)
    }

    // Combine filters
    const filterFormula = filterParts.length > 0 
      ? `AND(${filterParts.join(', ')})` 
      : ''

    // Build sort parameter
    let sortParam: any[] = []
    switch (sort_by) {
      case 'recent':
        sortParam = [{ field: 'created_at', direction: 'desc' }]
        break
      case 'experience':
        sortParam = [{ field: 'experience_years', direction: 'desc' }]
        break
      case 'name':
        sortParam = [{ field: 'full_name', direction: 'asc' }]
        break
      case 'location':
        sortParam = [{ field: 'location', direction: 'asc' }]
        break
      default:
        sortParam = [{ field: 'created_at', direction: 'desc' }]
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      maxRecords: limit.toString(),
      view: 'Grid view'
    })

    if (filterFormula) {
      queryParams.append('filterByFormula', filterFormula)
    }

    if (sortParam.length > 0) {
      queryParams.append('sort[0][field]', sortParam[0].field)
      queryParams.append('sort[0][direction]', sortParam[0].direction)
    }

    console.log('Fetching team profiles with filter:', filterFormula)

    // Fetch from Airtable
    const data = await callAirtable(`${AIRTABLE_TABLE_NAME}?${queryParams.toString()}`)
    
    // Transform records
    const profiles: TeamProfile[] = data.records
      .map((record: AirtableRecord) => transformAirtableRecord(record))
      .filter((profile: TeamProfile) => {
        // Additional client-side filtering for complex searches
        if (!profile.full_name || !profile.professional_title) return false
        
        // Ensure minimum required fields
        return profile.full_name.length > 0 && 
               profile.professional_title.length > 0 &&
               profile.bio.length > 0
      })

    console.log(`Found ${profiles.length} team profiles`)

    return NextResponse.json({
      success: true,
      profiles,
      count: profiles.length,
      filters_applied: {
        search: search || null,
        role_seeking: role_seeking || null,
        availability: availability || null,
        location: location || null,
        skills: skills || null,
        industry: industry || null,
        experience: experience || null,
        sort_by
      }
    })

  } catch (error) {
    console.error('Browse team profiles error:', error)
    
    // Return graceful fallback instead of error
    return NextResponse.json({
      success: true,
      profiles: [],
      count: 0,
      error: 'Unable to load profiles at the moment',
      fallback: true
    })
  }
}

// Optional: Add POST method for advanced filtering
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      return NextResponse.json({
        success: true,
        profiles: [],
        message: 'Airtable not configured'
      })
    }

    const body = await request.json()
    const {
      search = '',
      role_seeking = [],
      availability = [],
      location = '',
      skills = [],
      industry_focus = [],
      experience_years = '',
      sort_by = 'recent',
      limit = 50
    } = body

    // Build complex filter formula for POST request
    let filterParts: string[] = []
    
    filterParts.push(`{status} = 'active'`)
    filterParts.push(`{user_email} != '${session.user.email}'`)
    
    if (role_seeking.length > 0) {
      const roleFilters = role_seeking.map((role: string) => `{role_seeking} = '${role}'`).join(', ')
      filterParts.push(`OR(${roleFilters})`)
    }
    
    if (availability.length > 0) {
      const availFilters = availability.map((avail: string) => `{availability} = '${avail}'`).join(', ')
      filterParts.push(`OR(${availFilters})`)
    }
    
    if (location) {
      filterParts.push(`FIND('${location}', LOWER({location})) > 0`)
    }
    
    if (skills.length > 0) {
      const skillFilters = skills.map((skill: string) => 
        `FIND('${skill.toLowerCase()}', LOWER({skills})) > 0`
      ).join(', ')
      filterParts.push(`OR(${skillFilters})`)
    }
    
    if (industry_focus.length > 0) {
      const industryFilters = industry_focus.map((industry: string) => 
        `FIND('${industry.toLowerCase()}', LOWER({industry_focus})) > 0`
      ).join(', ')
      filterParts.push(`OR(${industryFilters})`)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filterParts.push(`OR(
        FIND('${searchLower}', LOWER({full_name})) > 0,
        FIND('${searchLower}', LOWER({professional_title})) > 0,
        FIND('${searchLower}', LOWER({bio})) > 0,
        FIND('${searchLower}', LOWER({skills})) > 0,
        FIND('${searchLower}', LOWER({industry_focus})) > 0
      )`)
    }

    const filterFormula = filterParts.length > 0 
      ? `AND(${filterParts.join(', ')})` 
      : ''

    // Sort
    let sortParam: any[] = []
    switch (sort_by) {
      case 'recent':
        sortParam = [{ field: 'created_at', direction: 'desc' }]
        break
      case 'experience':
        sortParam = [{ field: 'experience_years', direction: 'desc' }]
        break
      case 'name':
        sortParam = [{ field: 'full_name', direction: 'asc' }]
        break
      case 'location':
        sortParam = [{ field: 'location', direction: 'asc' }]
        break
      default:
        sortParam = [{ field: 'created_at', direction: 'desc' }]
    }

    const queryParams = new URLSearchParams({
      maxRecords: limit.toString(),
      view: 'Grid view'
    })

    if (filterFormula) {
      queryParams.append('filterByFormula', filterFormula)
    }

    if (sortParam.length > 0) {
      queryParams.append('sort[0][field]', sortParam[0].field)
      queryParams.append('sort[0][direction]', sortParam[0].direction)
    }

    console.log('Advanced filtering with:', { filterFormula, sort_by })

    const data = await callAirtable(`${AIRTABLE_TABLE_NAME}?${queryParams.toString()}`)
    
    const profiles: TeamProfile[] = data.records
      .map((record: AirtableRecord) => transformAirtableRecord(record))
      .filter((profile: TeamProfile) => {
        return profile.full_name.length > 0 && 
               profile.professional_title.length > 0 &&
               profile.bio.length > 0
      })

    return NextResponse.json({
      success: true,
      profiles,
      count: profiles.length,
      filters_applied: body
    })

  } catch (error) {
    console.error('Advanced browse error:', error)
    
    return NextResponse.json({
      success: true,
      profiles: [],
      count: 0,
      error: 'Unable to load profiles at the moment',
      fallback: true
    })
  }
}