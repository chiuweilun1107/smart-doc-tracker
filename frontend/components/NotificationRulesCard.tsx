
"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { toast, confirm } from "@/lib/toast"
import { Bell, Trash2, Plus, Loader2, Mail, MessageSquare } from "lucide-react"

type NotificationRule = {
    id: string
    days_before: number
    severity: string
    is_active: boolean
    channels: string[]
}

export function NotificationRulesCard() {
    const [rules, setRules] = useState<NotificationRule[]>([])
    const [loading, setLoading] = useState(true)
    const [newDays, setNewDays] = useState("")
    const [newSeverity, setNewSeverity] = useState("info")
    const [newChannels, setNewChannels] = useState<string[]>(["line", "email"])
    const [adding, setAdding] = useState(false)

    const fetchRules = async () => {
        try {
            const res = await apiClient.get('/settings/rules')
            setRules(res.data)
        } catch (error) {
            console.error("Failed to fetch rules", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRules()
    }, [])

    const toggleChannel = (channel: string) => {
        setNewChannels(prev => {
            if (prev.includes(channel)) {
                // Don't allow empty
                if (prev.length === 1) return prev
                return prev.filter(c => c !== channel)
            }
            return [...prev, channel]
        })
    }

    const handleAddRule = async () => {
        if (!newDays) return
        setAdding(true)
        try {
            await apiClient.post('/settings/rules', {
                days_before: parseInt(newDays),
                severity: newSeverity,
                is_active: true,
                channels: newChannels,
            })
            setNewDays("")
            fetchRules()
        } catch (error) {
            console.error("Failed to add rule", error)
            toast("新增規則失敗", "error")
        } finally {
            setAdding(false)
        }
    }

    const handleDeleteRule = async (id: string) => {
        const confirmed = await confirm("確定要刪除此規則嗎？")
        if (!confirmed) return
        try {
            await apiClient.delete(`/settings/rules/${id}`)
            setRules(rules.filter(r => r.id !== id))
            toast("規則已刪除", "success")
        } catch (error) {
            console.error("Failed to delete rule", error)
            toast("刪除失敗", "error")
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "critical": return "bg-red-500 hover:bg-red-600"
            case "warning": return "bg-orange-500 hover:bg-orange-600"
            default: return "bg-blue-500 hover:bg-blue-600"
        }
    }

    const getChannelIcons = (channels: string[]) => {
        if (!channels) channels = ["line", "email"]
        return (
            <div className="flex items-center gap-1">
                {channels.includes("line") && (
                    <span title="LINE" className="text-green-600">
                        <MessageSquare className="w-3.5 h-3.5" />
                    </span>
                )}
                {channels.includes("email") && (
                    <span title="Email" className="text-blue-600">
                        <Mail className="w-3.5 h-3.5" />
                    </span>
                )}
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <CardTitle>通知規則設定</CardTitle>
                </div>
                <CardDescription>
                    設定任務即將到期時，系統應在幾天前發送通知，以及透過哪些管道通知。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Add New Rule Form */}
                <div className="p-4 bg-gray-50 rounded-lg border space-y-4">
                    <div className="flex items-end gap-4">
                        <div className="space-y-2 flex-1">
                            <Label>提前天數</Label>
                            <Input
                                type="number"
                                placeholder="例如: 7"
                                value={newDays}
                                onChange={(e) => setNewDays(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 w-32">
                            <Label>緊急程度</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={newSeverity}
                                onChange={(e) => setNewSeverity(e.target.value)}
                            >
                                <option value="info">Info</option>
                                <option value="warning">Warning</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Label className="text-sm text-gray-500">通知管道：</Label>
                            <button
                                type="button"
                                onClick={() => toggleChannel("line")}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    newChannels.includes("line")
                                        ? "bg-green-50 border-green-300 text-green-700"
                                        : "bg-gray-50 border-gray-200 text-gray-400"
                                }`}
                            >
                                <MessageSquare className="w-3 h-3" />
                                LINE
                            </button>
                            <button
                                type="button"
                                onClick={() => toggleChannel("email")}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    newChannels.includes("email")
                                        ? "bg-blue-50 border-blue-300 text-blue-700"
                                        : "bg-gray-50 border-gray-200 text-gray-400"
                                }`}
                            >
                                <Mail className="w-3 h-3" />
                                Email
                            </button>
                        </div>
                        <Button onClick={handleAddRule} disabled={adding || !newDays} size="sm">
                            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                            新增規則
                        </Button>
                    </div>
                </div>

                {/* Rules List */}
                <div className="space-y-2">
                    {loading ? (
                        <div className="text-center py-4 text-gray-500">載入中...</div>
                    ) : rules.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">尚無設定規則</div>
                    ) : (
                        rules.map((rule) => (
                            <div key={rule.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="font-medium text-lg w-12 text-center">{rule.days_before}</div>
                                    <div className="text-sm text-gray-500">天前通知</div>
                                    <Badge className={`${getSeverityColor(rule.severity)} text-white border-0`}>
                                        {rule.severity.toUpperCase()}
                                    </Badge>
                                    {getChannelIcons(rule.channels)}
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)} className="text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
