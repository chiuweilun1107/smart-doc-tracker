"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { toast } from "@/lib/toast"
import { Mail, Send, Loader2, CheckCircle, XCircle, Save, Eye, EyeOff } from "lucide-react"

type SmtpConfig = {
    host: string
    port: number
    user: string
    password: string
    from_name: string
}

type ResendConfig = {
    api_key: string
    from_email: string
}

type EmailConfig = {
    provider: string
    smtp: SmtpConfig
    resend: ResendConfig
}

type EmailStatus = {
    provider: string
    enabled: boolean
    smtp_user: string
    resend_configured: boolean
}

export function EmailSettingsCard() {
    const [config, setConfig] = useState<EmailConfig | null>(null)
    const [status, setStatus] = useState<EmailStatus | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sending, setSending] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)
    const [testEmail, setTestEmail] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [configRes, statusRes] = await Promise.all([
                apiClient.get("/settings/email-config"),
                apiClient.get("/settings/email-status"),
            ])
            setConfig(configRes.data)
            setStatus(statusRes.data)
        } catch (error) {
            console.error("Failed to fetch email config", error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!config) return
        setSaving(true)
        try {
            await apiClient.put("/settings/email-config", config)
            toast("Email 設定已儲存", "success")
            setHasChanges(false)
            // Refresh both config and status after save
            const [configRes, statusRes] = await Promise.all([
                apiClient.get("/settings/email-config"),
                apiClient.get("/settings/email-status"),
            ])
            setConfig(configRes.data)
            setStatus(statusRes.data)
        } catch (error: any) {
            const detail = error.response?.data?.detail || "儲存失敗"
            toast(detail, "error")
        } finally {
            setSaving(false)
        }
    }

    const handleTestEmail = async () => {
        setSending(true)
        try {
            const payload = testEmail.trim() ? { to_email: testEmail.trim() } : {}
            const res = await apiClient.post("/settings/email-test", payload)
            toast(`測試郵件已發送至 ${res.data.to}`, "success")
        } catch (error: any) {
            const detail = error.response?.data?.detail || "發送失敗"
            toast(detail, "error")
        } finally {
            setSending(false)
        }
    }

    const updateProvider = (provider: string) => {
        if (!config) return
        setConfig({ ...config, provider })
        setHasChanges(true)
    }

    const updateSmtp = (field: keyof SmtpConfig, value: string | number) => {
        if (!config) return
        setConfig({
            ...config,
            smtp: { ...config.smtp, [field]: value },
        })
        setHasChanges(true)
    }

    const updateResend = (field: keyof ResendConfig, value: string) => {
        if (!config) return
        setConfig({
            ...config,
            resend: { ...config.resend, [field]: value },
        })
        setHasChanges(true)
    }

    // Describe what the current status means
    const renderStatusSummary = () => {
        if (!status || !config) return null

        if (status.enabled) {
            const providerName = status.provider === "smtp" ? "Gmail SMTP" : "Resend"
            const account = status.provider === "smtp" ? status.smtp_user : "(Resend API)"
            return (
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-green-800">
                            系統郵件發送功能正常運作中
                        </p>
                        <p className="text-xs text-green-600">
                            透過 <strong>{providerName}</strong> 發送
                            {account && <>（帳號：{account}）</>}
                        </p>
                        <p className="text-xs text-gray-500">
                            截止日提醒、專案邀請等通知將透過此 Email 發送給所有專案成員。
                        </p>
                    </div>
                </div>
            )
        }

        return (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <XCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800">
                        Email 發送功能尚未設定
                    </p>
                    <p className="text-xs text-amber-600">
                        {config.provider === "smtp"
                            ? "請在下方填入 Gmail 帳號和應用程式密碼，儲存後即可啟用。"
                            : "請在下方填入 Resend API Key 和寄件者 Email，儲存後即可啟用。"
                        }
                    </p>
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center space-x-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <CardTitle>Email 通知設定</CardTitle>
                </div>
                <CardDescription>
                    設定系統發送截止日提醒和專案邀請通知的 Email 服務。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {loading ? (
                    <div className="text-center py-4 text-muted-foreground">載入中...</div>
                ) : config ? (
                    <>
                        {/* Status Summary - clear explanation */}
                        {renderStatusSummary()}

                        {/* Provider Toggle */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">選擇郵件發送方式</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={config.provider === "smtp" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateProvider("smtp")}
                                    className="flex-1"
                                >
                                    Gmail SMTP
                                </Button>
                                <Button
                                    type="button"
                                    variant={config.provider === "resend" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => updateProvider("resend")}
                                    className="flex-1"
                                >
                                    Resend
                                </Button>
                            </div>
                        </div>

                        {/* SMTP Config */}
                        {config.provider === "smtp" && (
                            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                                <h4 className="text-sm font-semibold text-gray-700">Gmail SMTP 設定</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">SMTP 主機</Label>
                                        <Input
                                            value={config.smtp.host}
                                            onChange={(e) => updateSmtp("host", e.target.value)}
                                            placeholder="smtp.gmail.com"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-500">連接埠</Label>
                                        <Input
                                            type="number"
                                            value={config.smtp.port}
                                            onChange={(e) => updateSmtp("port", parseInt(e.target.value) || 587)}
                                            placeholder="587"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">Gmail 帳號</Label>
                                    <Input
                                        value={config.smtp.user}
                                        onChange={(e) => updateSmtp("user", e.target.value)}
                                        placeholder="your-email@gmail.com"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">應用程式密碼</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={config.smtp.password}
                                            onChange={(e) => updateSmtp("password", e.target.value)}
                                            placeholder="請輸入 Gmail 應用程式密碼"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">寄件者顯示名稱</Label>
                                    <Input
                                        value={config.smtp.from_name}
                                        onChange={(e) => updateSmtp("from_name", e.target.value)}
                                        placeholder="Smart Doc Tracker"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Resend Config */}
                        {config.provider === "resend" && (
                            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
                                <h4 className="text-sm font-semibold text-gray-700">Resend 設定</h4>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">API Key</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            value={config.resend.api_key}
                                            onChange={(e) => updateResend("api_key", e.target.value)}
                                            placeholder="re_xxxxxxxx..."
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-500">寄件者 Email</Label>
                                    <Input
                                        value={config.resend.from_email}
                                        onChange={(e) => updateResend("from_email", e.target.value)}
                                        placeholder="noreply@yourdomain.com"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <Button
                            onClick={handleSave}
                            disabled={saving || !hasChanges}
                            className="w-full"
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />儲存中...</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" />儲存設定</>
                            )}
                        </Button>

                        {/* Test Email */}
                        {status?.enabled && (
                            <div className="space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <Label className="text-sm font-medium text-blue-800">發送測試郵件</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        placeholder="輸入收件人 Email（留空則發送給自己）"
                                        className="flex-1 bg-white"
                                    />
                                    <Button
                                        variant="outline"
                                        onClick={handleTestEmail}
                                        disabled={sending}
                                        className="shrink-0"
                                    >
                                        {sending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <><Send className="w-4 h-4 mr-1" />發送</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-muted-foreground">無法取得 Email 設定狀態</p>
                )}
            </CardContent>
        </Card>
    )
}
