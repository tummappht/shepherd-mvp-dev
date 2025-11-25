import { memo, useMemo, useCallback } from "react";
import { TbChevronDown } from "react-icons/tb";

/**
 * Fuzzy match helper function
 */
const fuzzyMatch = (str, pattern) => {
  const patternLower = pattern.toLowerCase();
  const strLower = str.toLowerCase();
  let patternIdx = 0;
  for (
    let i = 0;
    i < strLower.length && patternIdx < patternLower.length;
    i++
  ) {
    if (strLower[i] === patternLower[patternIdx]) {
      patternIdx++;
    }
  }
  return patternIdx === patternLower.length;
};

const TreeCheckbox = memo(
  ({
    data,
    level = 0,
    onCheck,
    readOnly = false,
    expandedKeys,
    onExpand,
    searchValue,
  }) => {
    const isExpanded = expandedKeys.includes(data.key);
    const hasChildren = data.childs && data.childs.length > 0;

    // Memoize search matching and readOnly filtering
    const shouldShow = useMemo(() => {
      // If readOnly, only show selected nodes or nodes with selected children
      if (readOnly) {
        const hasSelectedInTree = (node) => {
          if (node.selected) return true;
          if (node.childs) {
            return node.childs.some((child) => hasSelectedInTree(child));
          }
          return false;
        };
        if (!hasSelectedInTree(data)) return false;
      }

      // Check search match
      const matchesSearch = (node, search) => {
        if (!search) return true;
        if (fuzzyMatch(node.key, search)) return true;
        if (node.childs) {
          return node.childs.some((child) => matchesSearch(child, search));
        }
        return false;
      };
      return matchesSearch(data, searchValue);
    }, [data, searchValue, readOnly]);

    // Memoize indeterminate state
    // const isIndeterminate = useMemo(() => {
    //   if (!hasChildren) return false;
    //   if (data.indeterminate) return true;
    //   const selectedCount = data.childs.filter(
    //     (child) => child.selected
    //   ).length;
    //   return selectedCount > 0 && selectedCount < data.childs.length;
    // }, [hasChildren, data.indeterminate, data.childs]);

    // Memoize label rendering
    const renderedLabel = useMemo(() => {
      if (!searchValue) return data.key;

      const patternLower = searchValue.toLowerCase();
      const strLower = data.key.toLowerCase();
      const matches = [];
      let patternIdx = 0;

      for (let i = 0; i < strLower.length; i++) {
        if (
          patternIdx < patternLower.length &&
          strLower[i] === patternLower[patternIdx]
        ) {
          matches.push(i);
          patternIdx++;
        }
      }

      if (matches.length === 0) return data.key;

      const parts = [];
      let lastIdx = 0;

      matches.forEach((matchIdx) => {
        if (matchIdx > lastIdx) {
          parts.push(data.key.substring(lastIdx, matchIdx));
        }
        parts.push(
          <span key={matchIdx} className="bg-primary/50">
            {data.key[matchIdx]}
          </span>
        );
        lastIdx = matchIdx + 1;
      });

      if (lastIdx < data.key.length) {
        parts.push(data.key.substring(lastIdx));
      }

      return <>{parts}</>;
    }, [data.key, searchValue]);

    const handleToggle = useCallback(
      (e) => {
        e.stopPropagation();
        if (hasChildren && onExpand) {
          onExpand(data.key);
        }
      },
      [hasChildren, onExpand, data.key]
    );

    const handleCheck = useCallback(
      (e) => {
        e.stopPropagation();
        if (!readOnly && onCheck) {
          onCheck(data.key, !data.selected);
        }
      },
      [readOnly, onCheck, data.key, data.selected]
    );

    if (!shouldShow) return null;

    return (
      <div
        className={
          level === 0 ? "border-t border-secondary first:border-t-0" : ""
        }
      >
        <div
          className={`flex justify-between items-center py-2 px-3 hover:bg-surface-hover transition-colors duration-200 ${
            level > 0 ? `pl-${3 + level * 5}` : ""
          }`}
          style={{
            paddingLeft: level > 0 ? `${12 + level * 20}px` : undefined,
          }}
        >
          <div
            className="flex items-center gap-2 flex-1 cursor-pointer"
            onClick={handleCheck}
          >
            <div className="relative flex items-center justify-center flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={data.selected || false}
                readOnly
              />
              <label className="block w-2 h-2 bg-bg-checkbox rounded-sm cursor-pointer">
                <div className="w-full h-full flex items-center justify-center">
                  {data.selected && (
                    <div className="w-1 h-1 bg-primary rounded-xs" />
                  )}
                  {/* {isIndeterminate && !data.selected && (
                    <div className="w-1 h-0.5 bg-primary rounded-xs" />
                  )} */}
                </div>
              </label>
            </div>
            <span className="text-white text-sm font-mono cursor-pointer flex-1 select-none">
              {renderedLabel}
            </span>
          </div>
          {data.suffix && (
            <div className="ml-2 text-xs text-secondary italic select-none">
              <span>{data.suffix}</span>
            </div>
          )}
          {hasChildren && (
            <button
              type="button"
              className="flex-shrink-0"
              onClick={handleToggle}
            >
              <TbChevronDown
                className={`transition-transform text-sm text-secondary ${
                  isExpanded ? "-rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="overflow-scroll max-h-40">
            {data.childs.map((child, i) => (
              <TreeCheckbox
                key={child.key + i}
                data={child}
                level={level + 1}
                onCheck={onCheck}
                readOnly={readOnly}
                expandedKeys={expandedKeys}
                onExpand={onExpand}
                searchValue={searchValue}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

TreeCheckbox.displayName = "TreeCheckbox";

export default TreeCheckbox;
