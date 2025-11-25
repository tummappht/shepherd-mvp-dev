import { useState, useEffect, useCallback } from "react";
import TreeSelectSearchBox from "./TreeSelectSearchBox";
import TreeCheckbox from "./TreeCheckbox";

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

export default function TreeSelect({
  options,
  onChange,
  className = "",
  readOnly = false,
  showSearch = false,
  searchPlaceholder = "Search...",
  value = [],
}) {
  const [treeData, setTreeData] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  // Initialize tree data from options
  useEffect(() => {
    if (options) {
      const initializeTree = (nodes, isDeployed = true) => {
        return nodes.map((node) => {
          const chunks = node.chunks || node.childs || [];
          const isChildSelected = chunks.some((chunk) => chunk.selected);
          return {
            ...node,
            key: node.contract_name || node.chunk_name,
            suffix: node.chunk_type || null,
            isDeployed: isDeployed,
            selected: node.selected || isChildSelected || false,
            childs: chunks.length > 0 ? initializeTree(chunks, isDeployed) : [],
          };
        });
      };

      // Handle new structure with deployed/undeployed arrays
      if (options.deployed || options.undeployed) {
        const deployedNodes = options.deployed
          ? initializeTree(options.deployed, true)
          : [];
        const undeployedNodes = options.undeployed
          ? initializeTree(options.undeployed, false)
          : [];
        setTreeData([...deployedNodes, ...undeployedNodes]);
      } else if (Array.isArray(options) && options.length > 0) {
        // Handle legacy array structure
        setTreeData(initializeTree(options));
      } else {
        setTreeData([]);
      }
    }
  }, [options]);

  // Auto-expand all nodes when readOnly is true
  useEffect(() => {
    if (readOnly && treeData.length > 0) {
      const allKeys = [];
      const collectKeys = (nodes) => {
        nodes.forEach((node) => {
          if (node.childs && node.childs.length > 0) {
            allKeys.push(node.key);
            collectKeys(node.childs);
          }
        });
      };
      collectKeys(treeData);
      setExpandedKeys(allKeys);
    }
  }, [readOnly, treeData]);

  // Update tree data when value prop changes
  useEffect(() => {
    if (value && value.length > 0 && treeData.length > 0) {
      setTreeData(value);
    }
  }, [value]);

  const handleExpand = useCallback((nodeKey) => {
    setExpandedKeys((prev) => {
      if (prev.includes(nodeKey)) {
        return prev.filter((key) => key !== nodeKey);
      }
      return [...prev, nodeKey];
    });
  }, []);

  const updateAllChildren = useCallback((children, isChecked) => {
    return children.map((child) => ({
      ...child,
      selected: isChecked,
      childs: child.childs ? updateAllChildren(child.childs, isChecked) : [],
    }));
  }, []);

  const updateNode = useCallback(
    (nodes, key, isChecked) => {
      return nodes.map((node) => {
        if (node.key === key) {
          return {
            ...node,
            selected: isChecked,
            // indeterminate: false,
            childs: node.childs
              ? updateAllChildren(node.childs, isChecked)
              : [],
          };
        }
        if (node.childs && node.childs.length > 0) {
          const updatedChilds = updateNode(node.childs, key, isChecked);
          const someChecked = updatedChilds.some((c) => c.selected);
          // const allChecked = updatedChilds.every((c) => c.selected);
          // const hasIndeterminate = updatedChilds.some((c) => c.indeterminate);
          return {
            ...node,
            childs: updatedChilds,
            selected: someChecked,
            // indeterminate: hasIndeterminate || (someChecked && !allChecked),
          };
        }
        return node;
      });
    },
    [updateAllChildren]
  );

  // Memoize selected keys calculation
  const getSelectedKeys = useCallback((nodes) => {
    const selected = [];
    const traverse = (items) => {
      items.forEach((item) => {
        if (item.selected) {
          selected.push(item.key);
        }
        if (item.childs) {
          traverse(item.childs);
        }
      });
    };
    traverse(nodes);
    return selected;
  }, []);

  const handleCheck = useCallback(
    (nodeKey, checked) => {
      const updatedData = updateNode(treeData, nodeKey, checked);
      setTreeData(updatedData);
      if (onChange) {
        onChange(updatedData, getSelectedKeys(updatedData));
      }
    },
    [treeData, updateNode, onChange, getSelectedKeys]
  );

  const handleSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchValue(value);

      if (value) {
        const keysToExpand = [];

        const hasMatchInSubtree = (node, searchText) => {
          if (fuzzyMatch(node.key, searchText)) {
            return true;
          }
          if (node.childs) {
            return node.childs.some((child) =>
              hasMatchInSubtree(child, searchText)
            );
          }
          return false;
        };

        const collectExpandKeys = (nodes) => {
          nodes.forEach((node) => {
            if (node.childs && node.childs.length > 0) {
              const hasMatch = node.childs.some((child) =>
                hasMatchInSubtree(child, value)
              );
              if (hasMatch) {
                keysToExpand.push(node.key);
              }
              collectExpandKeys(node.childs);
            }
          });
        };

        collectExpandKeys(treeData);
        setExpandedKeys(keysToExpand);
      } else {
        setExpandedKeys([]);
      }
    },
    [treeData]
  );

  const handleClearSearch = useCallback(() => {
    setSearchValue("");
    setExpandedKeys([]);
  }, []);

  return (
    <div
      className={`whitespace-pre-wrap bg-bg-treemenu text-white border border-secondary w-full first ${className}`}
    >
      {showSearch && !readOnly && (
        <TreeSelectSearchBox
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          placeholder={searchPlaceholder}
        />
      )}
      <div className="max-h-96 overflow-y-auto overflow-x-hidden">
        {treeData.length > 0 ? (
          treeData.map((node) => (
            <TreeCheckbox
              key={node.key}
              data={node}
              onCheck={handleCheck}
              readOnly={readOnly}
              expandedKeys={expandedKeys}
              onExpand={handleExpand}
              searchValue={searchValue}
            />
          ))
        ) : (
          <div className="text-center py-8 text-secondary text-sm">No data</div>
        )}
      </div>
    </div>
  );
}
