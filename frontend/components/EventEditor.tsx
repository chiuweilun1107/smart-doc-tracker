
import { useState } from "react"
import { apiClient } from "@/lib/api"
import { toast } from "@/lib/toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Save, Check, Edit, CheckCircle2, Loader2 } from "lucide-react"

interface Event {
    id: string
    title: string
    due_date: string
    status: string
    confidence_score: number
}

interface EventEditorProps {
    events: Event[]
    onUpdate: () => void
}

export function EventEditor({ events, onUpdate }: EventEditorProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Event>>({})
    const [saving, setSaving] = useState(false)

    // Format date to clean display (YYYY年MM月DD日)
    const formatDate = (dateString: string) => {
        if (!dateString) return '未指定'

        try {
            // Handle both ISO format and date-only format
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return dateString

            const year = date.getFullYear()
            const month = date.getMonth() + 1
            const day = date.getDate()

            return `${year}年${month}月${day}日`
        } catch {
            return dateString
        }
    }

    const handleEdit = (event: Event) => {
        setEditingId(event.id)
        // Convert ISO timestamp to YYYY-MM-DD format for date input
        const formattedDate = event.due_date ? event.due_date.split('T')[0] : ''
        setEditForm({
            ...event,
            due_date: formattedDate
        })
    }

    const handleSave = async (id: string) => {
        setSaving(true)
        try {
            await apiClient.put(`/documents/events/${id}`, editForm)
            setEditingId(null)
            toast("事件已更新", "success")
            onUpdate() // Refresh data
        } catch (error) {
            console.error("Update failed", error)
            toast("更新事件失敗", "error")
        } finally {
            setSaving(false)
        }
    }

    const handleConfirm = async (id: string) => {
        try {
            await apiClient.put(`/documents/events/${id}`, { status: 'confirmed' })
            toast("已確認此事件", "success")
            onUpdate() // Refresh data
        } catch (error) {
            console.error("Confirm failed", error)
            toast("確認失敗", "error")
        }
    }

    const handleUnconfirm = async (id: string) => {
        try {
            await apiClient.put(`/documents/events/${id}`, { status: 'pending' })
            toast("已取消確認", "success")
            onUpdate() // Refresh data
        } catch (error) {
            console.error("Unconfirm failed", error)
            toast("取消確認失敗", "error")
        }
    }

    if (events.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">尚無解析出的事件</div>
    }

    // Sort events by due_date (earliest first)
    const sortedEvents = [...events].sort((a, b) => {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1  // Events without dates go to the end
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    })

    return (
        <div className="space-y-4">
            {/* Info about confidence score */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                <p className="font-medium mb-1">💡 關於信任度</p>
                <p>信任度是 AI 對該截止日期確定性的評估，分數越高表示 AI 越確定這是一個明確的截止日期。建議檢查低於 80% 的項目。</p>
            </div>
            {sortedEvents.map(event => (
                <div key={event.id} className="p-4 border rounded-lg bg-card shadow-sm flex flex-col space-y-3">
                    {editingId === event.id ? (
                        // Edit Mode
                        <div className="space-y-3">
                            <Input
                                value={editForm.title}
                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="事件標題"
                            />
                            <div className="flex items-center space-x-2">
                                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={editForm.due_date}
                                    onChange={e => setEditForm({ ...editForm, due_date: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>取消</Button>
                                <Button size="sm" onClick={() => handleSave(event.id)} disabled={saving}>
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                                    儲存
                                </Button>
                            </div>
                        </div>
                    ) : (
                        // View Mode
                        <>
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2 flex-1">
                                    <h3 className="font-medium text-foreground">{event.title}</h3>
                                    {event.status === 'confirmed' && (
                                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                            <Check className="w-3 h-3 mr-1" />
                                            已確認
                                        </Badge>
                                    )}
                                </div>
                                <Badge
                                    variant={event.confidence_score > 80 ? "outline" : "secondary"}
                                    className="ml-2 flex-shrink-0"
                                    title="AI 對此截止日期的確定程度"
                                >
                                    {event.confidence_score}%
                                </Badge>
                            </div>
                            <div className="flex items-center text-sm text-foreground/80">
                                <CalendarIcon className="w-4 h-4 mr-2" />
                                <span className="font-medium">{formatDate(event.due_date)}</span>
                            </div>
                            <div className="pt-2 border-t flex justify-end gap-2">
                                {event.status === 'confirmed' ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUnconfirm(event.id)}
                                        className="text-foreground/80 hover:text-foreground hover:bg-muted"
                                    >
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        取消確認
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleConfirm(event.id)}
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    >
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        確認
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                                    <Edit className="w-3 h-3 mr-1" />
                                    編輯
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    )
}
