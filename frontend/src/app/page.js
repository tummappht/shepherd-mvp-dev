"use client";
import Repositories from "@/components/listItem/Repositories";
import References from "@/components/listItem/References";
import CollectionPanel from "@/components/CollectionPanel";
import WelcomeModal from "@/components/WelcomeModal";

export default function Home() {
  return (
    <>
      <div className="container flex flex-col gap-4 h-full">
        <div
          className="py-6 px-8 bg-background border border-stroke rounded-lg overflow-hidden flex flex-col"
          style={{ height: "70%" }}
        >
          <CollectionPanel
            title="Session"
            description="Access all your previous runs."
            href="/new-test"
          >
            <Repositories />
          </CollectionPanel>
        </div>
        <div className="py-6 px-8 bg-background border border-stroke rounded-lg overflow-hidden flex flex-col flex-1">
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
