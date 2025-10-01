'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
// import { useHeaders } from 'next/headers' // Server component only - commented for build

interface WhiteLabelConfig {
  domain: string
  business_id: string
  branding: {
    platform_name: string
    logo_url?: string
    favicon_url?: string
    colors: {
      primary: string
      secondary: string
      accent: string
    }
    font_family: string
    hide_powered_by: boolean
    custom_footer?: string
  }
  features: {
    custom_email_domain: boolean
    custom_sms_sender: boolean
    remove_platform_branding: boolean
    custom_login_page: boolean
    white_label_dashboard: boolean
  }
}

interface WhiteLabelContextType {
  config: WhiteLabelConfig | null
  isWhiteLabel: boolean
  platformName: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  logoUrl?: string
  hidePoweredBy: boolean
}

const WhiteLabelContext = createContext<WhiteLabelContextType | null>(null)

interface WhiteLabelProviderProps {
  children: ReactNode
}

export function WhiteLabelProvider({ children }: WhiteLabelProviderProps) {
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null)
  const [isWhiteLabel, setIsWhiteLabel] = useState(false)

  useEffect(() => {
    // Check if we're in a white-label context by looking at headers
    const checkWhiteLabel = () => {
      // In browser, we can't access middleware headers directly
      // So we'll check the hostname and make a client-side call if needed
      const hostname = window.location.hostname
      
      if (
        hostname.includes('localhost') ||
        hostname.includes('vercel.app') ||
        hostname.includes('dropfly.ai')
      ) {
        // Standard DropFly domain
        setIsWhiteLabel(false)
        return
      }

      // This appears to be a custom domain - fetch white-label config
      fetchWhiteLabelConfig(hostname)
    }

    const fetchWhiteLabelConfig = async (domain: string) => {
      try {
        const response = await fetch(`/api/white-label/config?domain=${domain}`)
        if (response.ok) {
          const data = await response.json()
          if (data.config) {
            setConfig(data.config)
            setIsWhiteLabel(true)
            applyBranding(data.config.branding)
          }
        }
      } catch (error) {
        console.error('Error fetching white-label config:', error)
      }
    }

    const applyBranding = (branding: WhiteLabelConfig['branding']) => {
      // Apply CSS variables to document root
      const root = document.documentElement
      root.style.setProperty('--brand-primary', branding.colors.primary)
      root.style.setProperty('--brand-secondary', branding.colors.secondary)
      root.style.setProperty('--brand-accent', branding.colors.accent)
      root.style.setProperty('--brand-font', branding.font_family)

      // Update document title and favicon if provided
      if (branding.platform_name) {
        document.title = branding.platform_name
      }

      if (branding.favicon_url) {
        const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement
        if (favicon) {
          favicon.href = branding.favicon_url
        } else {
          const newFavicon = document.createElement('link')
          newFavicon.rel = 'icon'
          newFavicon.href = branding.favicon_url
          document.head.appendChild(newFavicon)
        }
      }
    }

    checkWhiteLabel()
  }, [])

  const contextValue: WhiteLabelContextType = {
    config,
    isWhiteLabel,
    platformName: config?.branding?.platform_name || 'DropFly',
    colors: config?.branding?.colors || {
      primary: '#8b5cf6',
      secondary: '#ec4899',
      accent: '#f59e0b'
    },
    logoUrl: config?.branding?.logo_url,
    hidePoweredBy: config?.branding?.hide_powered_by || false
  }

  return (
    <WhiteLabelContext.Provider value={contextValue}>
      <div className={`white-label-app ${isWhiteLabel ? 'is-white-label' : 'is-standard'}`}>
        {children}
        <WhiteLabelStyles colors={contextValue.colors} fontFamily={config?.branding?.font_family || 'Inter'} />
      </div>
    </WhiteLabelContext.Provider>
  )
}

interface WhiteLabelStylesProps {
  colors: { primary: string; secondary: string; accent: string }
  fontFamily: string
}

function WhiteLabelStyles({ colors, fontFamily }: WhiteLabelStylesProps) {
  return (
    <style jsx global>{`
      :root {
        --brand-primary: ${colors.primary};
        --brand-secondary: ${colors.secondary};
        --brand-accent: ${colors.accent};
        --brand-font: ${fontFamily}, sans-serif;
      }

      /* Apply white-label theming */
      .white-label-app {
        font-family: var(--brand-font);
      }

      /* Button theming */
      .white-label-app .btn-primary,
      .white-label-app button[class*="bg-purple-600"] {
        background-color: var(--brand-primary) !important;
        border-color: var(--brand-primary) !important;
      }

      .white-label-app .btn-primary:hover,
      .white-label-app button[class*="bg-purple-600"]:hover {
        background-color: var(--brand-secondary) !important;
        border-color: var(--brand-secondary) !important;
      }

      /* Link theming */
      .white-label-app a,
      .white-label-app [class*="text-purple-600"] {
        color: var(--brand-primary) !important;
      }

      .white-label-app a:hover,
      .white-label-app [class*="text-purple-600"]:hover {
        color: var(--brand-secondary) !important;
      }

      /* Border theming */
      .white-label-app [class*="border-purple-"],
      .white-label-app [class*="ring-purple-"] {
        border-color: var(--brand-primary) !important;
        --tw-ring-color: var(--brand-primary) !important;
      }

      /* Background theming */
      .white-label-app [class*="bg-purple-50"] {
        background-color: color-mix(in srgb, var(--brand-primary) 10%, white) !important;
      }

      .white-label-app [class*="bg-purple-100"] {
        background-color: color-mix(in srgb, var(--brand-primary) 20%, white) !important;
      }

      /* Text theming */
      .white-label-app h1,
      .white-label-app h2,
      .white-label-app h3,
      .white-label-app .text-brand-primary {
        color: var(--brand-primary) !important;
      }

      .white-label-app .text-brand-accent {
        color: var(--brand-accent) !important;
      }

      /* Chart theming */
      .white-label-app .recharts-line-curve {
        stroke: var(--brand-primary) !important;
      }

      .white-label-app .recharts-bar {
        fill: var(--brand-primary) !important;
      }

      .white-label-app .recharts-active-dot {
        stroke: var(--brand-secondary) !important;
        fill: var(--brand-secondary) !important;
      }

      /* Form theming */
      .white-label-app input:focus,
      .white-label-app select:focus,
      .white-label-app textarea:focus {
        border-color: var(--brand-primary) !important;
        --tw-ring-color: var(--brand-primary) !important;
      }

      /* Status indicators */
      .white-label-app .status-active {
        background-color: color-mix(in srgb, var(--brand-accent) 20%, white) !important;
        color: var(--brand-accent) !important;
      }

      /* Navigation theming */
      .white-label-app .nav-active {
        background-color: var(--brand-primary) !important;
        color: white !important;
      }

      /* Hide powered by when configured */
      .is-white-label .powered-by-dropfly {
        display: none !important;
      }

      /* Gradient backgrounds */
      .white-label-app .gradient-primary {
        background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%) !important;
      }

      /* Custom scrollbar */
      .white-label-app ::-webkit-scrollbar-thumb {
        background-color: var(--brand-primary) !important;
      }

      .white-label-app ::-webkit-scrollbar-track {
        background-color: color-mix(in srgb, var(--brand-primary) 10%, white) !important;
      }

      /* Loading indicators */
      .white-label-app .loading-spinner {
        border-top-color: var(--brand-primary) !important;
      }

      /* Alert styling */
      .white-label-app .alert-primary {
        background-color: color-mix(in srgb, var(--brand-primary) 10%, white) !important;
        border-color: var(--brand-primary) !important;
        color: var(--brand-primary) !important;
      }

      /* Modal styling */
      .white-label-app .modal-header {
        background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%) !important;
        color: white !important;
      }
    `}</style>
  )
}

export function useWhiteLabel() {
  const context = useContext(WhiteLabelContext)
  if (context === null) {
    throw new Error('useWhiteLabel must be used within a WhiteLabelProvider')
  }
  return context
}

// Helper components for white-label aware elements
export function PlatformName() {
  const { platformName } = useWhiteLabel()
  return <span>{platformName}</span>
}

export function PlatformLogo({ className = "h-8" }: { className?: string }) {
  const { logoUrl, platformName } = useWhiteLabel()
  
  if (!logoUrl) {
    return <PlatformName />
  }
  
  return <img src={logoUrl} alt={platformName} className={className} />
}

export function PoweredBy() {
  const { hidePoweredBy, platformName } = useWhiteLabel()
  
  if (hidePoweredBy) {
    return null
  }
  
  return (
    <p className="powered-by-dropfly text-xs text-gray-400 text-center mt-4">
      Powered by DropFly
    </p>
  )
}

export function BrandedButton({ 
  children, 
  className = "", 
  variant = "primary",
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'primary' | 'secondary' | 'accent' 
}) {
  const { colors } = useWhiteLabel()
  
  const getButtonStyles = () => {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition-colors"
    
    switch (variant) {
      case 'primary':
        return `${baseStyles} text-white`
      case 'secondary':
        return `${baseStyles} border text-current`
      case 'accent':
        return `${baseStyles} text-white`
      default:
        return baseStyles
    }
  }
  
  const getButtonColor = () => {
    switch (variant) {
      case 'primary':
        return { backgroundColor: colors.primary }
      case 'secondary':
        return { 
          borderColor: colors.primary, 
          color: colors.primary 
        }
      case 'accent':
        return { backgroundColor: colors.accent }
      default:
        return {}
    }
  }
  
  return (
    <button 
      className={`${getButtonStyles()} ${className}`}
      style={getButtonColor()}
      {...props}
    >
      {children}
    </button>
  )
}