import React from 'react';
import { getColorClass } from '../utils/style';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

interface TextSegment {
  type: 'text' | 'link';
  text: string;
  styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    backgroundColor?: string;
    textColor?: string;
  };
}

interface AlertData {
  id: string;
  type: 'alert';
  props: {
    textColor?: string;
    textAlignment?: 'left' | 'center' | 'right';
    type: 'warning' | 'danger' | 'info' | 'success';
  };
  content: TextSegment[];
  children: any[];
}

interface AlertProps {
  rawJson: AlertData;
}

const alertIcons = {
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
  success: CheckCircle,
};

const alertColors = {
  warning: 'kal-bg-yellow-100 kal-border-yellow-400 kal-text-yellow-800',
  danger: 'kal-bg-red-100 kal-border-red-400 kal-text-red-800',
  info: 'kal-bg-blue-100 kal-border-blue-400 kal-text-blue-800',
  success: 'kal-bg-green-100 kal-border-green-400 kal-text-green-800',
};

export const Alert: React.FC<AlertProps> = ({ rawJson }) => {
  const { props, content } = rawJson;
  const { textColor, textAlignment, type } = props;

  const AlertIcon = alertIcons[type];

  const alertClasses = [
    alertColors[type],
    'kal-border',
    'kal-rounded-lg',
    'kal-p-4',
    'kal-flex',
    'kal-items-start',
    textAlignment === 'center' ? 'kal-justify-center' : 
    textAlignment === 'right' ? 'kal-justify-end' : 'kal-justify-start',
    'kal-mt-4',
  ].join(' ');

  const renderTextSegment = (segment: TextSegment, index: number) => {
    const styles = segment.styles || {};
    const classes = [
      styles.bold ? 'kal-font-bold' : '',
      styles.italic ? 'kal-italic' : '',
      styles.underline ? 'kal-underline' : '',
      styles.strike ? 'kal-line-through' : '',
      getColorClass(styles.backgroundColor, true),
      getColorClass(styles.textColor),
    ].filter(Boolean).join(' ');

    return (
      <span key={index} className={classes}>
        {segment.text}
      </span>
    );
  };

  return (
    <div className={alertClasses}>
      <AlertIcon className="kal-h-5 kal-w-5 kal-mr-2 kal-flex-shrink-0" />
      <div className={`kal-flex-grow ${getColorClass(textColor)}`}>
        {content.map(renderTextSegment)}
      </div>
    </div>
  );
};

export default Alert;