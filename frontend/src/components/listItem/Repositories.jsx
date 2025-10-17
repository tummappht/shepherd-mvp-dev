"use client";

import { useRouter } from "next/navigation";
import ListItem from "./ListItem";
import { TbFolderCode } from "react-icons/tb";

// const sessions = [
//   { name: "Fusaka Upgrade" },
//   { name: "Brevis Pico ZKVM" },
//   { name: "LayerZero Endpoint V2 - Sui" },
//   { name: "Succinct" },
//   { name: "Makina Foundation" },
//   { name: "Monad" },
//   { name: "ZetaChain" },
//   { name: "Aptos Core" },
//   { name: "Sui" },
//   { name: "Sei Network" },
//   { name: "Celestia" },
//   { name: "Fuel Labs" },
//   { name: "StarkNet" },
// ];

const sessions = [];

export default function Repositories() {
  const router = useRouter();

  const defaultIcon = () => (
    <TbFolderCode className="text-2xl text-secondary" />
  );

  const onItemClick = () => {
    router.push("/new-test");
  };

  return (
    <ListItem
      items={sessions}
      defaultIcon={defaultIcon}
      onItemClick={onItemClick}
      emptyText="Create Session"
    />
  );
}
