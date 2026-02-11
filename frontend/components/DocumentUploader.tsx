
"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud, File, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { toast } from "@/lib/toast"
import { cn } from "@/lib/utils"

interface DocumentUploaderProps {
    projectId: string
    onUploadSuccess: (docIds: string[]) => void
}

interface UploadProgress {
    file: File
    status: 'uploading' | 'success' | 'error'
    docId?: string
    error?: string
}

export function DocumentUploader({ projectId, onUploadSuccess }: DocumentUploaderProps) {
    const [uploadQueue, setUploadQueue] = useState<UploadProgress[]>([])

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (!acceptedFiles.length) return

        // Initialize upload queue
        const initialQueue: UploadProgress[] = acceptedFiles.map(file => ({
            file,
            status: 'uploading'
        }))
        setUploadQueue(initialQueue)

        // Upload files in parallel
        const uploadPromises = acceptedFiles.map(async (file, index) => {
            const formData = new FormData()
            formData.append("file", file)

            try {
                const res = await apiClient.post(`/documents/upload?project_id=${projectId}`, formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                })

                // Update queue with success
                setUploadQueue(prev => prev.map((item, i) =>
                    i === index ? { ...item, status: 'success', docId: res.data.id } : item
                ))

                return res.data.id
            } catch (error) {
                console.error(`Upload failed for ${file.name}`, error)

                // Update queue with error
                setUploadQueue(prev => prev.map((item, i) =>
                    i === index ? { ...item, status: 'error', error: '上傳失敗' } : item
                ))

                return null
            }
        })

        // Wait for all uploads to complete
        const docIds = await Promise.all(uploadPromises)
        const successfulIds = docIds.filter((id): id is string => id !== null)

        if (successfulIds.length > 0) {
            onUploadSuccess(successfulIds)
            setTimeout(() => setUploadQueue([]), 3000) // Clear queue after 3s
        }

        if (successfulIds.length < acceptedFiles.length) {
            toast(`${acceptedFiles.length - successfulIds.length} 個文件上傳失敗`, "error")
        }
    }, [projectId, onUploadSuccess])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc']
        },
        multiple: true,
        maxFiles: 10
    })

    const isUploading = uploadQueue.some(item => item.status === 'uploading')

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50",
                    isUploading ? "opacity-50 pointer-events-none" : ""
                )}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center space-y-2">
                    {isUploading ? (
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    ) : (
                        <UploadCloud className="w-10 h-10 text-gray-400" />
                    )}
                    <div className="text-sm font-medium text-gray-700">
                        {isUploading ? "上傳與解析中..." : isDragActive ? "放開以開始上傳" : "點擊或拖曳文件至此"}
                    </div>
                    {!isUploading && (
                        <p className="text-xs text-gray-500">支援 PDF、DOCX、DOC 格式，可同時上傳多個文件 (每個最大 10MB)</p>
                    )}
                </div>
            </div>

            {/* Upload Progress */}
            {uploadQueue.length > 0 && (
                <div className="space-y-2">
                    {uploadQueue.map((item, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                        >
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700 truncate">{item.file.name}</span>
                            </div>
                            <div className="flex-shrink-0 ml-3">
                                {item.status === 'uploading' && (
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                )}
                                {item.status === 'success' && (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                )}
                                {item.status === 'error' && (
                                    <XCircle className="w-4 h-4 text-red-600" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
