import PropTypes from "prop-types";
import { TbDots } from "react-icons/tb";

export default function ListItem({ items, renderIcon, onItemClick }) {
  return (
    <div className="flex flex-col gap-2 min-h-0 list-item-wrap">
      {items.map((item) => (
        <button
          type="button"
          key={item.name}
          className={`flex flex-row border border-gray-border rounded-lg px-6 py-3 items-center justify-between cursor-pointer transition-all`}
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
};
