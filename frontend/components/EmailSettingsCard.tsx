"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { toast } from "@/lib/toast"
import { Mail, Send, Loader2, CheckCircle, XCircle } from "lucide-react"

type EmailStatus = {
    provider: string
    enabled: boolean
    smtp_user: string
    resend_configured: boolean
}

export function EmailSettingsCard() {
    const [status, setStatus] = useState<EmailStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)

    useEffect(() => {
        fetchStatus()
    }, [])

    const fetchStatus = async () => {
        try {
            const res = await apiClient.get("/settings/email-status")
            setStatus(res.data)
        } catch (error) {
            console.error("Failed to fetch email status", error)
        } finally {
            setLoading(false)
        }
    }

    const handleTestEmail = async () => {
        setSending(true)
        try {
            const res = await apiClient.post("/settings/email-test")
            toast(`測試郵件已發送至 ${res.data.to}`, "success")
        } catch (error: any) {
            const detail = error.response?.data?.detail || "發送失敗"
            toast(detail, "error")
        } finally {
            setSending(false)
        }
    }

    const providerLabel = (p: string) => {
        if (p === "smtp") return "Gmail SMTP"
        if (p === "resend") return "Resend"
        return p
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <CardTitle>Email 通知設定</CardTitle>
                </div>
                <CardDescription>
                    系統透過 Email 發送截止日提醒和專案邀請通知。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="text-center py-4 text-gray-500">載入中...</div>
                ) : status ? (
                    <>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">提供者</span>
                                    <Badge variant="secondary">{providerLabel(status.provider)}</Badge>
                                </div>
                                {status.provider === "smtp" && status.smtp_user && (
                                    <p className="text-xs text-gray-500">帳號：{status.smtp_user}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {status.enabled ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        已啟用
                                    </Badge>
                                ) : (
                                    <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
                                        <XCircle className="w-3 h-3" />
                                        未設定
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {status.enabled && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTestEmail}
                                disabled={sending}
                                className="w-full"
                            >
                                {sending ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />發送中...</>
                                ) : (
                                    <><Send className="w-4 h-4 mr-2" />發送測試郵件</>
                                )}
                            </Button>
                        )}

                        {!status.enabled && (
                            <div className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="font-medium text-amber-700 mb-1">如何啟用？</p>
                                {status.provider === "smtp" ? (
                                    <p>在 .env 設定 <code className="bg-amber-100 px-1 rounded">SMTP_USER</code> 和 <code className="bg-amber-100 px-1 rounded">SMTP_PASSWORD</code>（Gmail App Password）</p>
                                ) : (
                                    <p>在 .env 設定 <code className="bg-amber-100 px-1 rounded">RESEND_API_KEY</code></p>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-gray-400">無法取得 Email 設定狀態</p>
                )}
            </CardContent>
        </Card>
    )
}
