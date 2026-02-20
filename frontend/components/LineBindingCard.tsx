"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { toast } from "@/lib/toast"
import { Smartphone, CheckCircle, Loader2, Copy, RefreshCw } from "lucide-react"

type LineConfig = {
    bot_id: string
    bot_name: string
    channel_secret: string
    channel_access_token: string
}

export function LineBindingCard() {
    const [status, setStatus] = useState<any>(null)
    const [botConfig, setBotConfig] = useState<LineConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [generating, setGenerating] = useState(false)
    const [verificationCode, setVerificationCode] = useState<string | null>(null)

    const fetchData = async () => {
        setLoading(true)
        try {
            const [statusRes, configRes] = await Promise.all([
                apiClient.get("/users/me/line-status"),
                apiClient.get("/settings/line-config"),
            ])
            setStatus(statusRes.data)
            setBotConfig(configRes.data)
            if (statusRes.data.verification_code) {
                setVerificationCode(statusRes.data.verification_code)
            }
        } catch (error) {
            console.error("Failed to fetch line data", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const generateCode = async () => {
        setGenerating(true)
        try {
            const res = await apiClient.post("/users/me/line-verification-code")
            setVerificationCode(res.data.verification_code)
            toast("驗證碼已產生，請在 15 分鐘內完成綁定", "success")
        } catch (error: any) {
            const detail = error.response?.data?.detail || "產生驗證碼失敗"
            toast(detail, "error")
        } finally {
            setGenerating(false)
        }
    }

    const copyCode = () => {
        if (verificationCode) {
            navigator.clipboard.writeText(verificationCode)
            toast("驗證碼已複製", "success")
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="h-40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    const isBound = status?.is_bound
    const botId = botConfig?.bot_id || ""
    const botName = botConfig?.bot_name || ""
    const addFriendUrl = botId ? `https://line.me/R/ti/p/${botId}` : ""
    const hasBotConfig = Boolean(botId)

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Smartphone className="w-5 h-5 text-green-600" />
                        <CardTitle>LINE 帳號綁定</CardTitle>
                    </div>
                    {isBound ? (
                        <Badge variant="default" className="bg-green-600">已連線</Badge>
                    ) : (
                        <Badge variant="destructive">未連線</Badge>
                    )}
                </div>
                <CardDescription>
                    綁定 LINE 帳號以接收即時的截止日提醒與專案通知。
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isBound ? (
                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-green-800">
                                LINE 帳號已成功綁定
                            </p>
                            <p className="text-xs text-green-600">
                                系統會透過 LINE Bot
                                {botName && <>「{botName}」</>}
                                發送到期提醒給您。
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                                LINE User ID: {status?.line_user_id?.slice(0, 10)}...
                            </p>
                        </div>
                    </div>
                ) : !hasBotConfig ? (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <Smartphone className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-amber-800">
                                LINE Bot 尚未設定
                            </p>
                            <p className="text-xs text-amber-600">
                                請先到下方「LINE Bot 設定」卡片中填入 Channel Access Token 和 Channel Secret。
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Step 1: Add Friend */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">1</span>
                                <span className="text-sm font-medium">
                                    加入 LINE Bot 好友
                                    {botName && <span className="text-muted-foreground font-normal">（{botName}）</span>}
                                </span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted rounded-lg border">
                                <div className="bg-background p-2 rounded-lg shadow-sm border">
                                    <QRCodeSVG
                                        value={addFriendUrl}
                                        size={120}
                                        level="M"
                                    />
                                </div>
                                <div className="space-y-2 text-center sm:text-left">
                                    <p className="text-sm text-foreground/80">
                                        用 LINE 掃描 QR Code 加入好友
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        或搜尋 ID: <code className="bg-muted px-1.5 py-0.5 rounded font-mono">{botId}</code>
                                    </p>
                                    <a
                                        href={addFriendUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block"
                                    >
                                        <Button variant="outline" size="sm" className="gap-1">
                                            <Smartphone className="w-3.5 h-3.5" />
                                            直接開啟 LINE 加入
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Generate Code */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">2</span>
                                <span className="text-sm font-medium">產生驗證碼並傳送給機器人</span>
                            </div>

                            {verificationCode ? (
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                                    <p className="text-sm text-blue-800">
                                        請將以下驗證碼傳送給 LINE Bot：
                                    </p>
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-3xl font-mono font-bold tracking-[0.3em] text-blue-900">
                                            {verificationCode}
                                        </span>
                                        <button
                                            onClick={copyCode}
                                            className="text-blue-600 hover:text-blue-800 p-1"
                                            title="複製驗證碼"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-blue-500 text-center">
                                        驗證碼有效期限 15 分鐘
                                    </p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={generateCode}
                                        disabled={generating}
                                        className="w-full mt-2"
                                    >
                                        {generating ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />產生中...</>
                                        ) : (
                                            <><RefreshCw className="w-4 h-4 mr-2" />重新產生驗證碼</>
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-4 bg-muted rounded-lg border space-y-3">
                                    <p className="text-sm text-foreground/80">
                                        加入好友後，點擊下方按鈕產生驗證碼，再將驗證碼傳送給 LINE Bot 即可完成綁定。
                                    </p>
                                    <Button
                                        onClick={generateCode}
                                        disabled={generating}
                                        className="w-full"
                                    >
                                        {generating ? (
                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />產生中...</>
                                        ) : (
                                            "產生驗證碼"
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Refresh */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchData}
                            className="w-full"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            我已完成綁定，重新整理狀態
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
