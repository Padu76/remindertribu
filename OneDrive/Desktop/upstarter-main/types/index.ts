// User Types
export interface User {
  id: string
  email: string
  name: string
  image?: string
  user_type: 'startup' | 'investor'
  created_at: string
  updated_at: string
}

// Project Types
export interface Project {
  id: string
  user_id: string
  title: string
  description: string
  status: 'draft' | 'analyzing' | 'completed'
  score?: number
  created_at: string
  updated_at: string
}

// Idea Analysis Types
export interface IdeaAnalysisInput {
  title: string
  description: string
  questionnaire: {
    target_market: string
    value_proposition: string
    business_model: string
    competitive_advantage: string
    team_experience: string
    funding_needed: string
    timeline: string
    main_challenges: string
  }
}

export interface IdeaAnalysisResult {
  id: string
  project_id: string
  overall_score: number
  swot_analysis: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  detailed_feedback: {
    market_analysis: {
      score: number
      feedback: string
      recommendations: string[]
    }
    business_model: {
      score: number
      feedback: string
      recommendations: string[]
    }
    team_assessment: {
      score: number
      feedback: string
      missing_roles: string[]
    }
    financial_viability: {
      score: number
      feedback: string
      recommendations: string[]
    }
  }
  next_steps: string[]
  created_at: string
}

// Improvement Plan Types
export interface ImprovementPlan {
  id: string
  project_id: string
  current_score: number
  target_score: number
  phases: ImprovementPhase[]
  created_at: string
  updated_at: string
}

export interface ImprovementPhase {
  id: string
  title: string
  description: string
  duration_weeks: number
  expected_score_increase: number
  tasks: ImprovementTask[]
  status: 'pending' | 'active' | 'completed'
}

export interface ImprovementTask {
  id: string
  title: string
  description: string
  category: 'market' | 'product' | 'team' | 'business' | 'financial'
  priority: 'low' | 'medium' | 'high'
  estimated_hours: number
  resources: string[]
  status: 'pending' | 'in_progress' | 'completed'
  due_date?: string
  completed_at?: string
}

// TeamUp Types
export interface UserProfile {
  id: string
  user_id: string
  role_type: 'founder' | 'co-founder' | 'employee' | 'advisor'
  skills: string[]
  experience_years: number
  availability_hours: number
  location: string
  bio: string
  portfolio_links: string[]
  created_at: string
  updated_at: string
}

export interface ProjectListing {
  id: string
  project_id: string
  seeking_roles: string[]
  required_skills: string[]
  commitment_level: 'part-time' | 'full-time'
  equity_offered?: number
  salary_range?: string
  remote_friendly: boolean
  location_required?: string
  created_at: string
  updated_at: string
}

export interface Match {
  id: string
  project_id: string
  user_profile_id: string
  compatibility_score: number
  match_reasons: string[]
  status: 'pending' | 'mutual_interest' | 'meeting_scheduled' | 'passed'
  startup_interested: boolean
  candidate_interested: boolean
  created_at: string
  updated_at: string
}

// Investor Types
export interface InvestorProfile {
  id: string
  user_id: string
  company_name: string
  investment_stage: 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'later'
  ticket_size_min: number
  ticket_size_max: number
  sectors: string[]
  geographic_focus: string[]
  portfolio_size: number
  created_at: string
  updated_at: string
}

export interface InvestorMatch {
  id: string
  project_id: string
  investor_id: string
  compatibility_score: number
  match_factors: {
    sector_fit: number
    stage_fit: number
    ticket_fit: number
    geographic_fit: number
    traction_fit: number
  }
  status: 'pending' | 'investor_interested' | 'startup_interested' | 'mutual_interest' | 'meeting_scheduled' | 'passed'
  created_at: string
  updated_at: string
}

// Message Types
export interface Message {
  id: string
  from_user_id: string
  to_user_id: string
  match_id?: string
  subject: string
  content: string
  is_read: boolean
  created_at: string
}

// Dashboard Types
export interface DashboardStats {
  total_projects: number
  avg_score: number
  completed_analyses: number
  improvement_tasks: number
  matches_found: number
  messages_received: number
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'textarea' | 'select' | 'number' | 'checkbox'
  placeholder?: string
  required?: boolean
  options?: { value: string; label: string }[]
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
  }
}

// Navigation Types
export interface NavigationItem {
  name: string
  href: string
  icon: any
  current: boolean
  badge?: number
}

// Airtable Types
export interface AirtableRecord {
  id: string
  fields: Record<string, any>
  createdTime: string
}

export interface AirtableResponse<T> {
  records: T[]
  offset?: string
}