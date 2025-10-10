'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ChevronDownIcon,
  CheckCircleIcon,
  PhoneIcon,
  ClockIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

type Industry = {
  id: string
  name: string
  icon: string
  tagline: string
  painPoints: string[]
  missedCallCost: string
  avgDealValue: string
  conversionMetric: string
  mayaUseCases: {
    scenario: string
    mayaResponse: string
    outcome: string
  }[]
  roiCalculation: {
    metric: string
    beforeVoiceFly: string
    withVoiceFly: string
    monthlyImpact: string
    annualValue: string
  }
  tools: string[]
  customerStory: {
    business: string
    result: string
    quote: string
  }
}

const industries: Industry[] = [
  {
    id: 'auto',
    name: 'Auto Dealerships',
    icon: '🚗',
    tagline: 'Turn Every Call Into a Showroom Visit',
    painPoints: [
      'Miss 40-60% of inbound calls during busy showroom hours',
      'Test drive inquiries go unanswered on nights and weekends',
      'Internet leads take 3-6 hours to respond (should be under 5 minutes)',
      'Sales team forgets to follow up with warm leads'
    ],
    missedCallCost: '$2,500',
    avgDealValue: '$2,800 commission',
    conversionMetric: '20% of test drives convert',
    mayaUseCases: [
      {
        scenario: 'After-Hours Test Drive Request',
        mayaResponse: '"Thanks for calling Smith Auto! I can absolutely help you schedule a test drive for that 2024 Camry. What day works best for you this week? I have openings Tuesday at 2pm, Wednesday at 4pm, or Saturday morning at 10am."',
        outcome: 'Test drive booked instantly. Lead doesn\'t call competitor.'
      },
      {
        scenario: 'Pricing Question During Busy Saturday',
        mayaResponse: '"That 2023 Honda Accord is priced at $28,500. It includes a 3-year warranty and we currently have $2,000 in manufacturer incentives. Would you like to come see it today? I can hold it for you for 2 hours."',
        outcome: 'Buyer motivated to visit immediately while vehicle is held.'
      }
    ],
    roiCalculation: {
      metric: 'Recovered Lost Calls',
      beforeVoiceFly: '50 missed calls/month × 20% conversion × $2,800 = $28,000 lost',
      withVoiceFly: '45 calls answered × 15% conversion × $2,800 = $18,900 recovered',
      monthlyImpact: '+$18,900 recovered sales',
      annualValue: '$226,800 additional revenue'
    },
    tools: [
      'Inbound call handling 24/7',
      'Test drive booking',
      'Lead qualification',
      'Trade-in appointment scheduling'
    ],
    customerStory: {
      business: 'Metro Ford (3-location dealer)',
      result: 'Increased showroom traffic by 34% in 90 days',
      quote: 'Maya answers every call, even when we\'re slammed. Our internet-to-showroom rate went from 12% to 23%. That\'s an extra 40 deals a month.'
    }
  },
  {
    id: 'realestate',
    name: 'Real Estate Agencies',
    icon: '🏡',
    tagline: 'Be First to Respond. Win More Listings.',
    painPoints: [
      'Buyers who don\'t get a callback within 5 minutes call the next agent (78% will)',
      'Agents miss calls during showings, open houses, and closings',
      'Weekend inquiries sit until Monday (competitors respond immediately)',
      'Cold leads never get nurtured properly'
    ],
    missedCallCost: '$12,000',
    avgDealValue: '$12,000 commission',
    conversionMetric: 'First-responder wins 42% of leads',
    mayaUseCases: [
      {
        scenario: 'Hot Buyer Inquiry at 7pm Saturday',
        mayaResponse: '"Hi! I\'m Maya with Coastal Realty. You\'re calling about the home at 456 Oak Street? It\'s absolutely stunning—3 bed, 2 bath, updated kitchen, and it just listed yesterday. Can I schedule a showing for you tomorrow at 11am or 2pm?"',
        outcome: 'Showing booked within 2 minutes. Buyer never calls another agent.'
      },
      {
        scenario: 'Seller Wants Home Value',
        mayaResponse: '"I can help with that! Homes in your neighborhood are selling for $550,000-$625,000 right now. Sarah, our listing specialist, would love to give you a free market analysis. Are you available Tuesday or Wednesday?"',
        outcome: 'Listing appointment booked before seller talks to competitors.'
      }
    ],
    roiCalculation: {
      metric: 'First-Response Advantage',
      beforeVoiceFly: '40 leads/month × 15% conversion × $12,000 = $72,000',
      withVoiceFly: '40 leads/month × 35% conversion × $12,000 = $168,000',
      monthlyImpact: '+$96,000 in commissions',
      annualValue: '$1,152,000 additional revenue'
    },
    tools: [
      '24/7 lead response (critical 5-min window)',
      'Showing appointment scheduling',
      'Property info delivery',
      'Open house RSVP management'
    ],
    customerStory: {
      business: 'Harbor Realty Group (8 agents)',
      result: 'Closed 17 additional transactions in Q1',
      quote: 'We went from responding to leads in 3-6 hours to under 2 minutes. Our conversion rate literally doubled. Maya is like having a full-time ISA for $297/month.'
    }
  },
  {
    id: 'legal',
    name: 'Law Firms',
    icon: '⚖️',
    tagline: 'Never Miss a Potential Client Again',
    painPoints: [
      '42% of clients hire the first attorney who responds',
      'Calls go to voicemail during trials, depositions, meetings',
      'Intake coordinators cost $45,000-60,000/year',
      'After-hours emergencies missed (especially criminal defense)'
    ],
    missedCallCost: '$8,000',
    avgDealValue: '$10,000 per case',
    conversionMetric: '30% of consultations convert',
    mayaUseCases: [
      {
        scenario: 'Personal Injury at 8pm',
        mayaResponse: '"I\'m so sorry to hear about your accident. Johnson & Associates specializes in personal injury cases, and we work on contingency—you don\'t pay unless we win. Let me schedule a free consultation with Attorney Johnson. She has availability tomorrow at 10am or Thursday at 2pm."',
        outcome: 'Potential $50K case captured before client calls another firm.'
      },
      {
        scenario: 'DUI Arrest (Urgent)',
        mayaResponse: '"This is urgent and Attorney Chen is available for emergencies. I\'m sending him a text right now with your info. He\'ll call you within 15 minutes. In the meantime: don\'t make statements, don\'t consent to searches, request an attorney."',
        outcome: 'High-value criminal defense client retained within minutes.'
      }
    ],
    roiCalculation: {
      metric: 'Captured Consultations',
      beforeVoiceFly: '30 requests/month × 40% captured × 30% retained × $10K = $36,000',
      withVoiceFly: '30 requests/month × 85% captured × 30% retained × $10K = $76,500',
      monthlyImpact: '+$40,500 in new cases',
      annualValue: '$486,000 additional revenue'
    },
    tools: [
      'After-hours emergency intake',
      'Consultation scheduling',
      'Practice area qualification',
      'Case urgency assessment'
    ],
    customerStory: {
      business: 'Garcia & Partners (5-attorney firm)',
      result: 'Added 9 cases/month that went to voicemail before',
      quote: 'Maya handles intake while we\'re in court. We went from losing 60% of after-hours calls to capturing 85%. That\'s $300K extra this year.'
    }
  },
  {
    id: 'homeservices',
    name: 'Home Services (HVAC, Plumbing)',
    icon: '🔧',
    tagline: 'Turn Emergencies Into Revenue 24/7',
    painPoints: [
      'Emergency calls at night/weekends = 3x revenue but often missed',
      'Techs can\'t answer while on job sites (60-80% miss rate)',
      'No-shows cost $150-300 per empty slot',
      'Customers call 3-5 competitors before someone answers'
    ],
    missedCallCost: '$500',
    avgDealValue: '$450 per call',
    conversionMetric: 'SMS reminders reduce no-shows 80%',
    mayaUseCases: [
      {
        scenario: 'AC Broken at 9pm in July',
        mayaResponse: '"I\'m sorry your AC is out! That\'s definitely an emergency in this heat. We can have a technician out tonight for emergency service, or schedule first thing tomorrow at 8am and save the emergency fee. Which do you prefer?"',
        outcome: 'Emergency call booked at $850 vs $250 regular. Customer grateful.'
      },
      {
        scenario: 'Water Heater Leak',
        mayaResponse: '"Water heater leaks need immediate attention. I\'m dispatching our plumber to 456 Oak Street right now. He\'ll be there in 45-60 minutes. In the meantime, turn off the water supply valve—it\'s usually on top of the tank."',
        outcome: '$650 emergency repair captured. Customer instructed on safety.'
      }
    ],
    roiCalculation: {
      metric: 'Emergency Calls + No-Show Reduction',
      beforeVoiceFly: '5 missed emergencies × $650 + 8 no-shows × $200 = $4,850 lost',
      withVoiceFly: '4 emergencies captured × $650 + 6 fewer no-shows × $200 = $3,800',
      monthlyImpact: '+$3,800 additional revenue',
      annualValue: '$45,600 additional revenue'
    },
    tools: [
      '24/7 emergency dispatch',
      'Appointment booking by technician',
      'SMS appointment reminders',
      'Service history lookup'
    ],
    customerStory: {
      business: 'Apex HVAC (4 technicians)',
      result: 'Captured $28K in after-hours emergencies in 6 months',
      quote: 'Before Maya, we missed every call after 6pm. Now we book those high-margin emergency calls automatically. Revenue up 18%.'
    }
  },
  {
    id: 'medical',
    name: 'Medical & Dental',
    icon: '🦷',
    tagline: 'Fill Your Schedule. Eliminate No-Shows.',
    painPoints: [
      'No-shows cost practices $200 per empty slot',
      'Phone staff busy 40% of day with appointment calls',
      'After-hours appointment requests wait until morning',
      'New patient forms not completed before appointment'
    ],
    missedCallCost: '$200',
    avgDealValue: '$350 per visit',
    conversionMetric: 'SMS reminders reduce no-shows 25% → 5%',
    mayaUseCases: [
      {
        scenario: 'New Patient Dental Cleaning',
        mayaResponse: '"Welcome to Bright Smiles Dental! For new patients, we do a comprehensive exam and cleaning—about 90 minutes. We have availability next Tuesday at 9am, Wednesday at 2pm, or Thursday at 10am. We accept most insurance. Which works best?"',
        outcome: 'New patient booked. Insurance verified. Forms sent via SMS.'
      },
      {
        scenario: 'Urgent Care Appointment',
        mayaResponse: '"I understand you\'re not feeling well. Dr. Martinez has same-day appointments available. I can get you in today at 3:30pm or 5:15pm. Which works better? I\'ll also text you pre-registration forms to save time when you arrive."',
        outcome: 'Same-day appointment filled. Patient prepared with paperwork.'
      }
    ],
    roiCalculation: {
      metric: 'No-Show Prevention',
      beforeVoiceFly: '30 appointments × 25% no-show × $250 = $1,875 lost + staff time',
      withVoiceFly: '30 appointments × 5% no-show × $250 = $375 lost',
      monthlyImpact: '+$1,500 in kept appointments + 10 hours saved',
      annualValue: '$18,000 revenue protected + efficiency'
    },
    tools: [
      '24/7 appointment scheduling',
      'Automated SMS reminders',
      'Patient forms collection',
      'Insurance verification prompts'
    ],
    customerStory: {
      business: 'Riverside Family Dentistry',
      result: 'No-show rate dropped from 22% to 4% in 3 months',
      quote: 'Maya sends reminders and confirms appointments automatically. Our front desk went from drowning in calls to focusing on patient care. We filled $45K in empty slots.'
    }
  },
  {
    id: 'salons',
    name: 'Salons & Spas',
    icon: '💇',
    tagline: 'Keep Your Books Full. Clients Coming Back.',
    painPoints: [
      '15-25% no-show rate devastates schedule',
      'After-hours booking requests go unanswered',
      'Rebooking rate under 60% (healthy is 80%+)',
      'Phone rings while stylists are with clients'
    ],
    missedCallCost: '$125',
    avgDealValue: '$120 per appointment',
    conversionMetric: 'Automated rebooking increases retention 35%',
    mayaUseCases: [
      {
        scenario: 'Haircut Booking at 8pm Sunday',
        mayaResponse: '"Thanks for calling Luxe Salon! I can definitely get you in for a haircut with Jessica. She has openings this Tuesday at 11am, Wednesday at 3pm, or Friday at 1pm. Which works best for your schedule?"',
        outcome: 'Appointment booked immediately. Client doesn\'t try another salon.'
      },
      {
        scenario: 'Spa Package for Anniversary',
        mayaResponse: '"How wonderful! Our Couples Relaxation Package is perfect—90-minute massages, champagne, and aromatherapy for $340. We can do Saturday at 10am or 2pm. Would you like to add our signature facials for $80 more per person?"',
        outcome: 'High-value package booked with upsell. $500 appointment secured.'
      }
    ],
    roiCalculation: {
      metric: 'No-Shows + Rebooking',
      beforeVoiceFly: '100 appointments × 20% no-show × $110 = $2,200 lost',
      withVoiceFly: '100 appointments × 5% no-show × $110 = $550 + 15 extra rebookings × $110 = $1,650',
      monthlyImpact: '+$3,300 ($1,650 saved + $1,650 new)',
      annualValue: '$39,600 additional revenue'
    },
    tools: [
      '24/7 booking for all services',
      'Automated SMS reminders',
      'Stylist scheduling by specialty',
      'Automatic rebook offers'
    ],
    customerStory: {
      business: 'Serenity Day Spa',
      result: 'No-show rate 18% → 3%, rebook rate 55% → 78%',
      quote: 'Maya reminds clients, prompts rebooking, and fills our schedule 24/7. Our revenue per chair increased $800/month. She pays for herself 10x over.'
    }
  }
]

export default function SolutionsPage() {
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>(industries[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      {/* Header */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '16px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <Link href="/" style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', textDecoration: 'none' }}>
            🎙️ VoiceFly
          </Link>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: '#4b5563', textDecoration: 'none' }}>Home</Link>
            <Link href="/solutions" style={{ color: '#2563eb', fontWeight: '500', textDecoration: 'none' }}>Solutions</Link>
            <Link href="/pricing" style={{ color: '#4b5563', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/login" style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ background: 'linear-gradient(to right, #2563eb, #1d4ed8)', padding: '64px 24px', color: '#ffffff' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px', color: '#ffffff' }}>
            See VoiceFly in Action
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.9, maxWidth: '800px', margin: '0 auto 32px', color: '#ffffff' }}>
            Real ROI calculations, proven scenarios, and metrics from your industry.
          </p>

          {/* Industry Selector */}
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  backgroundColor: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1f2937',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
                }}
              >
                <span>
                  {selectedIndustry.icon} {selectedIndustry.name}
                </span>
                <ChevronDownIcon style={{ width: '24px', height: '24px', color: '#6b7280' }} />
              </button>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  zIndex: 50
                }}>
                  {industries.map((industry) => (
                    <button
                      key={industry.id}
                      onClick={() => {
                        setSelectedIndustry(industry)
                        setIsDropdownOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        textAlign: 'left',
                        backgroundColor: selectedIndustry.id === industry.id ? '#f3f4f6' : '#ffffff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#1f2937',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedIndustry.id === industry.id ? '#f3f4f6' : '#ffffff'}
                    >
                      {industry.icon} {industry.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '32px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>92%</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Call Capture Rate</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>8x</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Average ROI</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>80%</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Fewer No-Shows</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2563eb', marginBottom: '8px' }}>24/7</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Always Available</div>
          </div>
        </div>
      </div>

      {/* Industry Content */}
      <div style={{ maxWidth: '1200px', margin: '64px auto', padding: '0 24px' }}>
        {/* Tagline */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}>
            {selectedIndustry.tagline}
          </h2>
        </div>

        {/* Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626', marginBottom: '8px' }}>
              {selectedIndustry.missedCallCost}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Cost Per Missed Call</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
              {selectedIndustry.avgDealValue}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Average Deal Value</div>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#059669', marginBottom: '8px' }}>
              {selectedIndustry.conversionMetric}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Key Metric</div>
          </div>
        </div>

        {/* Pain Points & Solutions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px', marginBottom: '48px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', border: '2px solid #fee2e2' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626', marginBottom: '24px' }}>
              Your Pain Points
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedIndustry.painPoints.map((point, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ fontSize: '18px', flexShrink: 0 }}>❌</div>
                  <p style={{ color: '#7f1d1d', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', border: '2px solid #d1fae5' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669', marginBottom: '24px' }}>
              VoiceFly Tools for {selectedIndustry.name}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedIndustry.tools.map((tool, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px' }}>
                  <CheckCircleIcon style={{ width: '24px', height: '24px', color: '#059669', flexShrink: 0 }} />
                  <p style={{ color: '#064e3b', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>{tool}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Maya Use Cases */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '40px', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <ChatBubbleLeftRightIcon style={{ width: '32px', height: '32px', color: '#1f2937' }} />
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
              How Maya Handles Real Scenarios
            </h3>
          </div>
          <div style={{ display: 'grid', gap: '24px' }}>
            {selectedIndustry.mayaUseCases.map((useCase, i) => (
              <div key={i} style={{ backgroundColor: '#f9fafb', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px' }}>
                  <PhoneIcon style={{ width: '20px', height: '20px', color: '#1f2937', marginTop: '2px', flexShrink: 0 }} />
                  <h4 style={{ fontWeight: '600', color: '#1f2937', margin: 0 }}>{useCase.scenario}</h4>
                </div>
                <div style={{ backgroundColor: '#e5e7eb', borderLeft: '4px solid #6b7280', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                  <p style={{ fontSize: '14px', color: '#1f2937', fontStyle: 'italic', margin: 0 }}>{useCase.mayaResponse}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                  <CheckCircleIcon style={{ width: '18px', height: '18px', color: '#059669', marginTop: '2px', flexShrink: 0 }} />
                  <p style={{ fontSize: '14px', color: '#059669', fontWeight: '600', margin: 0 }}>{useCase.outcome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Calculation */}
        <div style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', borderRadius: '16px', padding: '40px', marginBottom: '48px' }}>
          <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#064e3b', marginBottom: '8px', textAlign: 'center' }}>
            Real ROI: {selectedIndustry.roiCalculation.metric}
          </h3>
          <div style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>BEFORE VOICEFLY:</div>
              <div style={{ fontSize: '16px', color: '#1f2937' }}>{selectedIndustry.roiCalculation.beforeVoiceFly}</div>
            </div>
            <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', padding: '20px', borderLeft: '4px solid #059669' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px', fontWeight: '600' }}>WITH VOICEFLY:</div>
              <div style={{ fontSize: '16px', color: '#1f2937' }}>{selectedIndustry.roiCalculation.withVoiceFly}</div>
            </div>
            <div style={{ backgroundColor: '#047857', color: '#ffffff', borderRadius: '10px', padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Monthly Impact</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{selectedIndustry.roiCalculation.monthlyImpact}</div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Annual Value</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{selectedIndustry.roiCalculation.annualValue}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Story */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '40px', marginBottom: '48px' }}>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '24px' }}>
            Success Story: {selectedIndustry.customerStory.business}
          </h3>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
              {selectedIndustry.customerStory.result}
            </div>
          </div>
          <blockquote style={{ borderLeft: '4px solid #6b7280', paddingLeft: '24px', fontStyle: 'italic', fontSize: '18px', color: '#4b5563', margin: 0 }}>
            "{selectedIndustry.customerStory.quote}"
          </blockquote>
        </div>

        {/* CTA */}
        <div style={{ background: 'linear-gradient(to right, #2563eb, #1d4ed8)', borderRadius: '16px', padding: '48px', textAlign: 'center', color: '#ffffff' }}>
          <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#ffffff' }}>
            Ready to Transform Your Business?
          </h3>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px', color: '#ffffff' }}>
            Start with a free trial. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 32px',
                backgroundColor: '#ffffff',
                color: '#2563eb',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              Start Free Trial
              <ArrowRightIcon style={{ width: '20px', height: '20px' }} />
            </Link>
            <Link
              href="/pricing"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '14px 32px',
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: '2px solid #ffffff',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1f2937', color: '#ffffff', padding: '48px 16px', marginTop: '64px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>🎙️ VoiceFly</div>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '16px' }}>
            The world's most advanced AI business employee platform
          </p>
          <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', fontSize: '14px', color: '#9ca3af' }}>
            <Link href="/pricing" style={{ color: '#9ca3af', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/solutions" style={{ color: '#9ca3af', textDecoration: 'none' }}>Solutions</Link>
            <Link href="/login" style={{ color: '#9ca3af', textDecoration: 'none' }}>Sign In</Link>
          </div>
          <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid #374151', fontSize: '14px', color: '#9ca3af' }}>
            © 2025 VoiceFly. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
