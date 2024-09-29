import React from 'react';
import { getColorClass } from '../utils/style';
import { useDark } from 'rspress/runtime';

interface CellStyles {
  bold?: boolean;
  textColor?: string;
  strike?: boolean;
  backgroundColor?: string;
  underline?: boolean;
}

interface TableCell {
  type: 'text' | 'link';
  text?: string;
  href?: string;
  styles?: CellStyles;
  content?: CellContent[];
}

interface CellContent {
  styles?: CellStyles;
  text: string;
  type: 'text';
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
  const getStyles = (styles: CellStyles = {}) => [
    styles.bold ? 'kal-font-bold' : '',
    getColorClass(styles.textColor),
    getColorClass(styles.backgroundColor, true),
    styles.strike ? 'kal-line-through' : '',
    styles.underline ? 'kal-underline' : ''
  ].filter(Boolean);

  if (cell.type === 'link' && cell.content && cell.content.length > 0) {
    const linkContent = cell.content[0];
    const cellClasses = [
      ...getStyles(linkContent.styles),
      'kal-underline',
      'kal-text-blue-500'
    ];

    return (
      <a key={cellIndex} href={cell.href || ''} className={cellClasses.join(' ')} target="_blank">
        {linkContent.text?.trim() || ''}
      </a>
    );
  }

  return (
    <span key={cellIndex} className={getStyles(cell.styles).join(' ')}>
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