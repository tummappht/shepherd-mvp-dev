import { memo } from "react";
import { TbSearch, TbX } from "react-icons/tb";

const TreeSelectSearchBox = memo(
  ({
    searchValue,
    onSearchChange,
    onClearSearch,
    placeholder = "Search...",
  }) => {
    return (
      <div className="border-b border-secondary">
        <div className="relative">
          <TbSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 text-helper"
            size={16}
          />
          <input
            type="text"
            value={searchValue}
            onChange={onSearchChange}
            placeholder={placeholder}
            className="w-full text-white text-sm pl-9 pr-8 py-3 rounded-md bg-surface text-foreground placeholder-helper placeholder:italic focus-visible:outline-none"
          />
          {searchValue && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <TbX size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }
);

TreeSelectSearchBox.displayName = "TreeSelectSearchBox";

export default TreeSelectSearchBox;
