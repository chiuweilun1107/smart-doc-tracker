
import { useState } from "react"
import { apiClient } from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarIcon, Save, Check } from "lucide-react"

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

    const handleEdit = (event: Event) => {
        setEditingId(event.id)
        setEditForm({ ...event })
    }

    const handleSave = async (id: string) => {
        setSaving(true)
        try {
            await apiClient.put(`/documents/events/${id}`, editForm)
            setEditingId(null)
            onUpdate() // Refresh data
        } catch (error) {
            console.error("Update failed", error)
            alert("更新失敗")
        } finally {
            setSaving(false)
        }
    }

    if (events.length === 0) {
        return <div className="text-center py-10 text-gray-500">尚無解析出的事件</div>
    }

    return (
        <div className="space-y-4">
            {events.map(event => (
                <div key={event.id} className="p-4 border rounded-lg bg-white shadow-sm flex flex-col space-y-3">
                    {editingId === event.id ? (
                        // Edit Mode
                        <div className="space-y-3">
                            <Input
                                value={editForm.title}
                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                placeholder="事件標題"
                            />
                            <div className="flex items-center space-x-2">
                                <CalendarIcon className="w-4 h-4 text-gray-500" />
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
                                <h3 className="font-medium">{event.title}</h3>
                                <Badge variant={event.confidence_score > 80 ? "outline" : "secondary"}>
                                    信任度: {event.confidence_score}%
                                </Badge>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                {event.due_date}
                            </div>
                            <div className="pt-2 border-t flex justify-end">
                                <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                                    編輯 / 確認
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            ))}
        </div>
    )
}

import { Loader2 } from "lucide-react" // Import needed for saving state icon
