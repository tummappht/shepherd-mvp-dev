"use client";
import Repositories from "@/components/listItem/Repositories";
import References from "@/components/listItem/References";
import CollectionPanel from "@/components/CollectionPanel";
import WelcomeModal from "@/components/WelcomeModal";
import { useQuery } from "@tanstack/react-query";
import { serviceUserSessions } from "@/services/user";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

//TODO: Porto: Revised for the payment
export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["userSessions", { limit: 10 }],
    queryFn: () => serviceUserSessions({ limit: 10 }),
  });

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
              sessions={data?.sessions || []}
              userId={data?.user_id || ""}
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
