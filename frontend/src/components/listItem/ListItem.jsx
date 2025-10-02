import PropTypes from "prop-types";
import { TbDots } from "react-icons/tb";

export default function ListItem({
  items,
  renderIcon,
  onItemClick,
  columns = 1,
}) {
  const getColumnClass = () => {
    if (columns === 2) {
      return "grid grid-cols-2 gap-x-3 gap-y-3";
    }
    return "flex flex-col gap-x-3 gap-y-3";
  };

  return (
    <div className={`overflow-y-auto flex-1 ${getColumnClass()}`}>
      {items.map((item) => (
        <button
          type="button"
          key={item.name}
          className={`flex items-center justify-between border border-gray-border rounded-lg px-6 cursor-pointer transition-all h-14`}
          onClick={() => onItemClick?.(item.name)}
        >
          <div className="flex flex-row gap-2 items-center">
            {renderIcon?.(item)}
            <p className="text-sm text-white">{item.name}</p>
          </div>
          <TbDots className="text-lg text-secondary" />
        </button>
      ))}
    </div>
  );
}

ListItem.propTypes = {
  items: PropTypes.array.isRequired,
  renderIcon: PropTypes.func,
  onItemClick: PropTypes.func,
  columns: PropTypes.oneOf([1, 2]),
};
