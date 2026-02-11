"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { ProjectCard } from "@/components/ProjectCard"
import { NewProjectDialog } from "@/components/NewProjectDialog"
import { Loader2 } from "lucide-react"

export default function ProjectsPage() {
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        setLoading(true)
        try {
            const res = await apiClient.get('/projects')
            setProjects(res.data)
        } catch (error) {
            console.error("Failed to fetch projects", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">專案列表</h1>
                    <p className="text-gray-500 mt-1">管理您的所有文件追蹤專案</p>
                </div>
                <NewProjectDialog onProjectCreated={fetchProjects} />
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.length === 0 ? (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            尚無專案，請點擊右上方按鈕新增。
                        </div>
                    ) : (
                        projects.map((project: any) => (
                            <ProjectCard
                                key={project.id}
                                id={project.id}
                                name={project.name}
                                description={project.description}
                                // status, docCount, eventCount missing from API response for now
                                // API returns simple fields. We can update backend later to include counts or mock them.
                                docCount={0}
                                eventCount={0}
                            />
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
