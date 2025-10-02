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
  ];

  const renderIcon = () => <TbFolderCode className="text-lg text-secondary" />;

  return (
    <ListItem items={repositories} renderIcon={renderIcon} onItemClick={null} />
  );
}
