
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

export default function SignupPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const inviteEmail = searchParams.get("email") || ""
    const isInvite = searchParams.get("invite") === "true"
    const [email, setEmail] = useState(inviteEmail)
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

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

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
            })
            if (authError) throw authError
            setSuccess(true)
        } catch (err: any) {
            console.error("Signup failed", err)
            setError(translateError(err.message) || "註冊失敗，請稍後再試")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 p-4">
                <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center space-y-6 border border-zinc-200 dark:border-zinc-700">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">帳號建立成功！</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        請檢查您的信箱確認帳號。確認後即可登入。
                    </p>
                    <Link href="/login">
                        <Button className="w-full">
                            前往登入
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left: Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 text-white p-12 relative overflow-hidden">
                <div className="z-10">
                    <div className="flex items-center gap-2 font-bold text-2xl mb-2">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <span>Smart Doc Tracker</span>
                    </div>
                </div>

                <div className="z-10 space-y-8 max-w-lg">
                    <h1 className="text-4xl font-bold leading-tight">
                        立即加入 Smart Doc Tracker
                    </h1>
                    <p className="text-lg text-zinc-300">
                        開始使用最先進的專案文件追蹤系統。
                    </p>
                </div>

                <div className="z-10 text-sm text-zinc-500">
                    &copy; {new Date().getFullYear()} Smart Doc Tracker. 版權所有。
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-3xl -z-0"></div>
            </div>

            {/* Right: Signup Form */}
            <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-950">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            建立帳號
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            請輸入 Email 以建立帳號
                        </p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSignup}>
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
                            <Label htmlFor="password">密碼</Label>
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
                            <p className="text-xs text-muted-foreground">密碼至少需要 6 個字元</p>
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
                                    建立帳號中...
                                </>
                            ) : (
                                <>
                                    建立帳號 <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="px-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        已有帳號？{" "}
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 underline underline-offset-4">
                            登入
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
