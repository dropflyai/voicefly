import { Star, Quote, TrendingUp, Users, Phone, Calendar, CheckCircle, ArrowRight, Building, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

export default function TestimonialsPage() {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "CEO",
      company: "MedCare Clinic",
      industry: "Healthcare",
      image: "/testimonials/sarah-chen.jpg",
      quote: "Maya has completely transformed our patient experience. We went from missing 30% of calls to capturing every single one. Our appointment bookings increased by 65% in just two months.",
      results: [
        "65% increase in appointments",
        "100% call capture rate",
        "$180K additional revenue"
      ],
      rating: 5,
      plan: "Professional",
      featured: true
    },
    {
      id: 2,
      name: "Marcus Rodriguez",
      role: "Practice Manager",
      company: "Elite Dental Group",
      industry: "Dental",
      image: "/testimonials/marcus-rodriguez.jpg",
      quote: "The ROI was immediate. Maya handles all our appointment scheduling, insurance verification, and follow-ups. Our staff can focus on patient care instead of the phone.",
      results: [
        "40% more appointments per day",
        "90% patient satisfaction",
        "Saved 20 hours/week staff time"
      ],
      rating: 5,
      plan: "Professional"
    },
    {
      id: 3,
      name: "Jennifer Walsh",
      role: "Operations Director",
      company: "Premier Law Firm",
      industry: "Legal",
      image: "/testimonials/jennifer-walsh.jpg",
      quote: "Maya qualifies leads perfectly and only forwards serious inquiries. Our conversion rate went from 15% to 45% because we're getting higher quality prospects.",
      results: [
        "45% lead conversion rate",
        "3x qualified consultations",
        "$500K new client revenue"
      ],
      rating: 5,
      plan: "Enterprise"
    },
    {
      id: 4,
      name: "David Kim",
      role: "Sales Manager",
      company: "Westside Realty",
      industry: "Real Estate",
      image: "/testimonials/david-kim.jpg",
      quote: "Maya never sleeps, never takes breaks, and never misses a lead. We're capturing prospects at midnight and booking showings for the next day. Game changer.",
      results: [
        "24/7 lead capture",
        "85% faster response time",
        "35% more property showings"
      ],
      rating: 5,
      plan: "Professional"
    },
    {
      id: 5,
      name: "Lisa Thompson",
      role: "Spa Director",
      company: "Serenity Day Spa",
      industry: "Beauty",
      image: "/testimonials/lisa-thompson.jpg",
      quote: "Our clients love Maya's soothing voice and perfect appointment scheduling. No more double bookings, no more missed calls. Pure efficiency.",
      results: [
        "Zero scheduling conflicts",
        "95% client satisfaction",
        "30% increase in bookings"
      ],
      rating: 5,
      plan: "Starter"
    },
    {
      id: 6,
      name: "Robert Anderson",
      role: "Owner",
      company: "Anderson Insurance",
      industry: "Insurance",
      image: "/testimonials/robert-anderson.jpg",
      quote: "Maya handles quote requests, policy renewals, and claim inquiries 24/7. Our customer service quality went up while our costs went down by 60%.",
      results: [
        "60% cost reduction",
        "24/7 customer service",
        "99.9% uptime reliability"
      ],
      rating: 5,
      plan: "Professional"
    }
  ];

  const industries = [
    {
      name: "Healthcare",
      icon: Shield,
      testimonials: 8,
      avgIncrease: "58%",
      color: "blue"
    },
    {
      name: "Legal Services",
      icon: Building,
      testimonials: 12,
      avgIncrease: "42%",
      color: "purple"
    },
    {
      name: "Real Estate",
      icon: Users,
      testimonials: 15,
      avgIncrease: "67%",
      color: "green"
    },
    {
      name: "Beauty & Wellness",
      icon: Star,
      testimonials: 6,
      avgIncrease: "45%",
      color: "pink"
    }
  ];

  const stats = [
    {
      number: "500+",
      label: "Happy Customers",
      description: "Businesses trust Maya"
    },
    {
      number: "99.2%",
      label: "Customer Satisfaction",
      description: "Based on 1,200+ reviews"
    },
    {
      number: "4.8/5",
      label: "Average Rating",
      description: "Across all review platforms"
    },
    {
      number: "52%",
      label: "Average ROI Increase",
      description: "Within first 3 months"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-gray-900">VoiceFly</span>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">Home</Link>
              <Link href="/features" className="text-gray-600 hover:text-gray-900 font-medium">Features</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</Link>
              <Link href="/testimonials" className="text-blue-600 font-medium">Testimonials</Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">Sign In</Link>
              <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Real Results from Real Businesses
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Discover how Maya has helped hundreds of businesses increase bookings, improve customer service, and reduce costs.
          </p>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-8 mt-16">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6">
                <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Testimonial */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Success Story</h2>
          </div>

          {testimonials.filter(t => t.featured).map((testimonial) => (
            <div key={testimonial.id} className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl text-white p-12 max-w-5xl mx-auto">
              <div className="flex items-center mb-8">
                <Quote className="h-12 w-12 text-blue-200 mr-4" />
                <div className="flex text-blue-200">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-current" />
                  ))}
                </div>
              </div>

              <blockquote className="text-2xl md:text-3xl font-medium mb-8 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mr-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">{testimonial.name}</div>
                      <div className="text-blue-200">{testimonial.role}</div>
                      <div className="text-blue-200">{testimonial.company}</div>
                      <div className="text-blue-200 text-sm font-medium">{testimonial.plan} Plan</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold mb-4 text-blue-200">Results Achieved:</h4>
                  <ul className="space-y-2">
                    {testimonial.results.map((result, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-blue-200 mr-3" />
                        <span className="text-blue-100">{result}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Industry Breakdown */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Across Industries</h2>
            <p className="text-xl text-gray-600">Maya delivers results for every type of business</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {industries.map((industry, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 text-center">
                <div className={`w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center ${
                  industry.color === 'blue' ? 'bg-blue-100' :
                  industry.color === 'purple' ? 'bg-purple-100' :
                  industry.color === 'green' ? 'bg-green-100' : 'bg-pink-100'
                }`}>
                  <industry.icon className={`h-6 w-6 ${
                    industry.color === 'blue' ? 'text-blue-600' :
                    industry.color === 'purple' ? 'text-purple-600' :
                    industry.color === 'green' ? 'text-green-600' : 'text-pink-600'
                  }`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{industry.name}</h3>
                <div className="text-2xl font-bold text-blue-600 mb-1">{industry.avgIncrease}</div>
                <div className="text-sm text-gray-600 mb-2">Avg. booking increase</div>
                <div className="text-sm text-gray-500">{industry.testimonials} customer stories</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Testimonials Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600">Real reviews from businesses using Maya</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.filter(t => !t.featured).map((testimonial) => (
              <div key={testimonial.id} className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400 mr-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">{testimonial.plan} Plan</span>
                </div>

                <blockquote className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-gray-600 text-sm">{testimonial.role}</div>
                      <div className="text-gray-600 text-sm">{testimonial.company}</div>
                      <div className="text-blue-600 text-xs font-medium">{testimonial.industry}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {testimonial.results.map((result, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-gray-700">{result}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Trusted by Industry Leaders</h2>
            <p className="text-xl text-gray-600">Join hundreds of successful businesses</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-60">
            {/* Logo placeholders - you can replace with actual customer logos */}
            <div className="bg-gray-200 rounded-lg h-16 flex items-center justify-center">
              <span className="text-gray-500 font-semibold">HealthCorp</span>
            </div>
            <div className="bg-gray-200 rounded-lg h-16 flex items-center justify-center">
              <span className="text-gray-500 font-semibold">LegalGroup</span>
            </div>
            <div className="bg-gray-200 rounded-lg h-16 flex items-center justify-center">
              <span className="text-gray-500 font-semibold">RealtyPlus</span>
            </div>
            <div className="bg-gray-200 rounded-lg h-16 flex items-center justify-center">
              <span className="text-gray-500 font-semibold">SpaChain</span>
            </div>
            <div className="bg-gray-200 rounded-lg h-16 flex items-center justify-center">
              <span className="text-gray-500 font-semibold">InsurePro</span>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center bg-green-100 rounded-full px-6 py-3 text-green-800">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Join 500+ satisfied customers today</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Join These Success Stories?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Start your free trial today and see why businesses choose Maya to transform their customer communications.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 font-semibold inline-flex items-center">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="/demo" className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 font-semibold">
              Watch Demo
            </Link>
          </div>
          <div className="mt-6 text-blue-200">
            <span className="text-sm">14-day free trial • No credit card required • Setup in 5 minutes</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-4">VoiceFly</h3>
              <p className="text-gray-400">AI-powered voice automation for enterprise sales and customer engagement.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/integrations" className="hover:text-white">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/testimonials" className="hover:text-white">Testimonials</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 VoiceFly. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}