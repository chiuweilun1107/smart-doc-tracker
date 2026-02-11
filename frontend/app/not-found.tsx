
import Link from 'next/link'
import { FileQuestion, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 p-4">
            <div className="text-center space-y-6 max-w-md">
                <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <FileQuestion className="w-12 h-12 text-slate-400" />
                </div>

                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Page not found</h1>

                <p className="text-slate-600 dark:text-slate-400 text-lg">
                    Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
                </p>

                <div className="flex justify-center pt-4">
                    <Link href="/">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="w-4 h-4" /> Back to Home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
