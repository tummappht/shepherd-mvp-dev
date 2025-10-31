import { useState } from "react";

const RunAnotherMasRadio = ({ value, isReadOnly, onChange }) => {
  const randKey = Date.now() + Math.random().toString(36).substring(2, 15);
  const [selectedOption, setSelectedOption] = useState(value);

  const handleOptionChange = (e) => {
    if (!isReadOnly) {
      setSelectedOption(e.target.value);
      if (onChange) {
        onChange(e.target.value);
      }
    }
  };

  return (
    <div
      className={`flex gap-2 pl-7 ${isReadOnly ? "pointer-events-none" : ""}`}
    >
      <div>
        <input
          type="radio"
          id={`radio-yes-${randKey}`}
          value="yes"
          checked={selectedOption === "yes"}
          onChange={handleOptionChange}
          className="sr-only"
          disabled={isReadOnly}
        />
        <label
          htmlFor={`radio-yes-${randKey}`}
          className={`block text-center text-md w-16 py-1 px-2 rounded-md cursor-pointer transition-all duration-200 ease-in-out border ${
            selectedOption === "yes"
              ? "bg-bg-success text-text-success border-stroke-success shadow-lg"
              : "bg-background text-secondary border-stroke-light hover:bg-bg-success"
          }`}
        >
          Yes
        </label>
      </div>

      <div>
        <input
          type="radio"
          id={`radio-no-${randKey}`}
          value="no"
          checked={selectedOption === "no"}
          onChange={handleOptionChange}
          className="sr-only"
          disabled={isReadOnly}
        />
        <label
          htmlFor={`radio-no-${randKey}`}
          className={`block text-center text-md w-16 py-1 px-2 rounded-md cursor-pointer transition-all duration-200 ease-in-out border ${
            selectedOption === "no"
              ? "bg-bg-failed text-text-failed border-stroke-failed shadow-lg"
              : "bg-background text-secondary border-stroke-light hover:bg-bg-failed"
          }`}
        >
          No
        </label>
      </div>
    </div>
  );
};

export default RunAnotherMasRadio;
