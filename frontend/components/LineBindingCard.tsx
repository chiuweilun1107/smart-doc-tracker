
"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { Smartphone, QrCode, CheckCircle, Loader2 } from "lucide-react"

export function LineBindingCard() {
    const [status, setStatus] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchStatus = async () => {
        try {
            const res = await apiClient.get('/users/me/line-status')
            setStatus(res.data)
        } catch (error) {
            console.error("Failed to fetch line status", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStatus()
    }, [])

    if (loading) {
        return (
            <Card>
                <CardContent className="h-40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </CardContent>
            </Card>
        )
    }

    const isBound = status?.is_bound

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Smartphone className="w-5 h-5 text-green-600" />
                        <CardTitle>Line 帳號綁定</CardTitle>
                    </div>
                    {isBound ? (
                        <Badge variant="default" className="bg-green-600">已連線</Badge>
                    ) : (
                        <Badge variant="destructive">未連線</Badge>
                    )}
                </div>
                <CardDescription>
                    綁定 Line 帳號以接收即時的任務到期通知與更新。
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isBound ? (
                    <div className="flex flex-col items-center py-4 space-y-4">
                        <div className="bg-green-50 p-4 rounded-full">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium text-lg">綁定成功</p>
                            <p className="text-gray-500 text-sm mt-1">
                                Line User ID: {status?.line_user_id || "Unknown"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row items-center gap-6 py-4">
                        <div className="bg-white p-2 border rounded-lg shadow-sm">
                            {/* Placeholder for QR Code - In real app, this would be dynamic or a static asset */}
                            <QrCode className="w-32 h-32 text-gray-800" />
                        </div>
                        <div className="space-y-4 flex-1">
                            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                                <li>開啟 Line App，掃描左側 QR Code 加入好友 (或搜尋 ID: @yourbotid)。</li>
                                <li>加入後，傳送任意訊息給機器人。</li>
                                <li>機器人會要求您輸入 Email 進行綁定。</li>
                                <li>輸入您登入此系統的 Email，即可完成綁定。</li>
                            </ol>
                            <Button variant="outline" size="sm" onClick={fetchStatus}>
                                我已完成綁定，重新整理狀態
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
