"use client"

import { AuthForm } from "@/components/auth-form"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-brand/10">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full filter blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/20 rounded-full filter blur-xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500/10 rounded-full filter blur-2xl animate-pulse delay-500" />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-bounce delay-300" />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-300/60 rounded-full animate-bounce delay-700" />
        <div className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-blue-300/50 rounded-full animate-bounce delay-1000" />
      </div>

      {/* Hero Section */}
      <header className="relative flex flex-col items-center justify-center min-h-screen py-20 px-4 text-center">
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Logo with glow effect */}
          <div className="mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-2xl opacity-30 scale-110" />
            <div className="relative bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-2xl shadow-2xl">
              <span className="text-3xl font-black text-white">AF</span>
            </div>
          </div>

          {/* Main heading with gradient text */}
          <h1 className="text-6xl sm:text-8xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent drop-shadow-2xl">
              AlgoFinny
            </span>
          </h1>

          {/* Subtitle with typing animation */}
          <div className="text-xl sm:text-3xl mb-8 max-w-4xl mx-auto leading-relaxed">
            <p className="text-gray-200 mb-4">
              The <span className="text-purple-300 font-semibold">AI-powered financial intelligence</span> platform
            </p>
            <p className="text-gray-300 text-lg sm:text-xl">
              Upload bank statements • Get instant insights • Make smarter financial decisions
            </p>
          </div>

          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/20">
              🚀 AI-Powered Analysis
            </span>
            <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/20">
              📊 Real-time Insights
            </span>
            <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/20">
              🔒 Bank-level Security
            </span>
            <span className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/20">
              🇳🇬 Built for Nigerians
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-lg font-bold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
              onClick={() => setShowAuth(true)}
            >
              <span className="relative z-10">Start Your Journey</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            </button>
            
            <button
              className="group px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-lg font-semibold hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
              onClick={() => router.push("/bank-statement")}
            >
              <span className="flex items-center gap-2">
                📄 Try Bank Upload
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Supercharge Your Finances
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the future of personal finance with AI-driven insights and Nigerian-focused features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 transform hover:scale-105">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mb-4 transform group-hover:rotate-12 transition-transform">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">AI Financial Coach</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Get personalized financial advice powered by OpenAI and DeepSeek. Our AI analyzes your spending patterns and provides actionable insights tailored for Nigerian financial habits.
                  </p>
                </div>
                <div className="flex items-center text-purple-300 font-medium group-hover:text-purple-200">
                  Learn more <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-teal-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 transform hover:scale-105">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4 transform group-hover:rotate-12 transition-transform">
                    <span className="text-2xl">📊</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Smart Statement Analysis</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Upload PDF or CSV bank statements and watch our AI instantly extract, categorize, and analyze your transactions. Support for all major Nigerian banks.
                  </p>
                </div>
                <div className="flex items-center text-green-300 font-medium group-hover:text-green-200">
                  Try now <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-red-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 hover:bg-white/10 transition-all duration-500 transform hover:scale-105">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 transform group-hover:rotate-12 transition-transform">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">Real-time Dashboard</h3>
                  <p className="text-gray-300 leading-relaxed">
                    Beautiful, intuitive dashboard that grows with you. Track income, expenses, savings goals, and get Nigerian market insights—all in real-time.
                  </p>
                </div>
                <div className="flex items-center text-pink-300 font-medium group-hover:text-pink-200">
                  Explore <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4 bg-white/5 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <div className="text-4xl font-black text-purple-400 mb-2 group-hover:scale-110 transition-transform">1M+</div>
              <div className="text-gray-300">Transactions Analyzed</div>
            </div>
            <div className="group">
              <div className="text-4xl font-black text-blue-400 mb-2 group-hover:scale-110 transition-transform">₦500M+</div>
              <div className="text-gray-300">Money Managed</div>
            </div>
            <div className="group">
              <div className="text-4xl font-black text-green-400 mb-2 group-hover:scale-110 transition-transform">98%</div>
              <div className="text-gray-300">User Satisfaction</div>
            </div>
            <div className="group">
              <div className="text-4xl font-black text-pink-400 mb-2 group-hover:scale-110 transition-transform">24/7</div>
              <div className="text-gray-300">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/90 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-2xl font-light"
              onClick={() => setShowAuth(false)}
              aria-label="Close"
            >
              ×
            </button>
            <AuthForm
              onAuthed={() => {
                setShowAuth(false)
                router.push("/app")
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative py-16 text-center border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <div className="text-3xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
              AlgoFinny
            </div>
            <p className="text-gray-400">
              Empowering financial intelligence for the next generation of Nigerians
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">API Docs</a>
          </div>
          
          <div className="text-gray-500 text-sm">
            © {new Date().getFullYear()} AlgoFinny. Built with ❤️ for Nigeria.
          </div>
        </div>
      </footer>
    </div>
  )
}