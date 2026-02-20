
"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, FileText, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react"
import { translateError } from "@/lib/error-messages"
import { toast } from "@/lib/toast"

const REMEMBER_KEY = "sdt_remembered_email"

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const inviteEmail = searchParams.get("email") || ""
    const isInvite = searchParams.get("invite") === "true"
    const [email, setEmail] = useState(inviteEmail)
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // 如果是邀請連結且瀏覽器已登入其他帳號，先登出
    useEffect(() => {
        if (isInvite) {
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user && user.email !== inviteEmail) {
                    supabase.auth.signOut()
                }
            })
        }
    }, [isInvite, inviteEmail])

    // Restore remembered email on mount (only if not invite)
    useEffect(() => {
        if (!inviteEmail) {
            const saved = localStorage.getItem(REMEMBER_KEY)
            if (saved) {
                setEmail(saved)
                setRememberMe(true)
            }
        }
    }, [inviteEmail])

    const handleForgotPassword = async () => {
        if (!email) {
            setError("請先輸入 Email")
            return
        }
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })
            if (error) {
                setError(translateError(error.message))
            } else {
                setError(null)
                toast("密碼重設信已發送，請檢查信箱", "success")
            }
        } catch (err: any) {
            setError(err.message || "發送失敗，請稍後再試")
        }
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (authError) throw authError

            // Save or clear remembered email
            if (rememberMe) {
                localStorage.setItem(REMEMBER_KEY, email)
            } else {
                localStorage.removeItem(REMEMBER_KEY)
            }

            router.push("/dashboard")
        } catch (err: any) {
            console.error("Login failed", err)
            setError(translateError(err.message) || "登入失敗，請檢查帳號密碼")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding & Value Prop */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 text-white p-12 relative overflow-hidden">
                <div className="z-10">
                    <div className="flex items-center gap-2 font-bold text-2xl mb-2">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <span>Smart Doc Tracker</span>
                    </div>
                </div>

                <div className="z-10 space-y-8 max-w-lg">
                    <h1 className="text-4xl font-bold leading-tight">
                        再也不錯過重要專案截止日
                    </h1>
                    <ul className="space-y-4 text-zinc-300">
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" />
                            <span>AI 智能文件解析，即時洞察關鍵資訊。</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" />
                            <span>LINE 即時通知，掌握重要更新。</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" />
                            <span>安全可靠，專為高效工作流程設計。</span>
                        </li>
                    </ul>
                </div>

                <div className="z-10 text-sm text-zinc-500">
                    &copy; {new Date().getFullYear()} Smart Doc Tracker. 版權所有。
                </div>

                {/* Abstract Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-3xl -z-0"></div>
            </div>

            {/* Right: Login Form */}
            <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-950">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            歡迎回來
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            請登入您的帳號
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-11"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">密碼</Label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                                >
                                    忘記密碼？
                                </button>
                            </div>
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center gap-2">
                            <input
                                id="remember"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor="remember" className="text-sm font-normal text-slate-600 dark:text-slate-400 cursor-pointer">
                                記住我的 Email
                            </Label>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full h-11 text-base shadow-lg shadow-blue-500/20" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    登入中...
                                </>
                            ) : (
                                <>
                                    登入 <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="px-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        還沒有帳號？{" "}
                        <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500 underline underline-offset-4">
                            註冊
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
