"use client";

import PropTypes from "prop-types";
import { TbDots, TbSquarePlus } from "react-icons/tb";

export default function ListItem({
  items,
  defaultIcon,
  onItemClick,
  columns = 1,
  emptyText = "Create your first item",
}) {
  const getColumnClass = () => {
    if (columns === 2) {
      return "grid grid-cols-2 gap-x-3 gap-y-3";
    }
    return "grid grid-cols-1 gap-y-3";
  };

  const renderListItem = (item) => {
    if (items.length === 0) {
      return (
        <button
          type="button"
          key={emptyText}
          className={`flex flex-1 items-center justify-between border border-dashed border-gray-border rounded-lg px-6 cursor-pointer transition-all h-14 text-secondary`}
        >
          <div className="flex flex-row gap-2 items-center">
            <TbSquarePlus className="text-2xl" />
            <p className="text-sm">{emptyText}</p>
          </div>
        </button>
      );
    }

    return (
      <button
        type="button"
        key={item.name}
        className={`flex flex-1 items-center justify-between border border-gray-border rounded-lg px-6 cursor-pointer transition-all h-14`}
        onClick={() => onItemClick?.(item.name)}
      >
        <div className="flex flex-row gap-2 items-center">
          {item.icon ? item.icon : defaultIcon ? defaultIcon() : null}
          <p className="text-sm text-white">{item.name}</p>
        </div>
        <TbDots className="text-lg text-secondary" />
      </button>
    );
  };

  return (
    <div className={`overflow-y-auto flex-1 ${getColumnClass()}`}>
      {renderListItem(items)}
    </div>
  );
}

ListItem.propTypes = {
  items: PropTypes.array.isRequired,
  defaultIcon: PropTypes.func,
  onItemClick: PropTypes.func,
  columns: PropTypes.oneOf([1, 2]),
};
