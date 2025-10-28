"use client";

import ListItem from "./ListItem";
import { TbFolderCode } from "react-icons/tb";
import PropTypes from "prop-types";
import { formatTimestamp } from "@/lib/formatDate";

export default function Repositories({
  sessions = [],
  onLoadMore,
  hasMore,
  isLoadingMore,
  onEditSession,
}) {
  const defaultIcon = () => (
    <TbFolderCode className="text-2xl text-secondary" />
  );

  const formattedSessions = sessions.map((session) => ({
    ...session,
    formattedTime: session.timestamp
      ? formatTimestamp(session.timestamp, "relative")
      : "",
    href: session.run_id ? `/mas-run?run_id=${session.run_id}` : "/new-test",
  }));

  return (
    <ListItem
      items={formattedSessions}
      defaultIcon={defaultIcon}
      emptyText="Create Session"
      emptyHref="/new-test"
      getItemLabel={(item) => {
        if (item?.session_name && item.session_name.length > 0) {
          return item.session_name;
        }

        const url = item.github_url || "";
        const repoName = url.split("/").pop() || item.run_id || "Session";
        return repoName;
      }}
      getItemKey={(item) => item.run_id}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onDotsClick={onEditSession}
    />
  );
}

Repositories.propTypes = {
  sessions: PropTypes.array,
  onLoadMore: PropTypes.func,
  hasMore: PropTypes.bool,
  isLoadingMore: PropTypes.bool,
  onEditSession: PropTypes.func,
};
