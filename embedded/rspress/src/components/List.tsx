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

interface ListItemData {
  id: string;
  type: 'numberedListItem' | 'bulletListItem';
  props: {
    textColor?: string;
    backgroundColor?: string;
    textAlignment?: 'left' | 'center' | 'right';
  };
  content: TextSegment[];
  children: ListItemData[];
}

interface ListItemProps {
  item: ListItemData;
  depth?: number;
}

const ListItem: React.FC<ListItemProps> = ({ item, depth = 0 }) => {
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
  
    // return (
    //   <li className={containerClasses}>
    //     <div className="kal-flex">
    //       {item.type === 'numberedListItem' && (
    //         <span className="kal-mr-2 kal-flex-shrink-0">
    //           {`${depth + 1}.`}
    //         </span>
    //       )}
    //       <span>
    //         {content.map((segment, index) => renderTextSegment(segment, index))}
    //       </span>
    //     </div>
    //     {children.length > 0 && (
    //       <ul className={item.type === 'numberedListItem' ? 'kal-list-decimal kal-ml-4 kal-mt-2' : 'kal-list-disc kal-ml-4 kal-mt-2'}>
    //         {children.map((child, index) => (
    //           <ListItem key={child.id} item={child} depth={index} />
    //         ))}
    //       </ul>
    //     )}
    //   </li>
    // );

    // lets simplify and show only content
    return (
        <li>
            {content.map((segment, index) => renderTextSegment(segment, index))}
        </li>
    )
};
  

interface ListProps {
  rawJson: ListItemData[];
}

export const List: React.FC<ListProps> = ({ rawJson }) => {
  if (!Array.isArray(rawJson)) return null;

  let type = "";

  for (let i = 0; i < rawJson.length; i++) {
    if (rawJson[i].type === "numberedListItem") {
      type = "kal-list-decimal";
      break;
    } else if (rawJson[i].type === "bulletListItem") {
      type = "kal-list-disc";
      break;
    }
  }

  if (type === "") return null;

  if (type === "kal-list-disc") {
    return (
      <ul className="kal-list-disc">
        {rawJson.map((item) => (
          <ListItem key={item.id} item={item} />
        ))}
      </ul>
    );
  } else {
    return (
      <ol className="kal-list-decimal">
        {rawJson.map((item) => (
          <ListItem key={item.id} item={item} />
        ))}
      </ol>
    );
  }
};

export default List;
