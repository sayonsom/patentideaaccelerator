"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useIdeaStore } from "@/lib/store";

/**
 * Hook that loads ideas for the authenticated user
 * and provides access to the idea store.
 */
export function useIdeas() {
  const { data: session } = useSession();
  const store = useIdeaStore();

  useEffect(() => {
    if (session?.user?.id) {
      store.loadIdeas(session.user.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

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
