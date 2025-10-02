"use client";
import Repositories from "@/components/listItem/Repositories";
import References from "@/components/listItem/References";
import CollectionPanel from "@/components/CollectionPanel";
import WelcomeModal from "@/components/WelcomeModal";

export default function Home() {
  return (
    <>
      <div className="container h-full mx-auto max-h-screen">
        <div className="grid grid-rows-[70%_1fr] gap-4 h-full">
          <div className="py-6 px-8 bg-background border border-stroke rounded-lg overflow-auto">
            <CollectionPanel
              title="Session"
              description="Access all your previous runs."
              href="/new-test"
            >
              <Repositories />
            </CollectionPanel>
          </div>
          <div className="py-8 px-8 bg-background border border-stroke rounded-lg overflow-auto">
            <CollectionPanel
              title="Ground Truths"
              description="Identify smart contracts and reports with similar vulnerabilities to support your hypothesis."
              href="#"
            >
              <References />
            </CollectionPanel>
          </div>
        </div>
      </div>
      {/* <WelcomeModal /> */}
    </>
  );
}
