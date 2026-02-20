import { LucideIcon } from "lucide-react"

export function EmptyState({ icon: Icon, title, description, action }: {
    icon: LucideIcon; title: string; description?: string; action?: React.ReactNode
}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
            <div className="rounded-full bg-muted p-4">
                <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">{title}</h3>
            {description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
            {action}
        </div>
    )
}
