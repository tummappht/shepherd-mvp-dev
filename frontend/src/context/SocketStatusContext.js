"use client";

import { createContext, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";

const SocketStatusContext = createContext(null);
export function SocketStatusProvider({ children }) {
  const [socketStatus, setSocketStatus] = useState(null);

  const value = useMemo(
    () => ({ socketStatus, setSocketStatus }),
    [socketStatus, setSocketStatus]
  );

  return (
    <SocketStatusContext.Provider value={value}>
      {children}
    </SocketStatusContext.Provider>
  );
}

SocketStatusProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useSocketStatus() {
  const context = useContext(SocketStatusContext);
  console.log("🚀 ~ useSocketStatus ~ context:", context);
  if (!context) {
    throw new Error(
      "useSocketStatus must be used within a SocketStatusProvider"
    );
  }
  return context;
}
