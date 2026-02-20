import { Loader2 } from "lucide-react"

export function LoadingState({ text = "載入中..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px] space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{text}</p>
        </div>
    )
}
