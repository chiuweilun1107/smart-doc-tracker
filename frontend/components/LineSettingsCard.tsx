"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { toast } from "@/lib/toast"
import { Bot, Save, Loader2, Eye, EyeOff, CheckCircle, XCircle, Send } from "lucide-react"

type LineConfig = {
    bot_id: string
    bot_name: string
    channel_secret: string
    channel_access_token: string
}

export function LineSettingsCard() {
    const [config, setConfig] = useState<LineConfig | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showSecrets, setShowSecrets] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [testing, setTesting] = useState(false)

    useEffect(() => {
        fetchConfig()
    }, [])

    const fetchConfig = async () => {
        try {
            const res = await apiClient.get("/settings/line-config")
            setConfig(res.data)
        } catch (error) {
            console.error("Failed to fetch LINE config", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!config) return
        setSaving(true)
        try {
            const res = await apiClient.put("/settings/line-config", {
                channel_secret: config.channel_secret,
                channel_access_token: config.channel_access_token,
            })
            toast(`LINE Bot 設定已儲存（${res.data.bot_name} ${res.data.bot_id}）`, "success")
            setHasChanges(false)
            // Refresh to get updated bot_id/bot_name
            await fetchConfig()
        } catch (error: any) {
            const detail = error.response?.data?.detail || "儲存失敗"
            toast(detail, "error")
        } finally {
            setSaving(false)
        }
    }

    const update = (field: keyof LineConfig, value: string) => {
        if (!config) return
        setConfig({ ...config, [field]: value })
        setHasChanges(true)
    }

    const handleTestLine = async () => {
        setTesting(true)
        try {
            await apiClient.post("/settings/line-test")
            toast("測試訊息已發送到您的 LINE", "success")
        } catch (error: any) {
            const detail = error.response?.data?.detail || "發送失敗"
            toast(detail, "error")
        } finally {
            setTesting(false)
        }
    }

    const hasBotConnected = Boolean(config?.bot_id)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-2">
                    <Bot className="w-5 h-5 text-green-600" />
                    <CardTitle>LINE Bot 設定</CardTitle>
                </div>
                <CardDescription>
                    設定 LINE Messaging API 的 Channel 資訊，系統會自動偵測 Bot ID 和名稱。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground">載入中...</div>
                ) : config ? (
                    <>
                        {/* Status */}
                        {hasBotConnected ? (
                            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-green-800">
                                        LINE Bot 已連線
                                    </p>
                                    <p className="text-xs text-green-600">
                                        Bot 名稱：<strong>{config.bot_name}</strong>（ID: {config.bot_id}）
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <XCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-amber-800">
                                        LINE Bot 尚未設定
                                    </p>
                                    <p className="text-xs text-amber-600">
                                        請填入 LINE Developers Console 中的 Channel 資訊。
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Config Form */}
                        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700">Channel 設定</h4>
                                <button
                                    type="button"
                                    onClick={() => setShowSecrets(!showSecrets)}
                                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                                >
                                    {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    {showSecrets ? "隱藏" : "顯示"}
                                </button>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Channel Secret</Label>
                                <Input
                                    type={showSecrets ? "text" : "password"}
                                    value={config.channel_secret}
                                    onChange={(e) => update("channel_secret", e.target.value)}
                                    placeholder="LINE Channel Secret"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-500">Channel Access Token</Label>
                                <Input
                                    type={showSecrets ? "text" : "password"}
                                    value={config.channel_access_token}
                                    onChange={(e) => update("channel_access_token", e.target.value)}
                                    placeholder="LINE Channel Access Token"
                                />
                            </div>
                        </div>

                        {/* Save + Test */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleSave}
                                disabled={saving || !hasChanges}
                                className="flex-1"
                            >
                                {saving ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />驗證並儲存中...</>
                                ) : (
                                    <><Save className="w-4 h-4 mr-2" />儲存設定</>
                                )}
                            </Button>
                            {hasBotConnected && (
                                <Button
                                    variant="outline"
                                    onClick={handleTestLine}
                                    disabled={testing}
                                    title="發送測試 LINE 訊息"
                                >
                                    {testing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <><Send className="w-4 h-4 mr-1" />測試</>
                                    )}
                                </Button>
                            )}
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            儲存時會自動向 LINE API 驗證 Token 並取得 Bot 資訊。若要更換機器人，直接替換上方的 Channel 資訊即可。
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-gray-400">無法取得 LINE 設定狀態</p>
                )}
            </CardContent>
        </Card>
    )
}
