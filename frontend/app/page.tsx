
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Bot, Calendar, FileText } from "lucide-react"
import { createSupabaseServerClient } from "@/lib/supabase-server"

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-xl text-blue-600 dark:text-blue-500">
            <FileText className="w-6 h-6" />
            <span>Smart Doc Tracker</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#features" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">How it Works</a>
          </nav>
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 rounded-full px-6">
                  前往儀表板 <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-slate-700 dark:text-slate-300">
                    Log In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 rounded-full px-6">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 pt-24">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="container mx-auto px-4 text-center z-10 relative">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 mb-8 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
              <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2 animate-pulse"></span>
              v2.0 Now Available with Line Integration
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight">
              Never Miss a <span className="text-blue-600">Government Tender</span><br className="hidden md:block" /> Deadline Again.
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed">
              AI-powered document tracking for smart teams. Automated parsing, Line notifications, and deadline management designed for efficiency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href={isLoggedIn ? "/dashboard" : "/signup"}>
                <Button size="lg" className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 text-base">
                  {isLoggedIn ? "前往儀表板" : "Start Tracking Now"} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="h-12 px-8 rounded-full border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900">
                  View Live Demo
                </Button>
              </Link>
            </div>
          </div>

          {/* Abstract Background Elements */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-3xl -z-10 dark:bg-blue-900/10"></div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Everything you need to ship faster</h2>
              <p className="text-slate-600 dark:text-slate-400">Streamline your tender management process with our powerful suite of tools.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">AI Document Parsing</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Automatically extract deadlines, milestones, and requirements from complex government tender documents using advanced OCR.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-6 text-emerald-600 dark:text-emerald-400">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Line Integration</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Get instant interactive notifications on Line. Mark tasks as complete directly from the chat app without opening the dashboard.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white dark:bg-slate-950 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center mb-6 text-amber-600 dark:text-amber-400">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Smart Scheduling</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Dynamic T-7, T-3, T-1 notification rules ensure you are always ahead of time. Visualize your timeline in a Gantt chart view.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 font-bold text-xl text-slate-900 dark:text-white mb-4 md:mb-0">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Smart Doc Tracker</span>
          </div>
          <div className="text-sm text-slate-500">
            © 2024 Smart Doc Tracker. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
