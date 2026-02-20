
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCardProps {
    title: string
    value: string | number
    description?: string
    trend?: "up" | "down" | "neutral"
    icon?: React.ReactNode
    variant?: "default" | "destructive" | "warning"
}

export function StatCard({
    title,
    value,
    description,
    trend,
    icon,
    variant = "default",
}: StatCardProps) {
    const getVariantStyles = () => {
        switch (variant) {
            case "destructive":
                return "border-red-200 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200 dark:border-red-900/50"
            case "warning":
                return "border-amber-200 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900/50"
            default:
                return "bg-card text-card-foreground"
        }
    }

    return (
        <Card className={`${getVariantStyles()}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon && <div className="text-muted-foreground">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
