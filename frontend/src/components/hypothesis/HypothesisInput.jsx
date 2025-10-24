"use client";

import { useMemo } from "react";
import { TbArrowUp } from "react-icons/tb";
import { useForm, Controller } from "react-hook-form";
import TreeCheckboxList from "../treeSelect/TreeSelect";
import { USER_INPUT_TYPES } from "@/hook/useWebSocketMessages";

export default function HypothesisInput({
  waitingForInput = false,
  options = [],
  handleSend = () => {},
}) {
  const isOptions = useMemo(() => options && options.length > 0, [options]);
  const isDisabledInput = useMemo(
    () => isOptions || !waitingForInput,
    [isOptions, waitingForInput]
  );

  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      hypothesisInput: "",
      selectedOptions: [],
    },
  });

  const onSubmit = async (data) => {
    let value = "";
    if (isOptions) {
      value = data.selectedOptions;
    } else {
      value = data.hypothesisInput;
    }

    const inputType = isOptions
      ? USER_INPUT_TYPES.OPTION
      : USER_INPUT_TYPES.INPUT;

    handleSend(JSON.stringify(value), inputType);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-2 px-7">
        {isOptions && (
          <Controller
            name="selectedOptions"
            control={control}
            render={({ field }) => (
              <TreeCheckboxList
                options={options}
                value={field.value}
                onChange={field.onChange}
                showSearch
              />
            )}
          />
        )}
      </div>
      <div className="pb-5 px-7 relative">
        <input
          name="hypothesisInput"
          type="text"
          placeholder={isOptions ? "Select Checkbox Option" : "Ask anything"}
          className="w-full bg-background border border-stroke rounded-md py-4 pl-6 pr-14 text-md text-white placeholder:text-secondary placeholder:italic"
          disabled={isDisabledInput}
          {...register("hypothesisInput", {
            required: isDisabledInput ? false : "Input is required",
          })}
        />
        {errors.hypothesisInput && (
          <p className="text-red-500 text-sm mt-1">
            {errors.hypothesisInput.message}
          </p>
        )}
        <button
          type="submit"
          className={`px-3 py-2 rounded-md text-white text-md h-10 absolute top-2 right-9 ${
            waitingForInput ? "bg-primary" : "bg-gray-500 cursor-not-allowed"
          }`}
          disabled={!waitingForInput}
        >
          <TbArrowUp />
        </button>
      </div>
    </form>
  );
}
