import { create } from "zustand";

type PreviewDevice = "ios" | "android";

interface UIState {
  sidebarOpen: boolean;
  upgradeModalOpen: boolean;
  selectedTemplateId: string | null;
  previewDevice: PreviewDevice;
  activeTab: string;
  toggleSidebar: () => void;
  setUpgradeModal: (open: boolean) => void;
  setSelectedTemplate: (id: string | null) => void;
  setPreviewDevice: (device: PreviewDevice) => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  upgradeModalOpen: false,
  selectedTemplateId: null,
  previewDevice: "ios",
  activeTab: "",
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setUpgradeModal: (upgradeModalOpen) => set({ upgradeModalOpen }),
  setSelectedTemplate: (selectedTemplateId) => set({ selectedTemplateId }),
  setPreviewDevice: (previewDevice) => set({ previewDevice }),
  setActiveTab: (activeTab) => set({ activeTab }),
}));
