import { BubbleMenu } from "@tiptap/react/menus";
import { Editor } from "@tiptap/react";
import { RefObject } from "react";
import { LinkPanel } from "./LinkPanel";
import { AiMenu } from "./AiMenu";
import { FormatMenu } from "./FormatMenu";

export interface EditorBubbleMenuProps {
    editor: Editor | null;
    states: {
        isLinkPanelOpen: boolean;
        linkHref: string;
        linkText: string;
        isUploadingImage: boolean;
        isAiMenuOpen: boolean;
        aiLoading: boolean;
        aiExplanation: string | null;
    };
    actions: {
        setIsLinkPanelOpen: (isOpen: boolean) => void;
        setLinkHref: (href: string) => void;
        setLinkText: (text: string) => void;
        setIsAiMenuOpen: (isOpen: boolean) => void;
        setAiExplanation: (text: string | null) => void;
        handleAiAction: (action: "tldr" | "polish" | "continue" | "explain") => Promise<void>;
        handleImageUploadClick: () => void;
    };
    refs: {
        panelRef: RefObject<HTMLDivElement | null>;
    };
}

export function EditorBubbleMenu({ editor, states, actions, refs }: EditorBubbleMenuProps) {
    if (!editor) return null;

    return (
        <BubbleMenu editor={editor}>
            {states.isLinkPanelOpen ? (
                <LinkPanel
                    editor={editor}
                    linkHref={states.linkHref}
                    setLinkHref={actions.setLinkHref}
                    linkText={states.linkText}
                    setLinkText={actions.setLinkText}
                    isLinkPanelOpen={states.isLinkPanelOpen}
                    setIsLinkPanelOpen={actions.setIsLinkPanelOpen}
                    panelRef={refs.panelRef}
                />
            ) : states.isAiMenuOpen ? (
                <AiMenu
                    editor={editor}
                    isAiMenuOpen={states.isAiMenuOpen}
                    setIsAiMenuOpen={actions.setIsAiMenuOpen}
                    aiLoading={states.aiLoading}
                    aiExplanation={states.aiExplanation}
                    setAiExplanation={actions.setAiExplanation}
                    handleAiAction={actions.handleAiAction}
                />
            ) : (
                <FormatMenu
                    editor={editor}
                    isLinkPanelOpen={states.isLinkPanelOpen}
                    setIsLinkPanelOpen={actions.setIsLinkPanelOpen}
                    setLinkText={actions.setLinkText}
                    setLinkHref={actions.setLinkHref}
                    isUploadingImage={states.isUploadingImage}
                    handleImageUploadClick={actions.handleImageUploadClick}
                    setIsAiMenuOpen={actions.setIsAiMenuOpen}
                />
            )}
        </BubbleMenu>
    );
}
