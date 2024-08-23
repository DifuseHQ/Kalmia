import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { useDark } from 'rspress/runtime';

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
  light: {
    warning: {
      backgroundColor: '#fffbeb',
      borderColor: '#ffecb5',
      textColor: '#856404',
    },
    danger: {
      backgroundColor: '#fee2e2',
      borderColor: '#fca5a5',
      textColor: '#b91c1c',
    },
    info: {
      backgroundColor: '#e0f2fe',
      borderColor: '#93c5fd',
      textColor: '#1e40af',
    },
    success: {
      backgroundColor: '#dcfce7',
      borderColor: '#86efac',
      textColor: '#166534',
    },
  },
  dark: {
    warning: {
      backgroundColor: '#3b2f01',
      borderColor: '#816100',
      textColor: '#fff8db',
    },
    danger: {
      backgroundColor: '#4b1c1c',
      borderColor: '#b91c1c',
      textColor: '#fee2e2',
    },
    info: {
      backgroundColor: '#1e3a8a',
      borderColor: '#93c5fd',
      textColor: '#e0f2fe',
    },
    success: {
      backgroundColor: '#064e3b',
      borderColor: '#86efac',
      textColor: '#dcfce7',
    },
  },
};

export const Alert: React.FC<AlertProps> = ({ rawJson }) => {
  const isDarkMode = useDark();
  const { props, content } = rawJson;
  const { textColor, textAlignment, type } = props;

  const AlertIcon = alertIcons[type];
  const alertStyle = isDarkMode ? alertColors.dark[type] : alertColors.light[type];

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '16px',
    borderRadius: '8px',
    borderLeft: `4px solid ${alertStyle.borderColor}`,
    backgroundColor: alertStyle.backgroundColor,
    color: alertStyle.textColor,
    marginTop: '16px',
    marginBottom: '20px',
    justifyContent:
      textAlignment === 'center'
        ? 'center'
        : textAlignment === 'right'
        ? 'flex-end'
        : 'flex-start',
  };

  const iconStyles: React.CSSProperties = {
    marginRight: '12px',
    width: '20px',
    height: '20px',
    flexShrink: 0,
    color: alertStyle.textColor,
  };

  const textContainerStyles: React.CSSProperties = {
    flexGrow: 1,
    color: textColor || alertStyle.textColor,
  };

  const renderTextSegment = (segment: TextSegment, index: number) => {
    const styles: React.CSSProperties = {
      fontWeight: segment.styles?.bold ? 'bold' : undefined,
      fontStyle: segment.styles?.italic ? 'italic' : undefined,
      textDecoration: segment.styles?.underline
        ? 'underline'
        : segment.styles?.strike
        ? 'line-through'
        : undefined,
      backgroundColor: segment.styles?.backgroundColor,
      color: segment.styles?.textColor || alertStyle.textColor,
    };

    if (segment.type === 'link') {
      return (
        <a key={index} href="#" style={styles}>
          {segment.text}
        </a>
      );
    }

    return (
      <span key={index} style={styles}>
        {segment.text}
      </span>
    );
  };

  return (
    <div style={containerStyles}>
      <AlertIcon style={iconStyles} />
      <div style={textContainerStyles}>
        <div style={{ fontWeight: 600, marginBottom: '8px' }}>
          {type.toUpperCase()}
        </div>
        {content.map(renderTextSegment)}
      </div>
    </div>
  );
};

export default Alert;
