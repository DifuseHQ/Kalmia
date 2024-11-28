import React from 'react';
import { getColorClass } from '../utils/style';

interface TextSegment {
  type: 'text' | 'link';
  text?: string;
  href?: string;
  content?: TextSegment[];
  styles?: {
    bold?: boolean;
    textColor?: string;
    strike?: boolean;
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
  children: any[];
}

interface NumberedListItemProps {
  rawJson: NumberedListItemData;
}

export const NumberedListItem: React.FC<NumberedListItemProps> = ({ rawJson }) => {
  const { props, content, children } = rawJson;

  const containerClasses = [
    getColorClass(props.textColor),
    getColorClass(props.backgroundColor, true),
    props.textAlignment === 'left' ? 'kal-text-left' :
    props.textAlignment === 'center' ? 'kal-text-center' :
    props.textAlignment === 'right' ? 'kal-text-right' : '',
    'kal-mb-2',
  ].filter(Boolean).join(' ');

  const renderTextSegment = (segment: TextSegment, index: number): React.ReactNode => {
    const segmentClasses = [
      segment.styles?.bold ? 'kal-font-bold' : '',
      getColorClass(segment.styles?.textColor),
      getColorClass(segment.styles?.backgroundColor, true),
      segment.styles?.strike ? 'kal-line-through' : ''
    ].filter(Boolean).join(' ');

    if (segment.type === 'link') {
      return (
        <a key={index} href={segment.href} className={`${segmentClasses} kal-underline kal-text-blue-500`}>
          {segment.content?.map((subSegment, subIndex) =>
            renderTextSegment(subSegment, subIndex)
          ) || segment.text}
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
      {content.map((segment, index) => renderTextSegment(segment, index))}
      {children}
    </li>
  );
};

export default NumberedListItem;
