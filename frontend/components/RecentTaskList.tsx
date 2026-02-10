
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertCircle, CheckCircle2 } from "lucide-react"

interface Task {
    id: string
    title: string
    due_date: string
    status: string
    project_name?: string // Optional if joined
}

interface RecentTaskListProps {
    tasks: Task[]
}

export function RecentTaskList({ tasks }: RecentTaskListProps) {
    if (tasks.length === 0) {
        return <div className="text-center py-6 text-gray-500 text-sm">暫無近期任務</div>
    }

    return (
        <div className="space-y-4">
            {tasks.map((task) => {
                const isOverdue = new Date(task.due_date) < new Date() && task.status !== "completed"

                return (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                        <div className="flex items-start space-x-3">
                            {task.status === "completed" ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                            ) : isOverdue ? (
                                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            ) : (
                                <Calendar className="w-5 h-5 text-blue-500 mt-0.5" />
                            )}

                            <div>
                                <p className="font-medium text-sm text-gray-900">{task.title}</p>
                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                    {task.project_name && <span className="mr-2 px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">{task.project_name}</span>}
                                    <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            {isOverdue ? (
                                <Badge variant="destructive">已逾期</Badge>
                            ) : (
                                <Badge variant="outline">{task.status === "pending" ? "進行中" : task.status}</Badge>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
