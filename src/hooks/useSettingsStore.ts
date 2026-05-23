import { create } from "zustand";

interface SettingsState {
    isOpen: boolean;
    activeTab: "profile" | "security" | "sessions" | "appearance" | "organization" | "billing";
    openSettings: (tab?: "profile" | "security" | "sessions" | "appearance" | "organization" | "billing") => void;
    closeSettings: () => void;
    setTab: (tab: "profile" | "security" | "sessions" | "appearance" | "organization" | "billing") => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    isOpen: false,
    activeTab: "profile",
    openSettings: (tab = "profile") => set({ isOpen: true, activeTab: tab }),
    closeSettings: () => set({ isOpen: false }),
    setTab: (tab) => set({ activeTab: tab }),
}));
