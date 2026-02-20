"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, FileText, CheckCircle2, Eye, EyeOff } from "lucide-react"

export default function ResetPasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [ready, setReady] = useState(false)

    // Supabase 會透過 URL hash 帶入 access_token，自動建立 session
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setReady(true)
            }
        })

        // 也檢查是否已有 session（可能 event 已觸發過）
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setReady(true)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            setError("密碼至少需要 6 個字元")
            return
        }

        if (password !== confirmPassword) {
            setError("兩次密碼輸入不一致")
            return
        }

        setLoading(true)
        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password,
            })
            if (updateError) throw updateError
            setSuccess(true)
            setTimeout(() => router.push("/login"), 3000)
        } catch (err: any) {
            const { translateError } = await import("@/lib/error-messages")
            setError(translateError(err.message) || "密碼重設失敗，請稍後再試")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full text-center space-y-6 border">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold">密碼重設成功！</h2>
                    <p className="text-muted-foreground">
                        即將自動跳轉到登入頁面...
                    </p>
                    <Button onClick={() => router.push("/login")} className="w-full">
                        立即登入
                    </Button>
                </div>
            </div>
        )
    }

    if (!ready) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="bg-card p-8 rounded-xl shadow-lg max-w-md w-full text-center space-y-6 border">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">驗證中，請稍候...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 font-bold text-2xl mb-6">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <span>Smart Doc Tracker</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        重設密碼
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        請輸入新密碼
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleReset}>
                    <div className="space-y-2">
                        <Label htmlFor="password">新密碼</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="h-11 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">密碼至少需要 6 個字元</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">確認新密碼</Label>
                        <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="h-11"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                重設中...
                            </>
                        ) : (
                            "確認重設密碼"
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
