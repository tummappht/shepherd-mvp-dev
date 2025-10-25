"use client";

import PropTypes from "prop-types";
import { TbDots, TbSquarePlus } from "react-icons/tb";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function ListItem({
  items,
  defaultIcon,
  onItemClick,
  columns = 1,
  emptyText = "Create your first item",
  emptyHref,
  getItemLabel,
  getItemKey,
  onLoadMore,
  hasMore,
  isLoadingMore,
}) {
  const observerTarget = useRef(null);

  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoadingMore]);

  const getColumnClass = () => {
    if (columns === 2) {
      return "grid grid-cols-2 gap-x-3 gap-y-3";
    }
    return "grid grid-cols-1 gap-y-3";
  };

  const getListName = (item) => {
    if (getItemLabel) {
      return getItemLabel(item);
    }

    const gitHubUrl = item.github_url;
    const nameFromUrl = gitHubUrl ? gitHubUrl.split("/").slice(-1)[0] : null;

    if (nameFromUrl) {
      return nameFromUrl;
    }

    return item.name || "Unnamed Item";
  };

  const getItemKeyValue = (item, index) => {
    if (getItemKey) {
      return getItemKey(item);
    }
    return item.name || item.run_id || index;
  };

  const renderListItem = (items) => {
    if (items.length === 0) {
      const EmptyWrapper = emptyHref ? Link : "button";
      const emptyProps = emptyHref
        ? { href: emptyHref }
        : { type: "button", onClick: () => onItemClick?.() };

      return (
        <EmptyWrapper
          key={emptyText}
          className={`flex flex-1 items-center justify-between border border-dashed border-gray-border rounded-lg px-6 cursor-pointer transition-all h-14 text-secondary hover:bg-surface-hover`}
          {...emptyProps}
        >
          <div className="flex flex-row gap-2 items-center">
            <TbSquarePlus className="text-2xl" />
            <p className="text-sm">{emptyText}</p>
          </div>
        </EmptyWrapper>
      );
    }

    return items.map((item, index) => {
      const Wrapper = item.href ? Link : "button";
      const wrapperProps = item.href
        ? { href: item.href, prefetch: true }
        : { type: "button", onClick: () => onItemClick?.(item) };

      return (
        <Wrapper
          key={getItemKeyValue(item, index)}
          className={`flex flex-1 items-center justify-between border border-gray-border rounded-lg px-6 cursor-pointer transition-all min-h-14 py-3 hover:bg-surface-hover group`}
          {...wrapperProps}
        >
          <div className="flex flex-row gap-3 items-center">
            {item.icon ? item.icon : defaultIcon ? defaultIcon() : null}
            <div className="flex flex-col items-start gap-1">
              <p className="text-sm text-white">{getListName(item)}</p>
              {item.formattedTime && (
                <p className="text-xs text-secondary group-hover:text-gray-400 transition-colors">
                  {item.formattedTime}
                </p>
              )}
            </div>
          </div>
          <TbDots className="text-lg text-secondary" />
        </Wrapper>
      );
    });
  };

  return (
    <div className={`overflow-y-auto ${getColumnClass()}`}>
      {renderListItem(items)}
      {hasMore && (
        <div ref={observerTarget} className="py-4 flex justify-center">
          {isLoadingMore && (
            <AiOutlineLoading3Quarters className="animate-spin text-secondary text-xl" />
          )}
        </div>
      )}
    </div>
  );
}

ListItem.propTypes = {
  items: PropTypes.array.isRequired,
  defaultIcon: PropTypes.func,
  onItemClick: PropTypes.func,
  columns: PropTypes.oneOf([1, 2]),
  emptyText: PropTypes.string,
  emptyHref: PropTypes.string,
  getItemLabel: PropTypes.func,
  getItemKey: PropTypes.func,
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
};
