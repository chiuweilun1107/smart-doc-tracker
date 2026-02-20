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
import { UserPlus, X, Mail, Loader2, Users, Send } from "lucide-react"

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
    const [resendingId, setResendingId] = useState<string | null>(null)
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
            const res = await apiClient.post(`/projects/${projectId}/members/invite`, {
                email: inviteEmail.trim(),
            })
            const emailSent = res.data?.email_sent
            if (emailSent) {
                toast(`邀請已發送，通知信已寄至 ${inviteEmail.trim()}`, "success")
            } else {
                toast("成員已新增，但通知信發送失敗（請檢查 Email 設定或手動重寄）", "error")
            }
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

    const handleResend = async (memberId: string, email: string) => {
        setResendingId(memberId)
        try {
            await apiClient.post(`/projects/${projectId}/members/${memberId}/resend-invite`)
            toast(`邀請信已重新寄送至 ${email}`, "success")
        } catch (error: any) {
            const detail = error.response?.data?.detail || "重寄失敗"
            toast(detail, "error")
        } finally {
            setResendingId(null)
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
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    專案成員
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
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
                                    輸入成員的 Email 地址來邀請他們加入此專案。系統會自動發送邀請通知信。
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInvite}>
                                <div className="py-4">
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
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
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
            ) : members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                    尚無成員，點擊「邀請成員」開始新增。
                </p>
            ) : (
                <div className="space-y-2">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex items-center justify-between px-3 py-2 bg-muted rounded-lg border border-border"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-medium flex-shrink-0">
                                    {(member.full_name || member.email)[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {member.full_name || member.email}
                                    </p>
                                    {member.full_name && (
                                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Badge
                                    variant={member.status === "accepted" ? "default" : "secondary"}
                                    className="text-xs"
                                >
                                    {member.status === "accepted" ? "已加入" : "待接受"}
                                </Badge>
                                {isOwner && member.status === "pending" && (
                                    <button
                                        onClick={() => handleResend(member.id, member.email)}
                                        disabled={resendingId === member.id}
                                        className="text-muted-foreground hover:text-blue-500 transition-colors p-1 disabled:opacity-50"
                                        title="重寄邀請信"
                                    >
                                        {resendingId === member.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Send className="w-3.5 h-3.5" />
                                        )}
                                    </button>
                                )}
                                {isOwner && (
                                    <button
                                        onClick={() => handleRemove(member.id, member.email)}
                                        className="text-muted-foreground hover:text-red-500 transition-colors p-1"
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
