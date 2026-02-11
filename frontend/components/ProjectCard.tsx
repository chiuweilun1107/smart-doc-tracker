"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CalendarDays, FileText, ArrowRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { EditProjectDialog } from "@/components/EditProjectDialog"
import { DeleteProjectDialog } from "@/components/DeleteProjectDialog"

interface ProjectProps {
    id: string
    name: string
    description?: string
    status?: "active" | "archived"
    docCount?: number
    eventCount?: number
    createdAt?: string
    onProjectChanged?: () => void
}

export function ProjectCard({
    id,
    name,
    description,
    status = "active",
    docCount = 0,
    eventCount = 0,
    createdAt,
    onProjectChanged,
}: ProjectProps) {
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)

    const formattedDate = createdAt
        ? new Date(createdAt).toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" })
        : null

    return (
        <>
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-xl font-bold truncate flex-1 mr-2">{name}</CardTitle>
                        <div className="flex items-center gap-1">
                            <Badge variant={status === "active" ? "default" : "secondary"}>
                                {status === "active" ? "進行中" : "已封存"}
                            </Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        編輯
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => setDeleteOpen(true)}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        刪除
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                        {description || "無描述"}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="flex space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            <span>{docCount} 文件</span>
                        </div>
                        <div className="flex items-center">
                            <CalendarDays className="w-4 h-4 mr-1" />
                            <span>{eventCount} 期限</span>
                        </div>
                    </div>
                    {formattedDate && (
                        <p className="text-xs text-gray-400 mt-2">建立於 {formattedDate}</p>
                    )}
                </CardContent>
                <CardFooter className="pt-2 border-t bg-gray-50/50">
                    <Button variant="ghost" className="w-full justify-between group" asChild>
                        <a href={`/projects/${id}`}>
                            查看詳情
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </Button>
                </CardFooter>
            </Card>

            <EditProjectDialog
                project={{ id, name, description }}
                open={editOpen}
                onOpenChange={setEditOpen}
                onProjectUpdated={onProjectChanged || (() => {})}
            />

            <DeleteProjectDialog
                project={{ id, name }}
                docCount={docCount}
                eventCount={eventCount}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                onProjectDeleted={onProjectChanged || (() => {})}
            />
        </>
    )
}
