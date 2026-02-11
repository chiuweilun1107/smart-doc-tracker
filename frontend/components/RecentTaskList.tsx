
"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertCircle, CheckCircle2, ChevronRight, ChevronDown, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface Task {
    id: string
    title: string
    due_date: string
    status: string
    document_id?: string
    documents?: {
        original_filename?: string
        project_id?: string
        projects?: {
            id: string
            name: string
        }
    }
}

interface RecentTaskListProps {
    tasks: Task[]
}

function getRelativeDate(dueDate: string): string {
    const due = new Date(dueDate)
    due.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < -1) return `逾期 ${Math.abs(diffDays)} 天`
    if (diffDays === -1) return "逾期 1 天"
    if (diffDays === 0) return "今天到期"
    if (diffDays === 1) return "明天到期"
    if (diffDays <= 7) return `${diffDays} 天後`
    return due.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })
}

interface SectionProps {
    title: string
    count: number
    tasks: Task[]
    colorClass: string
    bgClass?: string
    defaultExpanded?: boolean
    onTaskClick: (task: Task) => void
}

function TaskSection({ title, count, tasks, colorClass, bgClass, defaultExpanded = true, onTaskClick }: SectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded)

    if (count === 0) return null

    return (
        <div className={`rounded-lg ${bgClass || ""}`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left group"
                aria-expanded={expanded}
            >
                {expanded ? (
                    <ChevronDown className={`w-3.5 h-3.5 ${colorClass}`} />
                ) : (
                    <ChevronRight className={`w-3.5 h-3.5 ${colorClass}`} />
                )}
                <span className={`text-xs font-semibold uppercase tracking-wider ${colorClass}`}>
                    {title}
                </span>
                <span className="text-xs text-muted-foreground">({count})</span>
                <div className="flex-1 border-t border-border ml-2" />
            </button>

            {expanded && (
                <div className="space-y-1 px-1 pb-2">
                    {tasks.map((task) => (
                        <TaskRow key={task.id} task={task} onClick={onTaskClick} />
                    ))}
                </div>
            )}
        </div>
    )
}

function TaskRow({ task, onClick }: { task: Task; onClick: (task: Task) => void }) {
    const hasLink = task.documents?.projects?.id || task.documents?.project_id
    const projectName = task.documents?.projects?.name
    const relativeDate = getRelativeDate(task.due_date)
    const isOverdue = new Date(task.due_date) < new Date() && task.status !== "completed" && task.status !== "confirmed"
    const isConfirmed = task.status === "confirmed"

    return (
        <div
            onClick={() => onClick(task)}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(task) } }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group ${hasLink ? "cursor-pointer hover:bg-accent/50" : ""}`}
        >
            {/* Icon */}
            {isConfirmed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
            ) : isOverdue ? (
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
            ) : (
                <Calendar className="w-4 h-4 text-blue-400 dark:text-blue-300 flex-shrink-0" />
            )}

            {/* Title */}
            <span className={`text-sm font-medium truncate flex-1 min-w-0 ${isConfirmed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {task.title}
            </span>

            {/* Project tag */}
            {projectName && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 flex-shrink-0 hidden sm:inline">
                    {projectName}
                </span>
            )}

            {/* Date */}
            <span className={`text-xs tabular-nums flex-shrink-0 w-20 text-right ${isOverdue ? "text-red-500 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>
                {relativeDate}
            </span>

            {/* Status badge - only for overdue and confirmed */}
            {isOverdue && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">逾期</Badge>
            )}
            {isConfirmed && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 flex-shrink-0">已確認</Badge>
            )}

            {/* Nav arrow */}
            {hasLink && (
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            )}
        </div>
    )
}

export function RecentTaskList({ tasks }: RecentTaskListProps) {
    const router = useRouter()
    const [selectedProject, setSelectedProject] = useState<string>("all")

    const projectNames = useMemo(() => {
        const names = new Set<string>()
        tasks.forEach(t => {
            const name = t.documents?.projects?.name
            if (name) names.add(name)
        })
        return Array.from(names).sort()
    }, [tasks])

    const { overdue, thisWeek, later, confirmed } = useMemo(() => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const weekLater = new Date(now)
        weekLater.setDate(weekLater.getDate() + 7)

        const filtered = selectedProject === "all"
            ? tasks
            : tasks.filter(t => t.documents?.projects?.name === selectedProject)

        const overdue: Task[] = []
        const thisWeek: Task[] = []
        const later: Task[] = []
        const confirmed: Task[] = []

        filtered.forEach(task => {
            if (task.status === "confirmed" || task.status === "completed") {
                confirmed.push(task)
                return
            }
            const due = new Date(task.due_date)
            due.setHours(0, 0, 0, 0)

            if (due < now) overdue.push(task)
            else if (due <= weekLater) thisWeek.push(task)
            else later.push(task)
        })

        return { overdue, thisWeek, later, confirmed }
    }, [tasks, selectedProject])

    const handleTaskClick = (task: Task) => {
        const projectId = task.documents?.projects?.id || task.documents?.project_id
        const documentId = task.document_id

        if (projectId && documentId) {
            router.push(`/projects/${projectId}?document=${documentId}`)
        } else if (projectId) {
            router.push(`/projects/${projectId}`)
        }
    }

    const totalFiltered = overdue.length + thisWeek.length + later.length + confirmed.length

    if (tasks.length === 0) {
        return <div className="text-center py-6 text-muted-foreground text-sm">暫無近期任務</div>
    }

    return (
        <div className="space-y-2">
            {/* Filter bar */}
            {projectNames.length > 1 && (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                                <Filter className="w-3.5 h-3.5" />
                                {selectedProject === "all" ? "所有專案" : selectedProject}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => setSelectedProject("all")}
                                className={selectedProject === "all" ? "bg-accent" : ""}
                            >
                                所有專案
                            </DropdownMenuItem>
                            {projectNames.map(name => (
                                <DropdownMenuItem
                                    key={name}
                                    onClick={() => setSelectedProject(name)}
                                    className={selectedProject === name ? "bg-accent" : ""}
                                >
                                    {name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            {/* Empty after filter */}
            {totalFiltered === 0 && selectedProject !== "all" && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                    「{selectedProject}」暫無待辦事項
                    <button
                        onClick={() => setSelectedProject("all")}
                        className="block mx-auto mt-2 text-xs text-primary hover:underline"
                    >
                        顯示所有專案
                    </button>
                </div>
            )}

            {/* Scrollable task sections */}
            <div className="max-h-[600px] overflow-y-auto pr-1 scroll-smooth space-y-3">
                <TaskSection
                    title="逾期"
                    count={overdue.length}
                    tasks={overdue}
                    colorClass="text-red-600 dark:text-red-400"
                    bgClass="bg-red-50/40 dark:bg-red-950/15 border border-red-200/50 dark:border-red-900/30"
                    onTaskClick={handleTaskClick}
                />
                <TaskSection
                    title="本週到期"
                    count={thisWeek.length}
                    tasks={thisWeek}
                    colorClass="text-amber-600 dark:text-amber-400"
                    onTaskClick={handleTaskClick}
                />
                <TaskSection
                    title="之後"
                    count={later.length}
                    tasks={later}
                    colorClass="text-blue-500 dark:text-blue-300"
                    onTaskClick={handleTaskClick}
                />
                <TaskSection
                    title="已確認"
                    count={confirmed.length}
                    tasks={confirmed}
                    colorClass="text-green-600 dark:text-green-400"
                    bgClass="bg-green-50/20 dark:bg-green-950/10"
                    defaultExpanded={false}
                    onTaskClick={handleTaskClick}
                />
            </div>
        </div>
    )
}
