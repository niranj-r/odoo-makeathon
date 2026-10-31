/**
 * Universal Data Exporter for BrightLoop SaaS tables & reports.
 * Formats columns, escapes special characters, attaches UTF-8 BOM for Excel/CSV compatibility,
 * and triggers a client-side file download.
 */

/**
 * Client-side CSV export
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
    return false;
  }
}

/**
 * Client-side Excel export (HTML XML Spreadsheet formatted with MIME type application/vnd.ms-excel)
 */
export function exportToExcel(filename, columns, data) {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const tableHeader = columns
      .map(
        (col) =>
          `<th style="background-color: #1E40AF; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 8px 12px; text-align: left;">${col.header}</th>`
      )
      .join('');

    const tableRows = data
      .map((row) => {
        const cells = columns
          .map((col) => {
            let value;
            if (typeof col.accessor === 'function') {
              value = col.accessor(row);
            } else {
              value = row[col.accessor || col.key];
            }
            const displayVal =
              value !== null && value !== undefined ? String(value) : '';
            return `<td style="border: 1px solid #E2E8F0; padding: 6px 12px; color: #1E293B;">${displayVal}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>BrightLoop Report</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
        </head>
        <body>
          <table border="1" style="border-collapse: collapse; font-family: Calibri, sans-serif; font-size: 11pt;">
            <thead><tr>${tableHeader}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelTemplate], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().split('T')[0];
    const safeFilename = filename.endsWith('.xls')
      ? filename
      : `${filename}_${timestamp}.xls`;

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
    return false;
  }
}
