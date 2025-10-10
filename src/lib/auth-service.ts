// Supabase Auth Service with Multi-tenancy Support
import { supabase } from './supabase-client'
import { BusinessAPI } from './supabase'
import { getServicesForIndustry } from './industry-service-templates'
import AuditLogger, { AuditEventType } from './audit-logger'
import CreditSystem from './credit-system'

export interface SignupData {
  email: string
  password: string
  firstName: string
  lastName: string
  companyName: string
  businessType: string
  phone?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  businesses: {
    id: string
    name: string
    role: 'owner' | 'admin' | 'manager' | 'member'
  }[]
}

export class AuthService {
  /**
   * Sign up a new user and create their business
   * This creates:
   * 1. Auth user (with password in auth.users)
   * 2. Business record
   * 3. Business-user association (as owner)
   * 4. Industry-specific services
   */
  static async signup(data: SignupData): Promise<{
    user: AuthUser
    primaryBusinessId: string
  }> {
    // 1. Create auth user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName
        }
      }
    })

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create account')
    }

    const userId = authData.user.id

    // 2. Create business and business_user association using secure function
    // This uses SECURITY DEFINER to bypass RLS during signup
    const { data: businessResult, error: businessError } = await supabase.rpc('create_business_for_new_user', {
      p_business_name: data.companyName,
      p_email: data.email,
      p_phone: data.phone || '',
      p_business_type: data.businessType || 'general_business',
      p_user_id: userId,
      p_first_name: data.firstName,
      p_last_name: data.lastName
    })

    if (businessError || !businessResult) {
      console.error('Failed to create business:', businessError)
      // Rollback: delete auth user if business creation fails
      try {
        await supabase.auth.admin.deleteUser(userId)
      } catch (e) {
        console.error('Failed to rollback user:', e)
      }
      throw new Error(businessError?.message || 'Failed to create business account')
    }

    const business = businessResult as { id: string; name: string; email: string; business_type: string }

    console.log('✅ Business created via secure function:', business.id)

    // Initialize credits for new business (trial tier gets 50 credits)
    await CreditSystem.initializeCredits(business.id, 'trial')
    console.log('✅ Credits initialized for trial: 50 credits')

    console.log('✅ Signup complete:', {
      userId,
      businessId: business.id,
      email: data.email
    })

    // Audit log - signup success
    await AuditLogger.log({
      event_type: AuditEventType.SIGNUP,
      user_id: userId,
      business_id: business.id,
      metadata: {
        email: data.email,
        business_name: business.name
      },
      severity: 'low'
    })

    return {
      user: {
        id: userId,
        email: data.email,
        businesses: [{
          id: business.id,
          name: business.name,
          role: 'owner'
        }]
      },
      primaryBusinessId: business.id
    }
  }

  /**
   * Login user with email/password
   * Returns user and their businesses
   */
  static async login(data: LoginData): Promise<{
    user: AuthUser
    primaryBusinessId: string
  }> {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    })

    if (authError || !authData.user) {
      // Audit log - login failed
      await AuditLogger.log({
        event_type: AuditEventType.LOGIN_FAILED,
        metadata: { email: data.email, error: authError?.message },
        severity: 'high'
      })
      throw new Error('Invalid email or password')
    }

    const userId = authData.user.id

    // 2. Get user's businesses
    const { data: businessUsers, error: businessError } = await supabase
      .from('business_users')
      .select(`
        business_id,
        role,
        businesses:business_id (
          id,
          name,
          business_type
        )
      `)
      .eq('user_id', userId)

    if (businessError || !businessUsers || businessUsers.length === 0) {
      throw new Error('No businesses found for this account')
    }

    const businesses = businessUsers.map((bu: any) => ({
      id: bu.businesses.id,
      name: bu.businesses.name,
      role: bu.role
    }))

    // Use first business as primary (or the one marked as 'owner')
    const primaryBusiness = businesses.find(b => b.role === 'owner') || businesses[0]

    console.log('✅ Login successful:', {
      userId,
      email: data.email,
      businessCount: businesses.length
    })

    // Audit log - login success
    await AuditLogger.log({
      event_type: AuditEventType.LOGIN_SUCCESS,
      user_id: userId,
      business_id: primaryBusiness.id,
      metadata: {
        email: data.email,
        business_count: businesses.length
      },
      severity: 'low'
    })

    // Log login event (legacy)
    await supabase.rpc('log_user_action', {
      p_business_id: primaryBusiness.id,
      p_action: 'login',
      p_entity_type: 'auth',
      p_entity_name: 'User Login'
    })

    return {
      user: {
        id: userId,
        email: data.email,
        businesses
      },
      primaryBusinessId: primaryBusiness.id
    }
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<void> {
    // Log logout event before clearing session
    const businessId = localStorage.getItem('authenticated_business_id')
    if (businessId) {
      try {
        await supabase.rpc('log_user_action', {
          p_business_id: businessId,
          p_action: 'logout',
          p_entity_type: 'auth',
          p_entity_name: 'User Logout'
        })
      } catch (err) {
        console.error('Error logging logout:', err)
      }
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
      throw new Error('Failed to logout')
    }

    // Clear localStorage
    localStorage.removeItem('authenticated_business_id')
    localStorage.removeItem('authenticated_user_email')
    localStorage.removeItem('authenticated_business_name')
    localStorage.removeItem('authenticated_business_type')
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<AuthUser | null> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get user's businesses
    const { data: businessUsers } = await supabase
      .from('business_users')
      .select(`
        business_id,
        role,
        businesses:business_id (
          id,
          name
        )
      `)
      .eq('user_id', user.id)

    const businesses = businessUsers?.map((bu: any) => ({
      id: bu.businesses.id,
      name: bu.businesses.name,
      role: bu.role
    })) || []

    return {
      id: user.id,
      email: user.email!,
      businesses
    }
  }

  /**
   * Invite user to business
   * Only owners/admins can invite
   */
  static async inviteUserToBusiness(
    businessId: string,
    email: string,
    role: 'admin' | 'manager' | 'member',
    firstName?: string,
    lastName?: string
  ): Promise<void> {
    // Check if inviter has permission
    const currentUser = await this.getCurrentUser()
    if (!currentUser) {
      throw new Error('Not authenticated')
    }

    const currentUserBusiness = currentUser.businesses.find(b => b.id === businessId)
    if (!currentUserBusiness || !['owner', 'admin'].includes(currentUserBusiness.role)) {
      throw new Error('Permission denied')
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('business_users')
      .select('user_id')
      .eq('email', email)
      .single()

    if (existingUser) {
      // User exists, just add them to this business
      const { error } = await supabase
        .from('business_users')
        .insert({
          user_id: existingUser.user_id,
          business_id: businessId,
          role
        })

      if (error) {
        throw new Error('Failed to add user to business')
      }
    } else {
      // Send email invitation (would need to implement email service)
      console.log(`📧 Send invitation email to ${email}`)
      // For now, just log - implement email service later
    }
  }

  /**
   * Switch active business (for users with multiple businesses)
   */
  static async switchBusiness(businessId: string): Promise<void> {
    const currentUser = await this.getCurrentUser()

    if (!currentUser) {
      throw new Error('Not authenticated')
    }

    const business = currentUser.businesses.find(b => b.id === businessId)
    if (!business) {
      throw new Error('Business not found or access denied')
    }

    // Get full business data
    const businessData = await BusinessAPI.getBusiness(businessId)
    if (!businessData) {
      throw new Error('Business not found')
    }

    // Update localStorage
    localStorage.setItem('authenticated_business_id', businessId)
    localStorage.setItem('authenticated_business_name', businessData.name)
    localStorage.setItem('authenticated_business_type', businessData.business_type)

    console.log('✅ Switched to business:', businessData.name)
  }
}
