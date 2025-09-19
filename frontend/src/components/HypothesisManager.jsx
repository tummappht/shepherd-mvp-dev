"use client";
import { useState } from "react";
import Hypothesis from "./Hypothesis";
import { FaPlus } from "react-icons/fa";

export default function HypothesisManager() {
  const [hypotheses, setHypotheses] = useState([{ id: 1, minimized: false }]);

  const addHypothesis = () => {
    const nextId = hypotheses.length + 1;
    setHypotheses([...hypotheses, { id: nextId, minimized: false }]);
  };

  const toggleMinimize = (id) => {
    setHypotheses(
      hypotheses.map((h) =>
        h.id === id ? { ...h, minimized: !h.minimized } : h
      )
    );
  };

  const allMinimized = hypotheses.every((h) => h.minimized);

  return (
    <div className="flex flex-col h-full max-h-full gap-4 overflow-hidden">
      {hypotheses.map((h) => (
        <Hypothesis
          key={h.id}
          id={h.id}
          title={`Hypothesis #${h.id}`}
          minimized={h.minimized}
          onMinimize={toggleMinimize}
        />
      ))}

      {allMinimized && (
        <button
          type="button"
          onClick={addHypothesis}
          className="self-end bg-primary text-white rounded-full p-3 hover:scale-105 absolute bottom-4 right-4 transition-transform"
        >
          <FaPlus />
        </button>
      )}
    </div>
  );
}
