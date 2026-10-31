import React from 'react';

export const DataTable = ({
  columns = [],
  data = [],
  emptyMessage = 'No records found.',
  className = '',
}) => {
  return (
    <div className={`data-table-container ${className}`} style={{
      overflowX: 'auto',
      borderRadius: '8px',
      border: '1px solid var(--border-light, #E2E8F0)',
      background: '#FFFFFF',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#F8FAFC', borderBottom: '1px solid var(--border-light, #E2E8F0)' }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted, #64748B)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  textAlign: col.align || 'left',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted, #64748B)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                style={{
                  borderBottom: '1px solid var(--border-light, #E2E8F0)',
                  transition: 'background-color 0.15s ease',
                }}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    style={{
                      padding: '0.85rem 1rem',
                      color: 'var(--text-dark, #1E293B)',
                      textAlign: col.align || 'left',
                    }}
                  >
                    {typeof col.cell === 'function'
                      ? col.cell(row)
                      : typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;

