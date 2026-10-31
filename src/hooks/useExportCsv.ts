"use client";

import { useState } from "react";
import { exportToCsv } from "@/utils/exportCsv";
import { CsvColumn } from "@/types/common";

export function useExportCsv<T>() {
  const [isExporting, setIsExporting] = useState(false);

  const triggerExport = (
    filename: string,
    columns: CsvColumn<T>[],
    data: T[],
    onSuccess?: () => void,
    onError?: (err: Error) => void
  ) => {
    setIsExporting(true);
    try {
      const ok = exportToCsv(filename, columns, data);
      if (ok) {
        onSuccess?.();
      } else {
        throw new Error("CSV generation returned false.");
      }
    } catch (err) {
      console.error(err);
      onError?.(err instanceof Error ? err : new Error("Failed to export CSV"));
    } finally {
      setIsExporting(false);
    }
  };

  return {
    triggerExport,
    isExporting,
  };
}

