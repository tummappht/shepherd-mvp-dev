"use client";

import { useMemo } from "react";
import { TbArrowUp } from "react-icons/tb";
import { useForm, Controller } from "react-hook-form";
import TreeCheckboxList from "../treeSelect/TreeSelect";
import { CONTENT_TYPES, MESSAGE_PATTERNS } from "@/constants/session";
import ChoiceRadio from "./ChoiceRadio";
import RunAnotherMasRadio from "./RunAnotherMasRadio";

export default function HypothesisInput({
  waitingForInput = false,
  extraInput,
  handleSend = () => {},
}) {
  const label = useMemo(() => {
    return extraInput && extraInput.label;
  }, [extraInput]);
  const type = useMemo(() => {
    return extraInput && extraInput.type;
  }, [extraInput]);
  const options = useMemo(
    () => (extraInput && extraInput.options) || [],
    [extraInput]
  );

  const isDisabledInput = useMemo(
    () => type !== CONTENT_TYPES.INPUT || !waitingForInput,
    [type, waitingForInput]
  );

  const inputPlaceHolder = useMemo(() => {
    switch (type) {
      case CONTENT_TYPES.OPTION:
        return "Select Checkbox Option";
      case CONTENT_TYPES.RADIO:
        return "Select Option";
      case CONTENT_TYPES.CHOICE:
        return "Select Choice";
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
        const isChuckOptionsCase = label.includes(
          MESSAGE_PATTERNS.CONTRACT_SELECTION_PROMPT
        );
        if (isChuckOptionsCase) {
          value = JSON.stringify(parseChuckOptions(data.selectedOptions));
          break;
        }
        value = JSON.stringify(data.selectedOptions);
        break;
      case CONTENT_TYPES.RADIO:
        value = data.runAnotherMasRadio;
        break;
      case CONTENT_TYPES.CHOICE:
        value = data.selectedChoice;
        break;
      default:
        value = data.hypothesisInput;
    }
    console.log("🚀 ~ HypothesisInput ~ value:", value);

    handleSend(value, extraInput);
    reset();
  };

  const parseChuckOptions = (options) => {
    const deployed = [];
    const undeployed = [];
    options.forEach((opt) => {
      const val = {
        contract_name: opt.contract_name,
        chunks: opt.childs,
      };

      if (opt.isDeployed) {
        deployed.push(val);
      } else {
        undeployed.push(val);
      }
    });

    return { deployed, undeployed };
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="-mt-3 mb-2 px-7">
        <div className={`my-3 gap-2 pl-7 relative messages-container`}>
          <span
            className={`border border-primary w-2 h-2 absolute top-2 left-2 rounded-full`}
          />
          <pre className={`whitespace-pre-wrap text-white`}>{label}</pre>
        </div>
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
        {type == CONTENT_TYPES.CHOICE && (
          <Controller
            name="selectedChoice"
            control={control}
            render={({ field }) => (
              <ChoiceRadio
                options={options}
                value={field.value}
                onChange={field.onChange}
                isReadOnly={false}
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
          <p className="text-text-failed text-sm mt-1">
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
