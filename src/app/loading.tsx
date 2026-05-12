import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
    return (
        <div className="flex min-h-[60vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">加载中...</p>
            </div>
        </div>
    );
}
