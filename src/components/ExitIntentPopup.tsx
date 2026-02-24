"use client"

import { useState, useEffect } from 'react'
import { X, Zap, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ExitIntentPopupProps {
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  features?: string[]
}

export default function ExitIntentPopup({
  title = "Wait! Don't Miss Out on VoiceFly",
  subtitle = "Join 500+ businesses transforming their customer service with AI employees",
  ctaText = "Start Free 14-Day Trial",
  ctaLink = "/signup",
  features = [
    "No credit card needed",
    "Setup takes under 2 minutes",
    "Cancel anytime"
  ]
}: ExitIntentPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasShown, setHasShown] = useState(false)

  useEffect(() => {
    // Check if user has seen the popup in the last 24 hours
    const lastShown = localStorage.getItem('exit_intent_shown')
    if (lastShown) {
      const lastShownTime = new Date(lastShown).getTime()
      const hoursSince = (Date.now() - lastShownTime) / (1000 * 60 * 60)
      if (hoursSince < 24) {
        setHasShown(true)
        return
      }
    }

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves toward top of viewport (exit intent)
      if (e.clientY <= 10 && !hasShown) {
        setIsVisible(true)
        setHasShown(true)
        localStorage.setItem('exit_intent_shown', new Date().toISOString())
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [hasShown])

  const handleClose = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-slide-up">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close popup"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Zap className="h-8 w-8 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {title}
          </h2>

          {/* Subtitle */}
          <p className="text-lg text-gray-600 mb-6">
            {subtitle}
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center justify-center text-gray-700">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <Link
            href={ctaLink}
            className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl group"
          >
            {ctaText}
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Secondary action */}
          <button
            onClick={handleClose}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            No thanks, I'll continue browsing
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
