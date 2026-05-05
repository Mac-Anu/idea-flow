import { Loader2 } from "lucide-react";

export default function GlobalLoading() {
    return (
        <div className="flex min-h-[60vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-[#c8a96e]" />
                <p className="text-sm text-[#9b8f80] animate-pulse">加载中...</p>
            </div>
        </div>
    );
}
