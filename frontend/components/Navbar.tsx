"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { FileText, LayoutDashboard, FolderOpen, Settings, LogOut } from "lucide-react"

const navItems = [
    { href: "/dashboard", label: "儀表板", icon: LayoutDashboard },
    { href: "/projects", label: "專案", icon: FolderOpen },
    { href: "/settings", label: "設定", icon: Settings },
]

export function Navbar() {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    return (
        <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-blue-600 dark:text-blue-500 shrink-0">
                    <FileText className="w-5 h-5" />
                    <span className="hidden sm:inline">Smart Doc Tracker</span>
                </Link>

                {/* Nav Links */}
                <nav className="flex items-center gap-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = pathname === href || pathname.startsWith(href + "/")
                        return (
                            <Link key={href} href={href}>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`gap-1.5 text-sm ${
                                        isActive
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                            : "text-slate-600 dark:text-slate-400"
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="hidden md:inline">{label}</span>
                                </Button>
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-1.5 text-sm text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 shrink-0"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden md:inline">登出</span>
                </Button>
            </div>
        </header>
    )
}
