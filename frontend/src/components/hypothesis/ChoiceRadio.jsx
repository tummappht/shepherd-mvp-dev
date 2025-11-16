import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const ChoiceRadio = ({ options, value, isReadOnly, onChange }) => {
  const randKey = Date.now() + Math.random().toString(36).substring(2, 15);
  const [selectedOption, setSelectedOption] = useState(value || "");

  useEffect(() => {
    if (value !== undefined) {
      setSelectedOption(value);
    }
  }, [value]);

  const handleOptionChange = (choiceValue) => {
    if (!isReadOnly) {
      setSelectedOption(choiceValue);
      if (onChange) {
        onChange(choiceValue);
      }
    }
  };

  return (
    <div
      className={`flex flex-col gap-2 pl-7 ${
        isReadOnly ? "pointer-events-none" : ""
      }`}
    >
      {options.map((choice, index) => (
        <div key={`${randKey}-${index}`}>
          <input
            type="radio"
            id={`choice-${randKey}-${index}`}
            value={choice.value}
            checked={selectedOption === choice.value}
            onChange={() => handleOptionChange(choice.value)}
            className="sr-only"
            disabled={isReadOnly}
          />
          <label
            htmlFor={`choice-${randKey}-${index}`}
            className={`block text-left text-sm py-2 px-4 rounded-md cursor-pointer transition-all duration-200 ease-in-out border ${
              selectedOption === choice.value
                ? "bg-background-light text-white border-primary shadow-lg"
                : "bg-background text-secondary border-stroke-light hover:bg-background-light hover:border-primary"
            }`}
          >
            {choice.label}
          </label>
        </div>
      ))}
    </div>
  );
};

ChoiceRadio.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string,
  isReadOnly: PropTypes.bool,
  onChange: PropTypes.func,
};

ChoiceRadio.defaultProps = {
  value: "",
  isReadOnly: false,
  onChange: null,
};

export default ChoiceRadio;
