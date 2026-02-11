
"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud, File, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

interface DocumentUploaderProps {
    projectId: string
    onUploadSuccess: (docId: string) => void
}

export function DocumentUploader({ projectId, onUploadSuccess }: DocumentUploaderProps) {
    const [uploading, setUploading] = useState(false)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        formData.append("file", file)
        // Pass project_id as query param to match backend expectation
        // backend: project_id: str, file: UploadFile

        try {
            const res = await apiClient.post(`/documents/upload?project_id=${projectId}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            })
            onUploadSuccess(res.data.id)
        } catch (error) {
            console.error("Upload failed", error)
            toast("文件上傳失敗", "error")
        } finally{
            setUploading(false)
        }
    }, [projectId, onUploadSuccess])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        maxFiles: 1
    })

    return (
        <div
            {...getRootProps()}
            className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50",
                uploading ? "opacity-50 pointer-events-none" : ""
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-2">
                {uploading ? (
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                ) : (
                    <UploadCloud className="w-10 h-10 text-gray-400" />
                )}
                <div className="text-sm font-medium text-gray-700">
                    {uploading ? "上傳與解析中..." : isDragActive ? "放開以開始上傳" : "點擊或拖曳 PDF 至此"}
                </div>
                {!uploading && (
                    <p className="text-xs text-gray-500">支援 PDF 格式 (最大 10MB)</p>
                )}
            </div>
        </div>
    )
}
