"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/80 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-foreground group-[.toaster]:border-border/30 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-full px-5 py-3.5 flex items-center gap-3",
          description: "group-[.toast]:text-muted-foreground text-[13px] font-medium",
          title: "text-[14px] font-medium tracking-tight",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium rounded-full px-4 py-1.5 text-[13px]",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium rounded-full px-4 py-1.5 text-[13px]",
          icon: "group-data-[type=error]:text-destructive group-data-[type=success]:text-emerald-500 group-data-[type=warning]:text-amber-500 group-data-[type=info]:text-blue-500 w-4 h-4",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
