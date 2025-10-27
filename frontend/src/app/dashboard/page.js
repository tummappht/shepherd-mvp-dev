"use client";
import Repositories from "@/components/listItem/Repositories";
import References from "@/components/listItem/References";
import CollectionPanel from "@/components/CollectionPanel";
import WelcomeModal from "@/components/WelcomeModal";
import { useInfiniteQuery } from "@tanstack/react-query";
import { serviceUserSessions } from "@/services/user";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

//TODO: Porto: Revised for the payment
export default function Dashboard() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["userSessions"],
    queryFn: ({ pageParam = 0 }) =>
      serviceUserSessions({ limit: 10, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * 10;
      return lastPage?.sessions?.length === 10 ? currentOffset : undefined;
    },
    initialPageParam: 0,
  });

  const sessions = data?.pages.flatMap((page) => page.sessions) || [];

  return (
    <>
      <div className="container mx-auto flex flex-col gap-4 h-full">
        <div
          className="py-4 px-6 md:py-6 md:px-8 bg-background border border-stroke rounded-lg overflow-hidden flex flex-col transition-all relative"
          style={{ height: "70%" }}
        >
          {isLoading && (
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
    </>
  );
}
