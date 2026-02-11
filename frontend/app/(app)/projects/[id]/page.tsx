
"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { DocumentUploader } from "@/components/DocumentUploader"
import { DocumentCard } from "@/components/DocumentCard"
import { EventEditor } from "@/components/EventEditor"
import { MemberManager } from "@/components/MemberManager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft, FileText, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "@/lib/toast"

export default function ProjectDetailPage() {
    const params = useParams()
    const searchParams = useSearchParams()
    const id = params.id as string
    const documentIdParam = searchParams.get('document')
    const [project, setProject] = useState<any>(null)
    const [documents, setDocuments] = useState<any[]>([])
    const [activeDoc, setActiveDoc] = useState<any>(null)
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [eventCounts, setEventCounts] = useState<Record<string, number>>({})
    const [isDocListExpanded, setIsDocListExpanded] = useState(false)
    const docListRef = useRef<HTMLDivElement>(null)
    const [hasAutoSelected, setHasAutoSelected] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setCurrentUserId(session?.user?.id || null)
        })
    }, [])

    const isOwner = project && currentUserId ? project.owner_id === currentUserId : false

    useEffect(() => {
        if (id) {
            fetchProject()
            fetchDocuments()
        }
    }, [id])

    // Auto-select document from URL parameter
    useEffect(() => {
        console.log('🔍 Auto-select check:', {
            documentIdParam,
            documentsCount: documents.length,
            hasAutoSelected,
            documentIds: documents.map(d => d.id)
        })

        if (documentIdParam && documents.length > 0 && !hasAutoSelected) {
            console.log('🎯 Looking for document:', documentIdParam)
            const targetDoc = documents.find(doc => doc.id === documentIdParam)
            console.log('📄 Found document:', targetDoc)

            if (targetDoc) {
                console.log('✅ Auto-selecting document:', targetDoc.original_filename || targetDoc.filename)
                setActiveDoc(targetDoc)
                fetchDocumentEvents(documentIdParam)
                setIsDocListExpanded(true)
                setHasAutoSelected(true)
            } else {
                console.warn('⚠️ Document not found in list')
            }
        }
    }, [documentIdParam, documents, hasAutoSelected])

    // Scroll to document list when expanded
    useEffect(() => {
        if (isDocListExpanded && docListRef.current) {
            setTimeout(() => {
                docListRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest'
                })
            }, 100)
        }
    }, [isDocListExpanded])

    // Poll for events if doc is processing
    useEffect(() => {
        if (activeDoc?.status === "processing") {
            const interval = setInterval(() => {
                fetchDocumentEvents(activeDoc.id)
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [activeDoc])

    const fetchProject = async () => {
        setLoading(true)
        try {
            const res = await apiClient.get(`/projects/${id}`)
            setProject(res.data)
        } catch (error) {
            console.error("Failed to fetch project", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchDocuments = async () => {
        try {
            // Fetch all documents for this project
            const res = await apiClient.get(`/projects/${id}/documents`)
            const docs = res.data || []
            setDocuments(docs)

            // Fetch event counts for each document
            const counts: Record<string, number> = {}
            for (const doc of docs) {
                try {
                    const eventRes = await apiClient.get(`/documents/${doc.id}`)
                    counts[doc.id] = eventRes.data.events?.length || 0
                } catch (err) {
                    counts[doc.id] = 0
                }
            }
            setEventCounts(counts)
        } catch (error) {
            console.error("Failed to fetch documents", error)
        }
    }

    const fetchDocumentEvents = async (docId: string) => {
        try {
            const res = await apiClient.get(`/documents/${docId}`)
            setActiveDoc(res.data.document)
            setEvents(res.data.events)

            // Update event count
            setEventCounts(prev => ({
                ...prev,
                [docId]: res.data.events?.length || 0
            }))

            // Update the document in the list
            setDocuments(prev => prev.map(doc =>
                doc.id === docId ? res.data.document : doc
            ))
        } catch (error) {
            console.error("Failed to fetch doc events", error)
        }
    }

    const handleUploadSuccess = (docIds: string[]) => {
        // Fetch all newly uploaded documents
        docIds.forEach(docId => {
            fetchDocumentEvents(docId)
        })

        // Refresh document list
        fetchDocuments()

        // Set the first uploaded doc as active
        if (docIds.length > 0) {
            setActiveDoc({ id: docIds[0], status: "processing" })
            // Auto-expand document list to show new uploads
            setIsDocListExpanded(true)
        }
    }

    const selectDocument = (doc: any) => {
        setActiveDoc(doc)
        fetchDocumentEvents(doc.id)
        // Auto-collapse document list when selecting to make room for document preview
        setIsDocListExpanded(false)
    }

    const handleDeleteDocument = async (docId: string) => {
        try {
            await apiClient.delete(`/documents/${docId}`)
            toast("文件已刪除", "success")

            // Remove from list
            setDocuments(prev => prev.filter(doc => doc.id !== docId))

            // Clear active doc if it was deleted
            if (activeDoc?.id === docId) {
                setActiveDoc(null)
                setEvents([])
            }
        } catch (error) {
            console.error("Failed to delete document", error)
            toast("刪除失敗", "error")
        }
    }

    const handleRenameDocument = async (docId: string, newName: string) => {
        try {
            await apiClient.patch(`/documents/${docId}`, {
                original_filename: newName
            })
            toast("文件已重新命名", "success")

            // Update in list
            setDocuments(prev => prev.map(doc =>
                doc.id === docId ? { ...doc, original_filename: newName } : doc
            ))

            // Update active doc if it was renamed
            if (activeDoc?.id === docId) {
                setActiveDoc({ ...activeDoc, original_filename: newName })
            }
        } catch (error) {
            console.error("Failed to rename document", error)
            toast("重新命名失敗", "error")
        }
    }

    if (loading) return <div className="p-8"><Loader2 className="animate-spin" /></div>
    if (!project) return <div className="p-8">找不到專案</div>

    return (
        <div className="container mx-auto py-8 h-screen flex flex-col">
            {/* Header */}
            <div className="flex items-center mb-6">
                <Link href="/projects" className="mr-4 p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">{project.name}</h1>
                    <p className="text-gray-500 text-sm">{project.description}</p>
                </div>
            </div>

            {/* Main Layout (Split) */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Left: Document Upload & List & Preview */}
                <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
                    <h2 className="font-semibold text-lg">文件管理</h2>
                    <DocumentUploader projectId={id} onUploadSuccess={handleUploadSuccess} />

                    {/* Document List */}
                    {documents.length > 0 && (
                        <div ref={docListRef} className="border border-gray-200 rounded-lg overflow-visible bg-white flex-shrink-0">
                            {/* Collapsible Header */}
                            <button
                                onClick={() => setIsDocListExpanded(!isDocListExpanded)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {isDocListExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                    )}
                                    <h3 className="text-sm font-semibold text-gray-700">
                                        已上傳文件
                                    </h3>
                                </div>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                    {documents.length}
                                </span>
                            </button>

                            {/* Expandable Content */}
                            {isDocListExpanded && (
                                <div className="border-t border-gray-100 p-3 space-y-2 bg-gray-50/50 max-h-96 overflow-y-auto">
                                    {documents.map((doc) => (
                                        <DocumentCard
                                            key={doc.id}
                                            document={doc}
                                            isActive={activeDoc?.id === doc.id}
                                            eventCount={eventCounts[doc.id] || 0}
                                            onClick={() => selectDocument(doc)}
                                            onDelete={handleDeleteDocument}
                                            onRename={handleRenameDocument}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Member Management */}
                    <div className="border border-gray-200 rounded-lg bg-white p-4">
                        <MemberManager projectId={id} isOwner={isOwner} />
                    </div>

                    {activeDoc && (
                        <div className="flex-1 border rounded-lg bg-white shadow-sm flex flex-col min-h-[400px] max-h-[600px]">
                            <div className="px-6 py-4 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-700 mb-3">文件資訊</h3>
                                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                    <div>
                                        <span className="font-medium text-gray-500">檔名:</span>
                                        <p className="mt-1 truncate">{activeDoc.original_filename || activeDoc.filename || '處理中...'}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium text-gray-500">格式:</span>
                                        <p className="mt-1">{activeDoc.file_type?.toUpperCase() || 'N/A'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="font-medium text-gray-500">狀態:</span>
                                        <span className={
                                            activeDoc.status === 'completed' ? 'ml-2 text-green-600 font-medium' :
                                            activeDoc.status === 'processing' ? 'ml-2 text-amber-600 font-medium' :
                                            activeDoc.status === 'error' ? 'ml-2 text-red-600 font-medium' :
                                            'ml-2 text-gray-600'
                                        }>
                                            {activeDoc.status === 'completed' ? '✓ 完成' :
                                             activeDoc.status === 'processing' ? '⏳ 處理中' :
                                             activeDoc.status === 'error' ? '✗ 錯誤' :
                                             activeDoc.status}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                {activeDoc.status === 'processing' ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <Loader2 className="w-12 h-12 text-gray-300 mb-4 animate-spin" />
                                        <p className="text-gray-500 text-sm">正在解析文件內容...</p>
                                    </div>
                                ) : activeDoc.raw_content ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                                                <FileText className="w-4 h-4 mr-2" />
                                                文件內容預覽
                                            </h4>
                                            <span className="text-xs text-gray-400">
                                                {activeDoc.raw_content.length.toLocaleString()} 字元
                                            </span>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                                                {activeDoc.raw_content}
                                            </pre>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <FileText className="w-16 h-16 text-gray-300 mb-4" />
                                        <p className="text-gray-400 text-sm">無法載入文件內容</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {activeDoc.status === 'error' ? '文件處理時發生錯誤' : '請稍後再試'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: AI Events */}
                <div className="flex flex-col space-y-4 overflow-y-auto pl-2 border-l">
                    <h2 className="font-semibold text-lg flex items-center justify-between">
                        <span>AI 解析結果</span>
                        {activeDoc?.status === "processing" && <span className="text-xs text-amber-500 flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> 解析中...</span>}
                    </h2>

                    <EventEditor events={events} onUpdate={() => fetchDocumentEvents(activeDoc.id)} />
                </div>
            </div>
        </div>
    )
}
