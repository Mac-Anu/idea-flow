import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Heading1, Heading2, Heading3, Code, Image as ImageIcon, Table, CheckSquare } from "lucide-react";
import "./SlashCommand.css";

export const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => {
        setSelectedIndex(0);
    }, [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === "ArrowUp") {
                upHandler();
                return true;
            }
            if (event.key === "ArrowDown") {
                downHandler();
                return true;
            }
            if (event.key === "Enter") {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    if (!props.items || props.items.length === 0) {
        return null;
    }

    return (
        <div className="slash-command-menu bg-background/80 backdrop-blur-xl border border-primary/20 text-foreground rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-white/10 p-2 gap-1 w-64 overflow-hidden relative">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5 flex items-center gap-1.5 mb-1">
                基础块 (Basic Blocks)
            </div>
            {props.items.map((item: any, index: number) => {
                const isSelected = index === selectedIndex;
                let Icon = null;
                switch (item.icon) {
                    case "heading-1": Icon = Heading1; break;
                    case "heading-2": Icon = Heading2; break;
                    case "heading-3": Icon = Heading3; break;
                    case "code": Icon = Code; break;
                    case "image": Icon = ImageIcon; break;
                    case "table": Icon = Table; break;
                    case "check-square": Icon = CheckSquare; break;
                    default: Icon = Code;
                }

                return (
                    <button
                        key={index}
                        onClick={() => selectItem(index)}
                        className={`w-full text-left px-3 py-2.5 text-sm rounded-xl transition-all flex items-center gap-3 group ${
                            isSelected
                                ? "bg-primary/15 text-primary shadow-sm"
                                : "text-foreground hover:bg-muted hover:text-foreground"
                        }`}
                    >
                        <div className={`p-1.5 rounded-md ${isSelected ? "bg-primary/20" : "bg-muted group-hover:bg-background"}`}>
                            {Icon && <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-[10px] text-muted-foreground opacity-80">{item.description}</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
});

CommandList.displayName = "CommandList";
