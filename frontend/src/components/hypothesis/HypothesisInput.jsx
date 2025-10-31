"use client";

import { useMemo } from "react";
import { TbArrowUp } from "react-icons/tb";
import { useForm, Controller } from "react-hook-form";
import TreeCheckboxList from "../treeSelect/TreeSelect";
import { CONTENT_TYPES } from "@/hook/useWebSocketMessages";
import RunAnotherMasRadio from "@/app/mas-run/_components/RunAnotherMasRadio";

export default function HypothesisInput({
  waitingForInput = false,
  extraInput,
  handleSend = () => {},
}) {
  const type = useMemo(() => extraInput && extraInput.type, [extraInput]);
  const options = useMemo(
    () => (extraInput && extraInput.options) || [],
    [extraInput]
  );

  const isDisabledInput = useMemo(
    () => extraInput || !waitingForInput,
    [extraInput, waitingForInput]
  );

  const inputPlaceHolder = useMemo(() => {
    switch (type) {
      case CONTENT_TYPES.OPTION:
        return "Select Checkbox Option";
      case CONTENT_TYPES.RADIO:
        return "Select Option";
      default:
        return "Ask anything";
    }
  }, [type]);

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
    switch (type) {
      case CONTENT_TYPES.OPTION:
        value = JSON.stringify(data.selectedOptions);
        break;
      case CONTENT_TYPES.RADIO:
        value = data.runAnotherMasRadio;
        break;
      default:
        value = data.hypothesisInput;
    }

    handleSend(value, type);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="-mt-3 mb-2 px-7">
        {type == CONTENT_TYPES.OPTION && (
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
        {type == CONTENT_TYPES.RADIO && (
          <Controller
            name="runAnotherMasRadio"
            control={control}
            render={({ field }) => (
              <RunAnotherMasRadio
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}
      </div>
      <div className="pb-5 px-7 relative">
        <input
          name="hypothesisInput"
          type="text"
          placeholder={inputPlaceHolder}
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
