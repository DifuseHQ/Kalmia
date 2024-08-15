import React from 'react';
import { getColorClass } from '../utils/style';
import { useDark } from 'rspress/runtime';

interface TableCell {
  type: 'text' | 'link';
  text?: string;
  href?: string;
  styles?: {
    bold?: boolean;
    textColor?: string;
    strike?: boolean;
    backgroundColor?: string;
    underline?: boolean;
  };
}

interface TableRow {
  cells: TableCell[][];
}

interface TableContent {
  type: 'tableContent';
  rows: TableRow[];
}

interface TableData {
  id: string;
  type: 'table';
  props: {
    textColor?: string;
    backgroundColor?: string;
  };
  content: TableContent;
  children: any[];
}

interface TableProps {
  rawJson: TableData;
}

const renderTableCell = (cell: TableCell, cellIndex: number): React.ReactNode => {
  const cellClasses = [
    cell.styles?.bold ? 'kal-font-bold' : '',
    getColorClass(cell.styles?.textColor),
    getColorClass(cell.styles?.backgroundColor, true),
    cell.styles?.strike ? 'kal-line-through' : '',
    cell.styles?.underline ? 'kal-underline' : ''
  ].filter(Boolean).join(' ');

  if (cell.type === 'link') {
    return (
      <a key={cellIndex} href={cell.href} className={`${cellClasses} kal-text-blue-500`}>
        {cell.text}
      </a>
    );
  }

  return (
    <span key={cellIndex} className={cellClasses}>
      {cell.text}
    </span>
  );
};

export const Table: React.FC<TableProps> = ({ rawJson }) => {
    const { props, content } = rawJson;
  
    const containerClasses = [
      'kal-flex',
      'kal-justify-center',
      'kal-w-full',
      'kal-overflow-x-auto',
      'kal-py-4',
    ].join(' ');
  
    const tableClasses = [
      'kal-border-collapse',
      'kal-border',
      'kal-border-gray-300',
      getColorClass(props.textColor),
      getColorClass(props.backgroundColor, true),
      'kal-mx-auto',
      'kal-w-auto',
      'kal-max-w-full',
    ].filter(Boolean).join(' ');
  
    return (
      <div className={containerClasses}>
        <table className={tableClasses}>
          <tbody>
            {content.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.cells.map((cellGroup, cellGroupIndex) => (
                  <td key={cellGroupIndex} className="kal-border kal-border-gray-300 kal-p-2">
                    {cellGroup.map((cell, cellIndex) =>
                      renderTableCell(cell, cellIndex)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
};

export default Table;