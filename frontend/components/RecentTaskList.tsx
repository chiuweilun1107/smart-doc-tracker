
"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import {
    Calendar, AlertCircle, CheckCircle2, ChevronRight, ChevronDown,
    ChevronLeft, Filter, List, CalendarDays,
} from "lucide-react"
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

// ─── Utilities ───

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

function toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getTaskStatus(task: Task): "overdue" | "confirmed" | "pending" {
    if (task.status === "confirmed" || task.status === "completed") return "confirmed"
    const due = new Date(task.due_date)
    due.setHours(0, 0, 0, 0)
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    if (due < now) return "overdue"
    return "pending"
}

// ─── List View Components ───

interface SectionProps {
    title: string
    count: number
    tasks: Task[]
    colorClass: string
    bgClass?: string
    defaultExpanded?: boolean
    onTaskClick: (task: Task) => void
    projectColorMap?: Map<string, typeof PROJECT_COLORS[0]>
}

function TaskSection({ title, count, tasks, colorClass, bgClass, defaultExpanded = true, onTaskClick, projectColorMap }: SectionProps) {
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
                        <TaskRow key={task.id} task={task} onClick={onTaskClick} projectColorMap={projectColorMap} />
                    ))}
                </div>
            )}
        </div>
    )
}

function TaskRow({ task, onClick, projectColorMap }: {
    task: Task
    onClick: (task: Task) => void
    projectColorMap?: Map<string, typeof PROJECT_COLORS[0]>
}) {
    const hasLink = task.documents?.projects?.id || task.documents?.project_id
    const projectName = task.documents?.projects?.name
    const relativeDate = getRelativeDate(task.due_date)
    const status = getTaskStatus(task)
    const isOverdue = status === "overdue"
    const isConfirmed = status === "confirmed"
    const projectColor = projectName && projectColorMap?.get(projectName)

    return (
        <div
            onClick={() => onClick(task)}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(task) } }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group ${hasLink ? "cursor-pointer hover:bg-accent/50" : ""}`}
        >
            {isConfirmed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0" />
            ) : isOverdue ? (
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0" />
            ) : (
                <Calendar className="w-4 h-4 text-blue-400 dark:text-blue-300 flex-shrink-0" />
            )}

            <span className={`text-sm font-medium truncate flex-1 min-w-0 ${isConfirmed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                {task.title}
            </span>

            {projectName && (
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 hidden sm:inline ${projectColor ? projectColor.label : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"}`}>
                    {projectName}
                </span>
            )}

            <span className={`text-xs tabular-nums flex-shrink-0 w-20 text-right ${isOverdue ? "text-red-500 dark:text-red-400 font-medium" : "text-muted-foreground"}`}>
                {relativeDate}
            </span>

            {isOverdue && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 flex-shrink-0">逾期</Badge>
            )}
            {isConfirmed && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 flex-shrink-0">已確認</Badge>
            )}

            {hasLink && (
                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            )}
        </div>
    )
}

// ─── Calendar View ───

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"]
const MONTH_NAMES = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]

// Project color palette — each project gets a unique color
const PROJECT_COLORS = [
    { dot: "bg-blue-500", dotLight: "bg-blue-300", label: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    { dot: "bg-purple-500", dotLight: "bg-purple-300", label: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    { dot: "bg-emerald-500", dotLight: "bg-emerald-300", label: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    { dot: "bg-orange-500", dotLight: "bg-orange-300", label: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
    { dot: "bg-pink-500", dotLight: "bg-pink-300", label: "bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
    { dot: "bg-cyan-500", dotLight: "bg-cyan-300", label: "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" },
    { dot: "bg-indigo-500", dotLight: "bg-indigo-300", label: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
    { dot: "bg-rose-500", dotLight: "bg-rose-300", label: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300" },
]

function useProjectColorMap(tasks: Task[]) {
    return useMemo(() => {
        const map = new Map<string, typeof PROJECT_COLORS[0]>()
        const seen = new Set<string>()
        tasks.forEach(t => {
            const name = t.documents?.projects?.name
            if (name && !seen.has(name)) {
                seen.add(name)
                map.set(name, PROJECT_COLORS[map.size % PROJECT_COLORS.length])
            }
        })
        return map
    }, [tasks])
}

function CalendarView({ tasks, onTaskClick, projectColorMap }: {
    tasks: Task[]
    onTaskClick: (task: Task) => void
    projectColorMap: Map<string, typeof PROJECT_COLORS[0]>
}) {
    const today = new Date()
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())
    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    // Build a map of date -> tasks
    const tasksByDate = useMemo(() => {
        const map = new Map<string, Task[]>()
        tasks.forEach(task => {
            const key = task.due_date.slice(0, 10) // "YYYY-MM-DD"
            const existing = map.get(key) || []
            existing.push(task)
            map.set(key, existing)
        })
        return map
    }, [tasks])

    // Generate calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1)
        // Monday = 0, Sunday = 6
        let startDow = firstDay.getDay() - 1
        if (startDow < 0) startDow = 6

        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

        const days: { date: Date; inMonth: boolean }[] = []

        // Previous month padding
        for (let i = startDow - 1; i >= 0; i--) {
            days.push({
                date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - i),
                inMonth: false,
            })
        }
        // Current month
        for (let d = 1; d <= daysInMonth; d++) {
            days.push({
                date: new Date(currentYear, currentMonth, d),
                inMonth: true,
            })
        }
        // Next month padding to fill 6 rows
        const remaining = 42 - days.length
        for (let d = 1; d <= remaining; d++) {
            days.push({
                date: new Date(currentYear, currentMonth + 1, d),
                inMonth: false,
            })
        }

        return days
    }, [currentYear, currentMonth])

    const prevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11)
            setCurrentYear(y => y - 1)
        } else {
            setCurrentMonth(m => m - 1)
        }
        setSelectedDate(null)
    }

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0)
            setCurrentYear(y => y + 1)
        } else {
            setCurrentMonth(m => m + 1)
        }
        setSelectedDate(null)
    }

    const goToToday = () => {
        setCurrentMonth(today.getMonth())
        setCurrentYear(today.getFullYear())
        setSelectedDate(toDateKey(today))
    }

    const selectedTasks = selectedDate ? (tasksByDate.get(selectedDate) || []) : []
    const todayKey = toDateKey(today)

    // Get unique project dots for a given day's tasks
    const getProjectDots = (dayTasks: Task[], isSelected: boolean) => {
        const seen = new Set<string>()
        const dots: { color: string }[] = []
        dayTasks.forEach(task => {
            const name = task.documents?.projects?.name || "_unknown"
            if (!seen.has(name)) {
                seen.add(name)
                const pc = projectColorMap.get(name)
                dots.push({ color: isSelected ? (pc?.dotLight || "bg-blue-300") : (pc?.dot || "bg-blue-500") })
            }
        })
        return dots
    }

    return (
        <div className="space-y-3">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-semibold w-24 text-center">
                        {currentYear} 年 {MONTH_NAMES[currentMonth]}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={goToToday}>
                    今天
                </Button>
            </div>

            {/* Project legend */}
            {projectColorMap.size > 1 && (
                <div className="flex flex-wrap gap-2 px-1">
                    {Array.from(projectColorMap.entries()).map(([name, color]) => (
                        <div key={name} className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                            <span className="text-[11px] text-muted-foreground">{name}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-border">
                        <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-300 dark:ring-red-800" />
                        <span className="text-[11px] text-muted-foreground">逾期</span>
                    </div>
                </div>
            )}

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0">
                {WEEKDAYS.map(day => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0">
                {calendarDays.map(({ date, inMonth }, i) => {
                    const key = toDateKey(date)
                    const dayTasks = tasksByDate.get(key) || []
                    const isToday = key === todayKey
                    const isSelected = key === selectedDate
                    const hasOverdue = dayTasks.some(t => getTaskStatus(t) === "overdue")
                    const dots = dayTasks.length > 0 ? getProjectDots(dayTasks, isSelected) : []

                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedDate(isSelected ? null : key)}
                            className={`
                                relative flex flex-col items-center py-1.5 rounded-lg text-sm transition-colors
                                ${!inMonth ? "text-muted-foreground/40" : "text-foreground"}
                                ${isToday && !isSelected ? "bg-primary/10 font-bold" : ""}
                                ${isSelected ? "bg-primary text-primary-foreground font-bold" : "hover:bg-accent/50"}
                            `}
                        >
                            <span className={`tabular-nums ${hasOverdue && inMonth && !isSelected ? "text-red-500 dark:text-red-400 font-bold" : ""}`}>
                                {date.getDate()}
                            </span>
                            {/* Project-colored dots */}
                            {dots.length > 0 && (
                                <div className="flex gap-0.5 mt-0.5">
                                    {dots.map((d, j) => (
                                        <span key={j} className={`w-1.5 h-1.5 rounded-full ${d.color} ${hasOverdue ? "ring-1 ring-red-400" : ""}`} />
                                    ))}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Selected date task list */}
            {selectedDate && (
                <div className="border-t border-border pt-3 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground px-1 mb-2">
                        {new Date(selectedDate + "T00:00:00").toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}
                        {selectedTasks.length > 0 && ` - ${selectedTasks.length} 筆`}
                    </p>
                    {selectedTasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">此日無任務</p>
                    ) : (
                        selectedTasks.map(task => (
                            <TaskRow key={task.id} task={task} onClick={onTaskClick} projectColorMap={projectColorMap} />
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Main Component ───

export function RecentTaskList({ tasks }: RecentTaskListProps) {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
    const [selectedProject, setSelectedProject] = useState<string>("all")

    const projectColorMap = useProjectColorMap(tasks)

    const projectNames = useMemo(() => {
        return Array.from(projectColorMap.keys()).sort()
    }, [projectColorMap])

    const filteredTasks = useMemo(() => {
        if (selectedProject === "all") return tasks
        return tasks.filter(t => t.documents?.projects?.name === selectedProject)
    }, [tasks, selectedProject])

    const { overdue, thisWeek, later, confirmed } = useMemo(() => {
        const now = new Date()
        now.setHours(0, 0, 0, 0)
        const weekLater = new Date(now)
        weekLater.setDate(weekLater.getDate() + 7)

        const overdue: Task[] = []
        const thisWeek: Task[] = []
        const later: Task[] = []
        const confirmed: Task[] = []

        filteredTasks.forEach(task => {
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
    }, [filteredTasks])

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
            {/* Toolbar: filter + view toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <List className="w-3.5 h-3.5" />
                        清單
                    </button>
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${viewMode === "calendar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <CalendarDays className="w-3.5 h-3.5" />
                        行事曆
                    </button>
                </div>

                {projectNames.length > 1 && (
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
                )}
            </div>

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

            {/* View content */}
            {viewMode === "list" ? (
                <div className="max-h-[600px] overflow-y-auto pr-1 scroll-smooth space-y-3">
                    <TaskSection
                        title="逾期"
                        count={overdue.length}
                        tasks={overdue}
                        colorClass="text-red-600 dark:text-red-400"
                        bgClass="bg-red-50/40 dark:bg-red-950/15 border border-red-200/50 dark:border-red-900/30"
                        onTaskClick={handleTaskClick}
                        projectColorMap={projectColorMap}
                    />
                    <TaskSection
                        title="本週到期"
                        count={thisWeek.length}
                        tasks={thisWeek}
                        colorClass="text-amber-600 dark:text-amber-400"
                        onTaskClick={handleTaskClick}
                        projectColorMap={projectColorMap}
                    />
                    <TaskSection
                        title="之後"
                        count={later.length}
                        tasks={later}
                        colorClass="text-blue-500 dark:text-blue-300"
                        onTaskClick={handleTaskClick}
                        projectColorMap={projectColorMap}
                    />
                    <TaskSection
                        title="已確認"
                        count={confirmed.length}
                        tasks={confirmed}
                        colorClass="text-green-600 dark:text-green-400"
                        bgClass="bg-green-50/20 dark:bg-green-950/10"
                        defaultExpanded={false}
                        onTaskClick={handleTaskClick}
                        projectColorMap={projectColorMap}
                    />
                </div>
            ) : (
                <CalendarView tasks={filteredTasks} onTaskClick={handleTaskClick} projectColorMap={projectColorMap} />
            )}
        </div>
    )
}
