
"use client"

import { useRouter } from "next/navigation"
import { Settings, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LineBindingCard } from "@/components/LineBindingCard"
import { LineSettingsCard } from "@/components/LineSettingsCard"
import { EmailSettingsCard } from "@/components/EmailSettingsCard"
import { NotificationRulesCard } from "@/components/NotificationRulesCard"

export default function SettingsPage() {
    const router = useRouter()

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <Settings className="mr-2" />
                        系統設定
                    </h1>
                    <p className="text-gray-500 mt-1">管理您的帳號綁定與通知偏好</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <LineBindingCard />
                    <EmailSettingsCard />
                </div>
                <div className="space-y-8">
                    <LineSettingsCard />
                    <NotificationRulesCard />
                </div>
            </div>
        </div>
    )
}
