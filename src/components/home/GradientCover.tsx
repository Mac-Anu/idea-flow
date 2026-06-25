import { cn } from "@/lib/utils";

const PALETTES = [
    {
        base: "oklch(0.24 0.19 263)",
        glow: "oklch(0.62 0.22 246 / 0.72)",
        waveA: "oklch(0.34 0.19 250 / 0.72)",
        waveB: "oklch(0.17 0.17 268 / 0.78)",
        waveC: "oklch(0.10 0.11 276 / 0.72)",
    },
    {
        base: "oklch(0.23 0.16 222)",
        glow: "oklch(0.58 0.18 216 / 0.7)",
        waveA: "oklch(0.32 0.15 224 / 0.74)",
        waveB: "oklch(0.15 0.12 246 / 0.78)",
        waveC: "oklch(0.11 0.09 260 / 0.74)",
    },
    {
        base: "oklch(0.24 0.16 284)",
        glow: "oklch(0.55 0.22 276 / 0.68)",
        waveA: "oklch(0.33 0.18 275 / 0.72)",
        waveB: "oklch(0.16 0.15 292 / 0.78)",
        waveC: "oklch(0.11 0.11 300 / 0.72)",
    },
    {
        base: "oklch(0.23 0.14 194)",
        glow: "oklch(0.58 0.17 196 / 0.66)",
        waveA: "oklch(0.32 0.15 204 / 0.72)",
        waveB: "oklch(0.14 0.12 224 / 0.78)",
        waveC: "oklch(0.10 0.09 240 / 0.72)",
    },
    {
        base: "oklch(0.23 0.17 300)",
        glow: "oklch(0.58 0.23 318 / 0.62)",
        waveA: "oklch(0.33 0.18 304 / 0.7)",
        waveB: "oklch(0.15 0.15 286 / 0.78)",
        waveC: "oklch(0.10 0.11 278 / 0.72)",
    },
    {
        base: "oklch(0.24 0.15 238)",
        glow: "oklch(0.56 0.20 232 / 0.68)",
        waveA: "oklch(0.34 0.17 238 / 0.72)",
        waveB: "oklch(0.15 0.13 260 / 0.78)",
        waveC: "oklch(0.10 0.10 272 / 0.72)",
    },
];

function paletteIndex(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % PALETTES.length;
}

export function GradientCover({
    seed,
    className,
    variant = "default",
}: {
    seed: string;
    className?: string;
    variant?: "default" | "featured";
}) {
    const idx = paletteIndex(seed || "default");
    const palette = PALETTES[idx];

    if (variant === "featured") {
        return (
            <div aria-hidden className={cn("relative h-full w-full overflow-hidden", className)}>
                <div
                    className="absolute inset-0"
                    style={{
                        background:
                            "radial-gradient(circle at 14% 8%, oklch(0.74 0.2 38 / 0.36), transparent 26%), " +
                            "radial-gradient(circle at 86% 18%, oklch(0.62 0.2 255 / 0.42), transparent 30%), " +
                            "linear-gradient(135deg, oklch(0.16 0.08 270), oklch(0.10 0.06 265) 48%, oklch(0.15 0.08 235))",
                    }}
                />
                <div className="absolute -left-[12%] top-[12%] h-[36%] w-[78%] -rotate-[9deg] rounded-[999px] bg-[oklch(0.34_0.18_265_/_0.72)]" />
                <div className="absolute right-[-18%] top-[24%] h-[34%] w-[76%] -rotate-[13deg] rounded-[999px] bg-[oklch(0.46_0.2_238_/_0.54)]" />
                <div className="absolute -bottom-[20%] left-[4%] h-[40%] w-[108%] -rotate-[4deg] rounded-[999px] bg-[oklch(0.12_0.13_276_/_0.78)]" />
                <div className="absolute left-[58%] top-[-24%] h-[70%] w-[42%] rotate-[18deg] rounded-full bg-[oklch(0.68_0.2_38_/_0.22)] blur-2xl" />
                <div
                    className="absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                        backgroundSize: "38px 38px",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/18 via-black/5 to-black/25" />
            </div>
        );
    }

    return (
        <div aria-hidden className={cn("relative h-full w-full overflow-hidden", className)}>
            <div
                className="absolute inset-0"
                style={{
                    background:
                        `radial-gradient(circle at 18% 12%, ${palette.glow}, transparent 28%), ` +
                        `linear-gradient(135deg, ${palette.base}, oklch(0.12 0.11 269) 62%, ${palette.waveC})`,
                }}
            />
            <div
                className="absolute -left-[28%] top-[8%] h-[36%] w-[92%] -rotate-[18deg] rounded-[999px] opacity-90"
                style={{ background: palette.waveA }}
            />
            <div
                className="absolute -right-[32%] top-[34%] h-[34%] w-[108%] -rotate-[12deg] rounded-[999px] opacity-90"
                style={{ background: palette.waveB }}
            />
            <div
                className="absolute -left-[18%] bottom-[-5%] h-[30%] w-[112%] -rotate-[7deg] rounded-[999px] opacity-80"
                style={{ background: palette.waveC }}
            />
            <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                    backgroundSize: "34px 34px",
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10" />
        </div>
    );
}
