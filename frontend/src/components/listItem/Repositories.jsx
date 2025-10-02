import ListItem from "./ListItem";
import { TbFolderCode } from "react-icons/tb";

export default function Repositories() {
  const repositories = [
    { name: "Fusaka Upgrade" },
    { name: "Brevis Pico ZKVM" },
    { name: "LayerZero Endpoint V2 - Sui" },
    { name: "Succinct" },
    { name: "Makina Foundation" },
    { name: "Monad" },
    { name: "ZetaChain" },
    { name: "Aptos Core" },
    { name: "Sui" },
    { name: "Sei Network" },
    { name: "Celestia" },
    { name: "Fuel Labs" },
    { name: "StarkNet" },
  ];

  const renderIcon = () => <TbFolderCode className="text-2xl text-secondary" />;

  return (
    <ListItem items={repositories} renderIcon={renderIcon} onItemClick={null} />
  );
}
