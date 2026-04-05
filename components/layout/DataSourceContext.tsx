"use client";

import React, { createContext, useContext, useState } from "react";
import type { DataSource } from "@/lib/api";

const DataSourceContext = createContext<{
  source: DataSource;
  setSource: (s: DataSource) => void;
}>({ source: "mock", setSource: () => {} });

export function DataSourceProvider({ children }: { children: React.ReactNode }) {
  const [source, setSource] = useState<DataSource>("mock");
  return (
    <DataSourceContext.Provider value={{ source, setSource }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  return useContext(DataSourceContext);
}
