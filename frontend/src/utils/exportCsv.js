/**
 * Universal CSV Exporter for BrightLoop SaaS tables & reports.
 * Formats columns, escapes special characters, attaches UTF-8 BOM for Excel compatibility,
 * and triggers a client-side file download.
 */
export function exportToCsv(filename, columns, data) {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const escapeCsvValue = (val) => {
      if (val === null || val === undefined) return '""';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    // Header row
    const headers = columns.map((col) => escapeCsvValue(col.header)).join(',');

    // Data rows
    const rows = data.map((row) => {
      return columns
        .map((col) => {
          let value;
          if (typeof col.accessor === 'function') {
            value = col.accessor(row);
          } else {
            value = row[col.accessor || col.key];
          }
          return escapeCsvValue(value);
        })
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0];
    const safeFilename = filename.endsWith('.csv') ? filename : `${filename}_${timestamp}.csv`;

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', safeFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Failed to export CSV:', error);
    return false;
  }
}

