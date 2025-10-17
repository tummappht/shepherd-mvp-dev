"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";

export default function Dropdown({
  isOpen,
  onClose,
  items = [],
  onItemClick,
  position = "top-left",
  className = "",
}) {
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const positionClasses = {
    "top-left": "bottom-full left-0 mb-2",
    "top-right": "bottom-full right-0 mb-2",
    "top-center": "bottom-full left-1/2 -translate-x-1/2 mb-2",
    "bottom-left": "top-full left-0 mt-2",
    "bottom-right": "top-full right-0 mt-2",
    "bottom-center": "top-full left-1/2 -translate-x-1/2 mt-2",
    "left-center": "top-1/2 -translate-y-1/2 right-full mr-2",
    "right-center": "top-1/2 -translate-y-1/2 left-full ml-2",
  };

  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item.action, item.href);
    }
    if (item.href && !item.action) {
      onClose();
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`absolute ${positionClasses[position]} bg-surface border border-stroke rounded-lg shadow-lg py-1 z-50 min-w-[180px] ${className}`}
    >
      {items.map((item) => {
        const itemClasses = `w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
          item.danger
            ? "text-red-400 hover:bg-red-900/20"
            : "text-secondary hover:bg-surface-hover"
        }`;

        const Icon = item.icon;

        // If item has an action (like logout), render as button
        if (item.action) {
          return (
            <button
              key={item.label}
              onClick={() => handleItemClick(item)}
              className={itemClasses}
            >
              {Icon && <Icon className="text-lg" />}
              <span>{item.label}</span>
            </button>
          );
        }

        // If item has href, render as link
        if (item.href) {
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => handleItemClick(item)}
              className={itemClasses}
            >
              {Icon && <Icon className="text-lg" />}
              <span>{item.label}</span>
            </Link>
          );
        }

        // Fallback to button for custom items
        return (
          <button
            key={item.label}
            onClick={() => handleItemClick(item)}
            className={itemClasses}
          >
            {Icon && <Icon className="text-lg" />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
