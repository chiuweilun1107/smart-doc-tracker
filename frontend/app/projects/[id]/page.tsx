
"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { apiClient } from "@/lib/api"
import { DocumentUploader } from "@/components/DocumentUploader"
import { EventEditor } from "@/components/EventEditor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProjectDetailPage() {
    const params = useParams()
    const id = params.id as string
    const [project, setProject] = useState<any>(null)
    const [documents, setDocuments] = useState<any[]>([]) // Should fetch doc list, but focusing on single flow first
    const [activeDoc, setActiveDoc] = useState<any>(null) // The currently selected/uploaded doc
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) fetchProject()
    }, [id])

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
            // Ideally fetch recent doc here too
        } catch (error) {
            console.error("Failed to fetch project", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchDocumentEvents = async (docId: string) => {
        try {
            const res = await apiClient.get(`/documents/${docId}`)
            setActiveDoc(res.data.document)
            setEvents(res.data.events)
            // Stop polling if completed
        } catch (error) {
            console.error("Failed to fetch doc events", error)
        }
    }

    const handleUploadSuccess = (docId: string) => {
        // Trigger immediate fetch to set active doc state
        // Set a temporary active doc to trigger polling
        setActiveDoc({ id: docId, status: "processing" })
        fetchDocumentEvents(docId)
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
                {/* Left: Document & Preview */}
                <div className="flex flex-col space-y-4 overflow-y-auto pr-2">
                    <h2 className="font-semibold text-lg">文件上傳</h2>
                    <DocumentUploader projectId={id} onUploadSuccess={handleUploadSuccess} />

                    {activeDoc && (
                        <div className="flex-1 border rounded-lg bg-gray-100 flex items-center justify-center min-h-[400px]">
                            <p className="text-gray-400">PDF 預覽功能 (待實作)</p>
                            {/* Integrate iframe or react-pdf here */}
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
