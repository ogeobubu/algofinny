"use client"

import Image from "next/image";
import { AuthForm } from "@/components/auth-form";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-brand/10 text-foreground font-sans">
      {/* Hero Section */}
      <header className="flex flex-col items-center justify-center flex-1 py-24 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <svg width="100%" height="100%" className="absolute inset-0" style={{opacity:0.08}}>
            <circle cx="60%" cy="40%" r="320" fill="#3b82f6" />
            <circle cx="20%" cy="80%" r="180" fill="#6366f1" />
          </svg>
        </div>
        <Image src="/next.svg" alt="Logo" width={120} height={40} className="mb-6 dark:invert relative z-10" />
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 relative z-10">
          <span className="text-brand drop-shadow">AlgoFinny</span>
        </h1>
        <p className="text-xl sm:text-2xl mb-8 max-w-2xl mx-auto relative z-10">
          The all-in-one AI-powered finance platform for modern Nigerians.<br />
          <span className="text-brand font-semibold">Upload your bank statement, analyze your spending, and get actionable advice instantly.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
          <button
            className="bg-brand text-white px-8 py-3 rounded-lg text-lg font-semibold shadow hover:bg-brand/90 transition"
            onClick={() => setShowAuth(true)}
          >
            Get Started
          </button>
          <button
            className="bg-white border border-brand text-brand px-8 py-3 rounded-lg text-lg font-semibold shadow hover:bg-brand/10 hover:text-brand-dark transition"
            onClick={() => router.push("/bank-statement")}
          >
            Try Bank Statement Upload
          </button>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white/80 text-foreground">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-12 text-center">
          <div className="p-6 rounded-xl shadow bg-gradient-to-br from-blue-100 to-white">
            <h2 className="text-2xl font-bold mb-2 text-brand">AI Insights</h2>
            <p className="text-base">Get personalized, actionable financial advice powered by OpenAI and Deepseek. Your data, your future.</p>
          </div>
          <div className="p-6 rounded-xl shadow bg-gradient-to-br from-purple-100 to-white">
            <h2 className="text-2xl font-bold mb-2 text-purple-600">Bank Statement Upload</h2>
            <p className="text-base">Upload your PDF/CSV bank statement and let AlgoFinny extract, analyze, and visualize your monthly spending.</p>
          </div>
          <div className="p-6 rounded-xl shadow bg-gradient-to-br from-green-100 to-white">
            <h2 className="text-2xl font-bold mb-2 text-green-600">Seamless Experience</h2>
            <p className="text-base">Modern, secure, and mobile-friendly. Effortlessly manage transactions and track your financial health.</p>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-950 p-8 rounded-lg shadow-lg max-w-md w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              onClick={() => setShowAuth(false)}
              aria-label="Close"
            >
              ×
            </button>
            <AuthForm
              onAuthed={() => {
                setShowAuth(false);
                router.push("/app");
              }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground bg-white/70 mt-auto border-t">
        <div className="mb-2 font-semibold text-brand">AlgoFinny</div>
        <div>AI-powered finance for everyone. &copy; {new Date().getFullYear()} All rights reserved.</div>
      </footer>
    </div>
  );
}
