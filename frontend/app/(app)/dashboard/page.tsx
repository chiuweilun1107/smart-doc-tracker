
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { StatCard } from "@/components/StatCard"
import { RecentTaskList } from "@/components/RecentTaskList"
import { AlertTriangle, Clock, FileText, LayoutDashboard } from "lucide-react"

export default function DashboardPage() {
    const router = useRouter()
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            console.log('📊 Fetching dashboard stats...')
            const res = await apiClient.get('/dashboard/stats')
            console.log('✅ Dashboard stats loaded:', res.data)
            setStats(res.data)
        } catch (error: any) {
            console.error("❌ Failed to fetch dashboard stats:", error)

            // If 401, user needs to login - let middleware handle it or redirect manually
            if (error.response?.status === 401) {
                console.warn('🔒 Not authenticated, clearing session and redirecting to login...')
                // Clear any stale session data
                localStorage.clear()
                sessionStorage.clear()
                // Redirect immediately
                router.push('/login')
                return
            }

            // For other errors, show fallback data
            console.log('📝 Using fallback data (empty stats)')
            setStats({
                total_projects: 0,
                total_documents: 0,
                overdue_tasks: 0,
                upcoming_tasks: 0,
                recent_events: []
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-8">載入中...</div>
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center">
                    <LayoutDashboard className="mr-2" />
                    儀表板
                </h1>
                <p className="text-muted-foreground">歡迎回來，這是您的專案概況。</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="逾期任務"
                    value={stats?.overdue_tasks || 0}
                    description="請盡快處理"
                    icon={<AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />}
                    variant={stats?.overdue_tasks > 0 ? "destructive" : "default"}
                />
                <StatCard
                    title="即將到期"
                    value={stats?.upcoming_tasks || 0}
                    description="未來 7 天內"
                    icon={<Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />}
                    variant={stats?.upcoming_tasks > 0 ? "warning" : "default"}
                />
                <StatCard
                    title="活躍專案"
                    value={stats?.total_projects || 0}
                    icon={<LayoutDashboard className="w-4 h-4 text-blue-500 dark:text-blue-400" />}
                />
                <StatCard
                    title="總文件數"
                    value={stats?.total_documents || 0}
                    icon={<FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                />
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Recent Tasks */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-xl font-semibold">近期待辦事項</h2>
                    <RecentTaskList tasks={stats?.recent_events || []} />
                </div>

                {/* Right Column: Quick Actions or Calendar (Future) */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">快速操作</h2>
                    <div className="p-4 border rounded-xl bg-card text-card-foreground shadow-sm">
                        <p className="text-sm text-muted-foreground mb-4 font-medium uppercase tracking-wider">Quick Actions</p>
                        <div className="space-y-2">
                            <a href="/projects" className="block w-full py-2 px-4 bg-background border rounded-lg hover:bg-accent hover:text-accent-foreground text-center text-sm transition-colors">
                                前往專案列表
                            </a>
                            <a href="/settings" className="block w-full py-2 px-4 bg-background border rounded-lg hover:bg-accent hover:text-accent-foreground text-center text-sm transition-colors">
                                系統設定
                            </a>
                            {/* Add more shortcuts */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
