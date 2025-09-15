const Airtable = require('airtable')

// Configurazione base di Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID)

// Definizione delle tabelle
export const TABLES = {
  USERS: 'Users',
  PROJECTS: 'Projects',
  IDEAS_ANALYSIS: 'Ideas_Analysis',
  ADDITIONAL_INFO: 'Additional_Info'
}

// Interfacce TypeScript
export interface AirtableUser {
  id?: string
  email: string
  name: string
  user_type: 'startup' | 'investor' | 'consultant'
  created_at?: string
  updated_at?: string
}

export interface AirtableProject {
  id?: string
  user_id?: string[]
  title: string
  description: string
  source: 'form' | 'document' | 'document_professional'
  source_file?: string
  status: 'draft' | 'analyzed' | 'archived'
  score: number
  type: 'standard' | 'professional'
  created_at?: string
  updated_at?: string
}

export interface AirtableAnalysis {
  id?: string
  project_id?: string[]
  overall_score: number
  analysis_data: string
  missing_areas: string
  completeness_score: number
  created_at?: string
}

export interface AirtableAdditionalInfo {
  id?: string
  project_id?: string[]
  category: string
  content: string
  priority: 'critical' | 'important' | 'nice_to_have'
  step_required: 'pitch' | 'business_plan' | 'investment_ready'
  created_at?: string
}

class AirtableService {
  // USERS OPERATIONS
  async createUser(userData: AirtableUser): Promise<any> {
    try {
      const records = await base(TABLES.USERS).create([
        {
          fields: {
            email: userData.email,
            name: userData.name,
            user_type: userData.user_type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      ])
      return records[0]
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  async getUserByEmail(email: string): Promise<any> {
    try {
      const records = await base(TABLES.USERS).select({
        filterByFormula: `{email} = "${email}"`
      }).firstPage()
      
      return records.length > 0 ? records[0] : null
    } catch (error) {
      console.error('Error getting user by email:', error)
      throw error
    }
  }

  async getOrCreateUser(email: string, name: string, userType: string = 'startup'): Promise<any> {
    try {
      let user = await this.getUserByEmail(email)
      
      if (!user) {
        user = await this.createUser({
          email,
          name,
          user_type: userType as 'startup' | 'investor' | 'consultant'
        })
      }
      
      return user
    } catch (error) {
      console.error('Error getting or creating user:', error)
      throw error
    }
  }

  // PROJECTS OPERATIONS
  async createProject(projectData: AirtableProject, userEmail: string): Promise<any> {
    try {
      // Get or create user first
      const user = await this.getOrCreateUser(userEmail, userEmail.split('@')[0])
      
      const records = await base(TABLES.PROJECTS).create([
        {
          fields: {
            user_id: [user.id],
            title: projectData.title,
            description: projectData.description,
            source: projectData.source,
            source_file: projectData.source_file || '',
            status: projectData.status,
            score: projectData.score,
            type: projectData.type,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
      ])
      
      return records[0]
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  async getProjectsByUser(userEmail: string): Promise<any[]> {
    try {
      const user = await this.getUserByEmail(userEmail)
      if (!user) return []

      const records = await base(TABLES.PROJECTS).select({
        filterByFormula: `FIND("${user.id}", {user_id})`,
        sort: [{ field: 'created_at', direction: 'desc' }]
      }).all()

      return records
    } catch (error) {
      console.error('Error getting projects by user:', error)
      return []
    }
  }

  async getProjectById(projectId: string): Promise<any> {
    try {
      const record = await base(TABLES.PROJECTS).find(projectId)
      return record
    } catch (error) {
      console.error('Error getting project by ID:', error)
      throw error
    }
  }

  async updateProject(projectId: string, updates: Partial<AirtableProject>): Promise<any> {
    try {
      const record = await base(TABLES.PROJECTS).update(projectId, {
        ...updates,
        updated_at: new Date().toISOString()
      })
      return record
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  async deleteProject(projectId: string): Promise<boolean> {
    try {
      await base(TABLES.PROJECTS).destroy(projectId)
      return true
    } catch (error) {
      console.error('Error deleting project:', error)
      return false
    }
  }

  // IDEAS_ANALYSIS OPERATIONS
  async createAnalysis(analysisData: AirtableAnalysis, projectId: string): Promise<any> {
    try {
      const records = await base(TABLES.IDEAS_ANALYSIS).create([
        {
          fields: {
            project_id: [projectId],
            overall_score: analysisData.overall_score,
            analysis_data: analysisData.analysis_data,
            missing_areas: analysisData.missing_areas,
            completeness_score: analysisData.completeness_score,
            created_at: new Date().toISOString()
          }
        }
      ])
      
      return records[0]
    } catch (error) {
      console.error('Error creating analysis:', error)
      throw error
    }
  }

  async getAnalysisByProject(projectId: string): Promise<any> {
    try {
      const records = await base(TABLES.IDEAS_ANALYSIS).select({
        filterByFormula: `FIND("${projectId}", {project_id})`,
        sort: [{ field: 'created_at', direction: 'desc' }]
      }).firstPage()
      
      return records.length > 0 ? records[0] : null
    } catch (error) {
      console.error('Error getting analysis by project:', error)
      throw error
    }
  }

  // ADDITIONAL_INFO OPERATIONS
  async createAdditionalInfo(infoData: AirtableAdditionalInfo, projectId: string): Promise<any> {
    try {
      const records = await base(TABLES.ADDITIONAL_INFO).create([
        {
          fields: {
            project_id: [projectId],
            category: infoData.category,
            content: infoData.content,
            priority: infoData.priority,
            step_required: infoData.step_required,
            created_at: new Date().toISOString()
          }
        }
      ])
      
      return records[0]
    } catch (error) {
      console.error('Error creating additional info:', error)
      throw error
    }
  }

  async getAdditionalInfoByProject(projectId: string): Promise<any[]> {
    try {
      const records = await base(TABLES.ADDITIONAL_INFO).select({
        filterByFormula: `FIND("${projectId}", {project_id})`,
        sort: [{ field: 'created_at', direction: 'desc' }]
      }).all()

      return records
    } catch (error) {
      console.error('Error getting additional info by project:', error)
      return []
    }
  }

  async deleteAdditionalInfo(infoId: string): Promise<boolean> {
    try {
      await base(TABLES.ADDITIONAL_INFO).destroy(infoId)
      return true
    } catch (error) {
      console.error('Error deleting additional info:', error)
      return false
    }
  }

  // UTILITY FUNCTIONS
  async getAllProjects(): Promise<any[]> {
    try {
      const records = await base(TABLES.PROJECTS).select({
        sort: [{ field: 'created_at', direction: 'desc' }]
      }).all()

      return records
    } catch (error) {
      console.error('Error getting all projects:', error)
      return []
    }
  }

  async getProjectStats(userEmail: string): Promise<any> {
    try {
      const projects = await this.getProjectsByUser(userEmail)
      
      const stats = {
        total: projects.length,
        analyzed: projects.filter(p => p.fields.status === 'analyzed').length,
        draft: projects.filter(p => p.fields.status === 'draft').length,
        archived: projects.filter(p => p.fields.status === 'archived').length,
        avgScore: projects.length > 0 ? 
          Math.round(projects.reduce((acc, p) => acc + p.fields.score, 0) / projects.length) : 0
      }
      
      return stats
    } catch (error) {
      console.error('Error getting project stats:', error)
      return { total: 0, analyzed: 0, draft: 0, archived: 0, avgScore: 0 }
    }
  }

  // SEARCH FUNCTIONS
  async searchProjects(query: string, userEmail?: string): Promise<any[]> {
    try {
      let filterFormula = `OR(FIND("${query}", {title}), FIND("${query}", {description}))`
      
      if (userEmail) {
        const user = await this.getUserByEmail(userEmail)
        if (user) {
          filterFormula = `AND(${filterFormula}, FIND("${user.id}", {user_id}))`
        }
      }

      const records = await base(TABLES.PROJECTS).select({
        filterByFormula: filterFormula,
        sort: [{ field: 'created_at', direction: 'desc' }]
      }).all()

      return records
    } catch (error) {
      console.error('Error searching projects:', error)
      return []
    }
  }
}

const airtableService = new AirtableService()
export default airtableService
export { AirtableService }