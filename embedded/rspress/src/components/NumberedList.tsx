import React from 'react';
import { getColorClass } from '../utils/style';

interface TextSegment {
  type: 'text' | 'link';
  text?: string;
  href?: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    textColor?: string;
    backgroundColor?: string;
  };
}

interface NumberedListItemData {
  id: string;
  type: 'numberedListItem';
  props: {
    textColor?: string;
    backgroundColor?: string;
    textAlignment?: 'left' | 'center' | 'right';
  };
  content: TextSegment[];
  children: NumberedListItemData[];
}

interface NumberedListItemProps {
  item: NumberedListItemData;
  depth?: number;
}

const NumberedListItem: React.FC<NumberedListItemProps> = ({ item, depth = 0 }) => {
  const { props, content, children } = item;

  const containerClasses = [
    getColorClass(props.textColor),
    getColorClass(props.backgroundColor, true),
    props.textAlignment === 'left' ? 'kal-text-left' :
    props.textAlignment === 'center' ? 'kal-text-center' :
    props.textAlignment === 'right' ? 'kal-text-right' : '',
    'kal-ml-6'
  ].filter(Boolean).join(' ');

  const renderTextSegment = (segment: TextSegment, index: number): React.ReactNode => {
    const segmentClasses = [
      segment.styles?.bold ? 'kal-font-bold' : '',
      segment.styles?.italic ? 'kal-italic' : '',
      segment.styles?.underline ? 'kal-underline' : '',
      segment.styles?.strike ? 'kal-line-through' : '',
      getColorClass(segment.styles?.textColor),
      getColorClass(segment.styles?.backgroundColor, true)
    ].filter(Boolean).join(' ');

    if (segment.type === 'link') {
      return (
        <a key={index} href={segment.href} className={`${segmentClasses} kal-text-blue-500`}>
          {segment.text}
        </a>
      );
    }

    return (
      <span key={index} className={segmentClasses}>
        {segment.text}
      </span>
    );
  };

  return (
    <li className={containerClasses}>
      <div className="kal-flex">
        <span className="kal--ml-6 kal-mr-2 kal-flex-shrink-0 kal-w-4 kal-text-right">
          {depth + 1}.
        </span>
        <span>
          {content.map((segment, index) => renderTextSegment(segment, index))}
        </span>
      </div>
      {children.length > 0 && (
        <ol className="kal-list-decimal kal-ml-4 kal-mt-2">
          {children.map((child) => (
            <NumberedListItem key={child.id} item={child} depth={depth + 1} />
          ))}
        </ol>
      )}
    </li>
  );
};

export const NumberedList: React.FC<{ rawJson: NumberedListItemData }> = ({ rawJson }) => {
  return (
    <ol className="kal-list-decimal">
      <NumberedListItem key={rawJson.id} item={rawJson} />
    </ol>
  );
};

export default NumberedList;