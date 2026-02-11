"use client"

import { useState } from "react"
import { FileText, File, Calendar, AlertCircle, CheckCircle2, Loader2, Trash2, Edit2, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface DocumentCardProps {
    document: any
    isActive: boolean
    eventCount?: number
    onClick: () => void
    onDelete: (id: string) => void
    onRename?: (id: string, newName: string) => void
}

export function DocumentCard({
    document,
    isActive,
    eventCount = 0,
    onClick,
    onDelete,
    onRename
}: DocumentCardProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editName, setEditName] = useState(document.original_filename || document.filename || '')

    // Get file icon based on type
    const FileIcon = document.file_type === 'pdf' ? File : FileText

    // Format upload date
    const formatDate = (dateString: string) => {
        if (!dateString) return '未知'

        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return '剛才'
        if (diffMins < 60) return `${diffMins} 分鐘前`
        if (diffHours < 24) return `${diffHours} 小時前`
        if (diffDays === 0) return '今天'
        if (diffDays === 1) return '昨天'
        if (diffDays < 7) return `${diffDays} 天前`

        return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })
    }

    // Status badge
    const StatusBadge = () => {
        if (document.status === 'completed') {
            return (
                <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>成功</span>
                </div>
            )
        }
        if (document.status === 'processing') {
            return (
                <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>處理中</span>
                </div>
            )
        }
        if (document.status === 'error') {
            return (
                <div className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    <span>失敗</span>
                </div>
            )
        }
        return null
    }

    const handleRename = () => {
        if (onRename && editName !== (document.original_filename || document.filename)) {
            onRename(document.id, editName)
        }
        setIsEditing(false)
    }

    const handleDelete = () => {
        setShowDeleteDialog(false)
        onDelete(document.id)
    }

    return (
        <>
            <div
                onClick={onClick}
                className={cn(
                    "group relative p-4 rounded-lg border transition-all cursor-pointer",
                    "hover:shadow-md hover:border-gray-300",
                    isActive
                        ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
                        : "border-gray-200 bg-white"
                )}
            >
                {/* Main Content */}
                <div className="flex items-start gap-3">
                    {/* File Icon */}
                    <div className={cn(
                        "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                        isActive ? "bg-primary/10" : "bg-gray-100"
                    )}>
                        <FileIcon className={cn(
                            "w-5 h-5",
                            isActive ? "text-primary" : "text-gray-500"
                        )} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        {/* Filename */}
                        {isEditing ? (
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onBlur={handleRename}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename()
                                    if (e.key === 'Escape') {
                                        setEditName(document.original_filename || document.filename)
                                        setIsEditing(false)
                                    }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-sm font-medium text-gray-900 border-b-2 border-primary focus:outline-none"
                                autoFocus
                            />
                        ) : (
                            <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                                {document.original_filename || document.filename || '未命名文件'}
                            </h4>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                            <span className="font-medium">{document.file_type?.toUpperCase()}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(document.created_at)}</span>
                            </div>
                            {eventCount > 0 && (
                                <>
                                    <span>•</span>
                                    <span className="text-primary font-medium">{eventCount} 個截止日期</span>
                                </>
                            )}
                        </div>

                        {/* Status Badge */}
                        <div className="mt-2">
                            <StatusBadge />
                        </div>
                    </div>

                    {/* Actions Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={cn(
                                    "flex-shrink-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                                    isActive && "opacity-100"
                                )}
                            >
                                <MoreVertical className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsEditing(true)
                                }}
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                重新命名
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setShowDeleteDialog(true)
                                }}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                刪除
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>確認刪除文件？</AlertDialogTitle>
                        <AlertDialogDescription>
                            這將永久刪除「{document.original_filename || document.filename}」及其所有解析的截止日期。
                            此操作無法復原。
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            刪除
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
