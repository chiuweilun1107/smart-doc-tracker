
import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 animate-pulse text-sm font-medium">Loading Smart Doc Tracker...</p>
            </div>
        </div>
    )
}
