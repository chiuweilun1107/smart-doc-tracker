"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"
import { toast } from "@/lib/toast"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "專案名稱至少需要 2 個字元。",
    }),
    description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditProjectDialogProps {
    project: {
        id: string
        name: string
        description?: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
    onProjectUpdated: () => void
}

export function EditProjectDialog({ project, open, onOpenChange, onProjectUpdated }: EditProjectDialogProps) {
    const [loading, setLoading] = useState(false)
    const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: project.name,
            description: project.description || "",
        },
    })

    useEffect(() => {
        if (open) {
            reset({
                name: project.name,
                description: project.description || "",
            })
        }
    }, [open, project, reset])

    async function onSubmit(values: FormValues) {
        setLoading(true)
        try {
            await apiClient.put(`/projects/${project.id}`, values)
            toast("專案已更新", "success")
            onOpenChange(false)
            onProjectUpdated()
        } catch (error) {
            console.error("Error updating project:", error)
            toast("更新專案失敗，請稍後再試", "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>編輯專案</DialogTitle>
                    <DialogDescription>
                        修改專案的基本資訊。
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">
                                名稱
                            </Label>
                            <div className="col-span-3">
                                <Input
                                    id="edit-name"
                                    {...register("name")}
                                    className={errors.name ? "border-red-500" : ""}
                                />
                                {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="edit-description" className="text-right pt-2">
                                描述
                            </Label>
                            <Textarea
                                id="edit-description"
                                {...register("description")}
                                className="col-span-3"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "儲存中..." : "儲存變更"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
