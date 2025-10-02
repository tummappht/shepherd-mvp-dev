"use client";
import ListItem from "./ListItem";
import { TbFileText } from "react-icons/tb";

export default function References() {
  const references = [
    { name: "Hash-collisions.sol" },
    { name: "Invariant.sol" },
    { name: "ReadOnlyReentrancy.sol" },
    { name: "Reentrancy.sol" },
    { name: "Selfdestruct.sol" },
    { name: "Timestamp-dependence.sol" },
    { name: "Unchecked-send.sol" },
    { name: "Unprotected-upgradeability.sol" },
    { name: "Unprotected-selfdestruct.sol" },
    { name: "Visibility.sol" },
    { name: "Wrong-inheritance-order.sol" },
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
