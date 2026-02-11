"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/lib/toast"
import { UserPlus, X, Mail, Loader2, Users } from "lucide-react"

interface Member {
    id: string
    project_id: string
    user_id: string | null
    email: string
    status: string
    invited_by: string
    invited_at: string
    joined_at: string | null
    full_name: string | null
}

interface MemberManagerProps {
    projectId: string
    isOwner: boolean
}

export function MemberManager({ projectId, isOwner }: MemberManagerProps) {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviting, setInviting] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)

    useEffect(() => {
        fetchMembers()
    }, [projectId])

    const fetchMembers = async () => {
        try {
            const res = await apiClient.get(`/projects/${projectId}/members`)
            setMembers(res.data || [])
        } catch (error) {
            console.error("Failed to fetch members", error)
        } finally {
            setLoading(false)
        }
    }

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteEmail.trim()) return

        setInviting(true)
        try {
            await apiClient.post(`/projects/${projectId}/members/invite`, {
                email: inviteEmail.trim(),
            })
            toast("成員邀請已發送", "success")
            setInviteEmail("")
            setDialogOpen(false)
            fetchMembers()
        } catch (error: any) {
            const detail = error.response?.data?.detail || "邀請失敗"
            toast(detail, "error")
        } finally {
            setInviting(false)
        }
    }

    const handleRemove = async (memberId: string, email: string) => {
        if (!confirm(`確定要移除 ${email} 嗎？`)) return

        try {
            await apiClient.delete(`/projects/${projectId}/members/${memberId}`)
            toast("成員已移除", "success")
            fetchMembers()
        } catch (error) {
            toast("移除失敗", "error")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    專案成員
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {members.length}
                    </span>
                </h3>
                {isOwner && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1">
                                <UserPlus className="w-3.5 h-3.5" />
                                邀請成員
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                            <DialogHeader>
                                <DialogTitle>邀請成員</DialogTitle>
                                <DialogDescription>
                                    輸入成員的 Email 地址來邀請他們加入此專案。
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInvite}>
                                <div className="py-4">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <Input
                                            type="email"
                                            placeholder="member@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDialogOpen(false)}
                                    >
                                        取消
                                    </Button>
                                    <Button type="submit" disabled={inviting}>
                                        {inviting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                                邀請中...
                                            </>
                                        ) : (
                                            "發送邀請"
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
            ) : members.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                    尚無成員，點擊「邀請成員」開始新增。
                </p>
            ) : (
                <div className="space-y-2">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium flex-shrink-0">
                                    {(member.full_name || member.email)[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-700 truncate">
                                        {member.full_name || member.email}
                                    </p>
                                    {member.full_name && (
                                        <p className="text-xs text-gray-400 truncate">{member.email}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge
                                    variant={member.status === "accepted" ? "default" : "secondary"}
                                    className="text-xs"
                                >
                                    {member.status === "accepted" ? "已加入" : "待接受"}
                                </Badge>
                                {isOwner && (
                                    <button
                                        onClick={() => handleRemove(member.id, member.email)}
                                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                        title="移除成員"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
