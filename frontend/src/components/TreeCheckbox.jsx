"use client";

import { useMemo, useState, useEffect } from "react";
import { TbChevronDown } from "react-icons/tb";

const TreeCheckbox = ({
  data,
  level = 0,
  onToggle,
  onCheck,
  parentValue = null,
  readOnly = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    if (hasChildren) {
      const newExpandedState = !isExpanded;
      setIsExpanded(newExpandedState);
    }

    if (!readOnly && onCheck) {
      onCheck(data.key, !data.selected);
    }

    if (onToggle) {
      onToggle(data.key);
    }
  };

  const isChild = useMemo(() => level > 0, [level]);

  const hasChildren = useMemo(
    () => data.childs && data.childs.length > 0,
    [data.childs]
  );

  const value = useMemo(
    () => `${parentValue ? parentValue + "-" : ""}${data.key}`,
    [parentValue, data.key]
  );

  const label = useMemo(() => `${data.key}`, [data.key]);

  return (
    <div
      className={`tree-node ${
        isChild
          ? ""
          : "[&:not(:first-child)]:border-t [&:not(:first-child)]:border-secondary"
      } `}
    >
      <div
        className={`flex justify-between items-center py-2 px-3 cursor-pointer hover:bg-surface-hover transition-colors duration-200 ${
          isChild ? "pl-7" : ""
        }`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={data.selected || false}
              id={value}
              name={value}
              readOnly
            />
            <label
              htmlFor={value}
              className="block w-2 h-2 bg-bg-checkbox rounded-sm cursor-pointer"
            >
              <div className="w-full h-full flex items-center justify-center">
                {data.selected && (
                  <div className="w-1 h-1 bg-primary rounded-xs" />
                )}
              </div>
            </label>
          </div>
          <label
            className="text-white text-sm font-mono cursor-pointer"
            htmlFor={value}
          >
            {label}
          </label>
        </div>
        {hasChildren && (
          <TbChevronDown
            className={`transition-transform text-sm text-secondary ${
              isExpanded ? "-rotate-180" : ""
            }`}
          />
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="overflow-scroll max-h-40">
          {data.childs.map((child) => (
            <TreeCheckbox
              key={child.key}
              data={child}
              level={level + 1}
              onToggle={onToggle}
              onCheck={onCheck}
              parentValue={data.key}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function TreeCheckboxList({
  options,
  value,
  onChange,
  className = "",
  readOnly = false,
}) {
  const initializeData = (items) => {
    return items.map((item) => ({
      ...item,
      selected: item.selected !== undefined ? item.selected : false,
      childs: item.childs ? initializeData(item.childs) : [],
    }));
  };

  const [treeData, setTreeData] = useState(() => initializeData(options));

  useEffect(() => {
    if (options && options.length > 0) {
      if (value && value.length > 0) {
        setTreeData(value);
      } else {
        setTreeData(initializeData(options));
      }
    }
  }, [options]);

  const handleToggle = (nodeKey) => {
    console.log(`Toggled node: ${nodeKey}`);
  };

  const handleCheck = (nodeKey, checked) => {
    const updateNodeCheckState = (nodes, key, isChecked) => {
      return nodes.map((node) => {
        if (node.key === key) {
          const updatedNode = { ...node, selected: isChecked };
          if (node.childs && node.childs.length > 0) {
            updatedNode.childs = updateAllChildren(node.childs, isChecked);
          }
          return updatedNode;
        } else if (node.childs && node.childs.length > 0) {
          return {
            ...node,
            childs: updateNodeCheckState(node.childs, key, isChecked),
          };
        }
        return node;
      });
    };

    const updateAllChildren = (children, isChecked) => {
      return children.map((child) => {
        const updatedChild = { ...child, selected: isChecked };
        if (child.childs && child.childs.length > 0) {
          updatedChild.childs = updateAllChildren(child.childs, isChecked);
        }
        return updatedChild;
      });
    };

    const updateParentCheckState = (nodes) => {
      return nodes.map((node) => {
        if (node.childs && node.childs.length > 0) {
          const updatedChildren = updateParentCheckState(node.childs);
          const allChildrenChecked = updatedChildren.every(
            (child) => child.selected
          );
          const someChildrenChecked = updatedChildren.some(
            (child) => child.selected
          );

          return {
            ...node,
            childs: updatedChildren,
            selected:
              allChildrenChecked || (node.selected && someChildrenChecked),
          };
        }
        return node;
      });
    };

    let updatedData = updateNodeCheckState(treeData, nodeKey, checked);
    updatedData = updateParentCheckState(updatedData);
    setTreeData(updatedData);

    if (onChange) {
      onChange(updatedData);
    }
  };

  return (
    <div
      className={`whitespace-pre-wrap bg-bg-treemenu text-white border border-secondary w-full first ${className}`}
    >
      {treeData.map((node) => (
        <TreeCheckbox
          key={node.key}
          data={node}
          onToggle={handleToggle}
          onCheck={handleCheck}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}
