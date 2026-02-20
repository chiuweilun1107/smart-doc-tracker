"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { ProjectCard } from "@/components/ProjectCard"
import { NewProjectDialog } from "@/components/NewProjectDialog"
import { FolderOpen } from "lucide-react"
import { LoadingState } from "@/components/LoadingState"
import { EmptyState } from "@/components/EmptyState"

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
        <div className="container mx-auto py-8 px-4 md:px-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">專案列表</h1>
                    <p className="text-muted-foreground mt-1">管理您的所有文件追蹤專案</p>
                </div>
                <NewProjectDialog onProjectCreated={fetchProjects} />
            </div>

            {loading ? (
                <LoadingState />
            ) : projects.length === 0 ? (
                <EmptyState
                    icon={FolderOpen}
                    title="尚無專案"
                    description="建立您的第一個專案，開始追蹤文件截止日期。"
                    action={<NewProjectDialog onProjectCreated={fetchProjects} />}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project: any) => (
                            <ProjectCard
                                key={project.id}
                                id={project.id}
                                name={project.name}
                                description={project.description}
                                docCount={project.doc_count ?? 0}
                                eventCount={project.event_count ?? 0}
                                createdAt={project.created_at}
                                onProjectChanged={fetchProjects}
                            />
                        ))}
                </div>
            )}
        </div>
    )
}
