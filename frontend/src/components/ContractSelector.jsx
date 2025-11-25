import {
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useRef,
  useImperativeHandle,
} from "react";
import { FaSearch, FaSyncAlt, FaTimes } from "react-icons/fa";

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

const ContractSelector = forwardRef(function ContractSelector(
  { contracts = [], onChange, value = [], isLoading = false },
  ref
) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedContracts, setSelectedContracts] = useState(value);
  const containerRef = useRef(null);

  // Expose focus method to parent for React Hook Form
  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        containerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        containerRef.current?.focus();
      },
    }),
    []
  );

  useEffect(() => {
    if (value && value.length > 0) {
      // Extract contract names from value (which may be objects or strings)
      const contractNames = value.map((v) =>
        typeof v === "string" ? v : v.contract_name
      );
      setSelectedContracts(contractNames);
    }
  }, [value]);

  const groupedContracts = useMemo(() => {
    const deployed = contracts.filter((c) => c.is_deployed);
    const notDeployed = contracts.filter((c) => !c.is_deployed);
    return { deployed, notDeployed };
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    if (!searchValue) return groupedContracts;

    const deployed = groupedContracts.deployed.filter((c) =>
      fuzzyMatch(c.contract_name, searchValue)
    );
    const notDeployed = groupedContracts.notDeployed.filter((c) =>
      fuzzyMatch(c.contract_name, searchValue)
    );

    return { deployed, notDeployed };
  }, [groupedContracts, searchValue]);

  const handleToggle = (contractName) => {
    // Check if contract is deployed
    const contract = contracts.find((c) => c.contract_name === contractName);
    if (contract?.is_deployed) {
      // Don't allow deselecting deployed contracts
      return;
    }

    const newSelected = selectedContracts.includes(contractName)
      ? selectedContracts.filter((name) => name !== contractName)
      : [...selectedContracts, contractName];

    setSelectedContracts(newSelected);
    if (onChange) {
      // Return full contract objects with is_deployed and is_in_scope
      const selectedContractObjects = contracts
        .filter((c) => newSelected.includes(c.contract_name))
        .map((c) => ({
          contract_name: c.contract_name,
          is_deployed: c.is_deployed,
          is_in_scope: true, // All selected contracts are in scope
        }));
      onChange(selectedContractObjects);
    }
  };

  const handleToggleGroup = (group) => {
    const groupContracts = group.map((c) => c.contract_name);
    const deployedContracts = group
      .filter((c) => c.is_deployed)
      .map((c) => c.contract_name);

    // Only consider non-deployed contracts for toggling
    const selectableContracts = groupContracts.filter(
      (name) => !deployedContracts.includes(name)
    );

    const allSelectableSelected = selectableContracts.every((name) =>
      selectedContracts.includes(name)
    );

    let newSelected;
    if (allSelectableSelected) {
      // Deselect all non-deployed in group (keep deployed ones)
      newSelected = selectedContracts.filter(
        (name) => !selectableContracts.includes(name)
      );
    } else {
      // Select all in group
      const toAdd = selectableContracts.filter(
        (name) => !selectedContracts.includes(name)
      );
      newSelected = [...selectedContracts, ...toAdd];
    }

    setSelectedContracts(newSelected);
    if (onChange) {
      // Return full contract objects with is_deployed and is_in_scope
      const selectedContractObjects = contracts
        .filter((c) => newSelected.includes(c.contract_name))
        .map((c) => ({
          contract_name: c.contract_name,
          is_deployed: c.is_deployed,
          is_in_scope: true, // All selected contracts are in scope
        }));
      onChange(selectedContractObjects);
    }
  };

  const highlightMatch = (text, search) => {
    if (!search) return text;

    const patternLower = search.toLowerCase();
    const strLower = text.toLowerCase();
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

    if (matches.length === 0) return text;

    const parts = [];
    let lastIdx = 0;

    matches.forEach((matchIdx) => {
      if (matchIdx > lastIdx) {
        parts.push(text.substring(lastIdx, matchIdx));
      }
      parts.push(
        <span key={matchIdx} className="bg-primary/50">
          {text[matchIdx]}
        </span>
      );
      lastIdx = matchIdx + 1;
    });

    if (lastIdx < text.length) {
      parts.push(text.substring(lastIdx));
    }

    return <>{parts}</>;
  };

  const renderGroup = (title, contracts, isDeployed) => {
    if (contracts.length === 0) return null;

    const groupContracts = contracts.map((c) => c.contract_name);
    const allSelected = groupContracts.every((name) =>
      selectedContracts.includes(name)
    );
    const someSelected = groupContracts.some((name) =>
      selectedContracts.includes(name)
    );

    return (
      <div className="border-b border-gray-border last:border-b-0">
        <div
          className={`flex items-center gap-2 py-2 px-3 bg-surface-hover transition-colors ${
            !isDeployed
              ? "cursor-pointer hover:bg-surface"
              : "cursor-not-allowed"
          }`}
          onClick={() => !isDeployed && handleToggleGroup(contracts)}
        >
          <div className="relative flex items-center justify-center flex-shrink-0">
            <div className="w-4 h-4 bg-bg-checkbox rounded-sm border border-gray-border flex items-center justify-center">
              {allSelected ? (
                <div
                  className={`w-2 h-2 ${
                    isDeployed ? "bg-text-success" : "bg-primary"
                  } rounded-xs`}
                />
              ) : someSelected ? (
                <div
                  className={`w-2 h-0.5 ${
                    isDeployed ? "bg-text-success" : "bg-primary"
                  } rounded-xs`}
                />
              ) : null}
            </div>
          </div>
          <span className="text-white text-sm font-semibold select-none">
            {title} ({contracts.length})
          </span>
        </div>

        <div className={!isDeployed ? "divide-y divide-gray-border/50" : ""}>
          {contracts.map((contract, index) => {
            const isSelected = selectedContracts.includes(
              contract.contract_name
            );
            const isDisabled = contract.is_deployed;

            return (
              <div
                key={contract.contract_name + "-" + index}
                className={`flex items-center gap-2 py-2 px-3 pl-8 transition-colors ${
                  isDisabled
                    ? "cursor-not-allowed bg-surface-hover"
                    : "hover:bg-surface-hover cursor-pointer"
                }`}
                onClick={() =>
                  !isDisabled && handleToggle(contract.contract_name)
                }
                title={
                  isDisabled
                    ? "Deployed contracts are required and cannot be deselected"
                    : ""
                }
              >
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 bg-bg-checkbox rounded-sm border flex items-center justify-center border-gray-border">
                    {isSelected && (
                      <div
                        className={`w-2 h-2 rounded-xs ${
                          isDisabled ? "bg-text-success" : "bg-primary"
                        }`}
                      />
                    )}
                  </div>
                </div>
                <div className="flex-1 flex items-center gap-4">
                  <span className="text-white text-sm font-mono select-none">
                    {highlightMatch(contract.contract_name, searchValue)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="bg-surface border border-gray-border rounded-md p-8 text-center">
        <div className="w-full flex justify-center items-center gap-2 text-md text-secondary">
          <FaSyncAlt className="animate-spin" />
          <span>Loading contract</span>
        </div>
      </div>
    );
  }

  if (contracts.length === 0) {
    return (
      <div className="bg-surface border border-gray-border rounded-md p-8 text-center">
        <p className="text-secondary text-md">
          No contracts available. Please upload a contract asset first.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="bg-surface border border-gray-border rounded-md overflow-hidden"
    >
      {/* Search Box */}
      <div className="p-3 border-b border-gray-border bg-surface-hover">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-md" />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full py-2 pl-9 pr-9 bg-bg-checkbox border border-gray-border rounded-md text-white text-md placeholder-gray-500 transition-colors"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-white transition-colors"
            >
              <FaTimes className="text-md" />
            </button>
          )}
        </div>
      </div>

      {/* Contract List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredContracts.deployed.length === 0 &&
        filteredContracts.notDeployed.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-secondary text-md">No contracts found</p>
          </div>
        ) : (
          <>
            {renderGroup(
              "Deployed Contracts",
              filteredContracts.deployed,
              true
            )}
            {renderGroup(
              "Other Contracts",
              filteredContracts.notDeployed,
              false
            )}
          </>
        )}
      </div>

      {/* Selected Count */}
      {selectedContracts.length > 0 && (
        <div className="p-2 border-t border-gray-border bg-surface-hover">
          <p className="text-xs text-secondary text-center">
            {selectedContracts.length} contract
            {selectedContracts.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      )}
    </div>
  );
});

export default ContractSelector;
