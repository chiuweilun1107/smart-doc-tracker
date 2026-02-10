
"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { StatCard } from "@/components/StatCard"
import { RecentTaskList } from "@/components/RecentTaskList"
import { AlertTriangle, Clock, FileText, LayoutDashboard } from "lucide-react"

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            // Mock data in case backend is slow or failing (for robust UI dev)
            // Remove this when API is fully verified
            /*
            setStats({
                total_projects: 12,
                total_documents: 45,
                overdue_tasks: 3,
                upcoming_tasks: 5,
                recent_events: [
                    { id: "1", title: "第一期款支付", due_date: "2024-02-01", status: "pending", project_name: "信義案" },
                    { id: "2", title: "期中報告提交", due_date: "2024-02-15", status: "pending", project_name: "行銷案" },
                ]
            })
            setLoading(false)
            */

            const res = await apiClient.get('/dashboard/stats')
            setStats(res.data)
        } catch (error) {
            console.error("Failed to fetch dashboard stats", error)
            // Fallback for demo if API fails (e.g. no data yet)
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
                <p className="text-gray-500">歡迎回來，這是您的專案概況。</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="逾期任務"
                    value={stats?.overdue_tasks || 0}
                    description="請盡快處理"
                    icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
                    variant={stats?.overdue_tasks > 0 ? "destructive" : "default"}
                />
                <StatCard
                    title="即將到期"
                    value={stats?.upcoming_tasks || 0}
                    description="未來 7 天內"
                    icon={<Clock className="w-4 h-4 text-amber-500" />}
                    variant={stats?.upcoming_tasks > 0 ? "warning" : "default"}
                />
                <StatCard
                    title="活躍專案"
                    value={stats?.total_projects || 0}
                    icon={<LayoutDashboard className="w-4 h-4 text-blue-500" />}
                />
                <StatCard
                    title="總文件數"
                    value={stats?.total_documents || 0}
                    icon={<FileText className="w-4 h-4 text-slate-500" />}
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
                    <div className="p-4 border rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-500 mb-4">快速捷徑</p>
                        <div className="space-y-2">
                            <a href="/projects" className="block w-full py-2 px-4 bg-white border rounded hover:bg-gray-50 text-center text-sm">
                                前往專案列表
                            </a>
                            {/* Add more shortcuts */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
