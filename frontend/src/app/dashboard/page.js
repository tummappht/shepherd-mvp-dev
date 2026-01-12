"use client";
import { useEffect, useState } from "react";
import Repositories from "@/components/listItem/Repositories";
import References from "@/components/listItem/References";
import CollectionPanel from "@/components/CollectionPanel";
import EditSessionNameModal from "@/components/modals/EditSessionNameModal";
import { useInfiniteQuery } from "@tanstack/react-query";
import { serviceUserSessions } from "@/services/user";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import WelcomeModal from "@/components/modals/WelcomeModal";

export default function Dashboard() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const {
    data,
    isLoading,
    isRefetching,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["userSessions"],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        return await serviceUserSessions({ limit: 10, offset: pageParam });
      } catch (_err) {
        return { sessions: [] };
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      const pageSize = 10;
      const currentOffset = allPages.length * pageSize;
      return lastPage?.sessions?.length === pageSize
        ? currentOffset
        : undefined;
    },
    initialPageParam: 0,
    retry: false,
  });

  const sessions = data?.pages.flatMap((page) => page.sessions) || [];

  const handleEditSession = (session) => {
    setSelectedSession(session);
    setIsEditModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => setSelectedSession(null), 300);
  };

  return (
    <>
      <div className="container mx-auto flex flex-col gap-4 h-full">
        <div
          className="py-4 px-6 md:py-6 md:px-8 bg-background border border-stroke rounded-lg overflow-hidden flex flex-col transition-all relative"
          style={{ height: "70%" }}
        >
          {(isLoading || isRefetching) && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
              <div className="text-lg text-white flex items-center gap-2">
                <span>Loading</span>
                <AiOutlineLoading3Quarters className="animate-spin" />
              </div>
            </div>
          )}
          <CollectionPanel
            title="Session"
            description="Access all your previous runs."
            href="/new-test"
          >
            <Repositories
              sessions={sessions}
              onLoadMore={fetchNextPage}
              hasMore={hasNextPage}
              isLoadingMore={isFetchingNextPage}
              onEditSession={handleEditSession}
            />
          </CollectionPanel>
        </div>
        <div className="py-4 px-6 md:py-6 md:px-8 bg-background border border-stroke rounded-lg overflow-hidden flex flex-col flex-1 transition-all">
          <CollectionPanel
            title="Ground Truths"
            description="Identify smart contracts and reports with similar vulnerabilities to support your hypothesis."
            href="#"
          >
            <References />
          </CollectionPanel>
        </div>
      </div>
      <WelcomeModal />
      <EditSessionNameModal
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        session={selectedSession}
      />
    </>
  );
}
