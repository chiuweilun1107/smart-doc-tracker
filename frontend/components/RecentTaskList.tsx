
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertCircle, CheckCircle2, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"

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

export function RecentTaskList({ tasks }: RecentTaskListProps) {
    const router = useRouter()

    if (tasks.length === 0) {
        return <div className="text-center py-6 text-muted-foreground text-sm">暫無近期任務</div>
    }

    const handleTaskClick = (task: Task) => {
        // Extract project_id and document_id from nested structure
        const projectId = task.documents?.projects?.id || task.documents?.project_id
        const documentId = task.document_id

        if (projectId && documentId) {
            router.push(`/projects/${projectId}?document=${documentId}`)
        } else if (projectId) {
            router.push(`/projects/${projectId}`)
        }
    }

    return (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scroll-smooth">
            {tasks.map((task) => {
                const isOverdue = new Date(task.due_date) < new Date() && task.status !== "completed"
                const projectName = task.documents?.projects?.name
                const hasLink = task.documents?.projects?.id || task.documents?.project_id

                return (
                    <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className={`flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm ${hasLink ? 'cursor-pointer hover:border-primary hover:shadow-md transition-all' : ''}`}
                    >
                        <div className="flex items-start space-x-3 flex-1">
                            {task.status === "completed" || task.status === "confirmed" ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            ) : isOverdue ? (
                                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                            ) : (
                                <Calendar className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-foreground">{task.title}</p>
                                <div className="flex items-center text-xs text-muted-foreground mt-1 gap-2">
                                    {projectName && (
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 rounded font-medium">
                                            {projectName}
                                        </span>
                                    )}
                                    <span>{new Date(task.due_date).toLocaleDateString('zh-TW')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {task.status === "confirmed" ? (
                                <Badge variant="default" className="bg-green-600">confirmed</Badge>
                            ) : isOverdue ? (
                                <Badge variant="destructive">已逾期</Badge>
                            ) : (
                                <Badge variant="outline">{task.status === "pending" ? "進行中" : task.status}</Badge>
                            )}
                            {hasLink && (
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
