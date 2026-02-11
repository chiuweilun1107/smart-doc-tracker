import { Navbar } from "@/components/Navbar"

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />
            <main>{children}</main>
        </div>
    )
}
