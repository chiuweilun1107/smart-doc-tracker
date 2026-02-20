"use client"

import { useState } from "react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiClient } from "@/lib/api"
import { toast } from "@/lib/toast"

interface DeleteProjectDialogProps {
    project: {
        id: string
        name: string
    }
    docCount: number
    eventCount: number
    open: boolean
    onOpenChange: (open: boolean) => void
    onProjectDeleted: () => void
}

export function DeleteProjectDialog({
    project,
    docCount,
    eventCount,
    open,
    onOpenChange,
    onProjectDeleted,
}: DeleteProjectDialogProps) {
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        setLoading(true)
        try {
            await apiClient.delete(`/projects/${project.id}`)
            toast("專案已刪除", "success")
            onOpenChange(false)
            onProjectDeleted()
        } catch (error) {
            console.error("Error deleting project:", error)
            toast("刪除專案失敗，請稍後再試", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>確定要刪除此專案？</AlertDialogTitle>
                    <AlertDialogDescription>
                        即將刪除專案「{project.name}」。
                        {(docCount > 0 || eventCount > 0) && (
                            <>
                                <br /><br />
                                此操作將同時刪除{" "}
                                <strong>{docCount} 個文件</strong>和{" "}
                                <strong>{eventCount} 個截止事項</strong>。
                            </>
                        )}
                        <br /><br />
                        此操作無法復原。
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {loading ? "刪除中..." : "確定刪除"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
