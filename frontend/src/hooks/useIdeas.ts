"use client";

import { useEffect } from "react";
import { useIdeaStore, useAuthStore } from "@/lib/store";

/**
 * Hook that initializes ideas + auth on mount
 * and provides access to the idea store.
 */
export function useIdeas() {
  const store = useIdeaStore();
  const initAuth = useAuthStore((s) => s.init);

  useEffect(() => {
    initAuth();
    store.loadIdeas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ideas: store.filteredIdeas(),
    allIdeas: store.ideas,
    loading: store.loading,
    filterStatus: store.filterStatus,
    searchQuery: store.searchQuery,
    sortBy: store.sortBy,
    sortDir: store.sortDir,
    addIdea: store.addIdea,
    updateIdea: store.updateIdea,
    removeIdea: store.removeIdea,
    getIdea: store.getIdea,
    setFilterStatus: store.setFilterStatus,
    setSearchQuery: store.setSearchQuery,
    setSortBy: store.setSortBy,
    toggleSortDir: store.toggleSortDir,
  };
}
