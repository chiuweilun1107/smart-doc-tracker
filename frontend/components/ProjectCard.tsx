
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, FileText, ArrowRight } from "lucide-react"

interface ProjectProps {
    id: string
    name: string
    description?: string
    status?: "active" | "archived"
    docCount?: number
    eventCount?: number
    updatedAt?: string
}

export function ProjectCard({
    id,
    name,
    description,
    status = "active",
    docCount = 0,
    eventCount = 0,
    updatedAt,
}: ProjectProps) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold truncate">{name}</CardTitle>
                    <Badge variant={status === "active" ? "default" : "secondary"}>
                        {status === "active" ? "進行中" : "已封存"}
                    </Badge>
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
    )
}
