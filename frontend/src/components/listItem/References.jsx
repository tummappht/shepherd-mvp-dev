"use client";
import ListItem from "./ListItem";
import { TbFileText } from "react-icons/tb";

export default function References() {
  const references = [
    { name: "Hash-collisions.sol" },
    { name: "Invariant.sol" },
    { name: "ReadOnlyReentrancy.sol" },
  ];

  const renderIcon = () => <TbFileText className="text-2xl text-secondary" />;

  return (
    <ListItem
      items={references}
      renderIcon={renderIcon}
      onItemClick={null}
      columns={2}
    />
  );
}
