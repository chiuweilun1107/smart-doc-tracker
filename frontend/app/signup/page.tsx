
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, FileText, CheckCircle2, ArrowRight } from "lucide-react"

export default function SignupPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

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
            setError(err.message || "註冊失敗，請稍後再試")
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
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Account Created!</h2>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Please check your email to confirm your account. After confirmation, you can log in.
                    </p>
                    <Link href="/login">
                        <Button className="w-full">
                            Go to Login
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
                        Join Smart Doc Tracker Today.
                    </h1>
                    <p className="text-lg text-zinc-300">
                        Get started with the most advanced document tracking system for government tenders.
                    </p>
                </div>

                <div className="z-10 text-sm text-zinc-500">
                    &copy; 2024 Smart Doc Tracker. All rights reserved.
                </div>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-900/20 rounded-full blur-3xl -z-0"></div>
            </div>

            {/* Right: Signup Form */}
            <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-950">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Create an account
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Enter your email below to create your account
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
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create account <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="px-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 underline underline-offset-4">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
