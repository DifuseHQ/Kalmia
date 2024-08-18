import React from 'react';
import { getColorClass } from '../utils/style';
import { FileIcon, ArrowDownIcon } from 'lucide-react';
import { useDark } from 'rspress/runtime';

interface FileData {
  id: string;
  type: 'file';
  props: {
    backgroundColor?: string;
    name: string;
    url: string;
    caption?: string;
  };
  children: any[];
}

interface FileProps {
  rawJson: FileData;
}

export const File: React.FC<FileProps> = ({ rawJson }) => {
  const { props } = rawJson;
  const {
    backgroundColor,
    name,
    url,
    caption,
  } = props;

  const isDark = useDark();

  const containerClasses = [
    'kal-flex',
    'kal-flex-col',
    'kal-items-center',
    getColorClass(backgroundColor, true),
    'kal-p-4',
    'kal-w-full',
  ].filter(Boolean).join(' ');

  const fileInfoClasses = [
    'kal-flex',
    'kal-items-center',
    'kal-justify-between',
    'kal-w-full',
    'kal-max-w-md',
    isDark ? 'kal-bg-gray-800' : 'kal-bg-gray-100',
    'kal-rounded-lg',
    'kal-p-4',
    'kal-mb-2',
  ].join(' ');

  const captionClasses = [
    'kal-mt-2',
    'kal-text-sm',
    'kal-text-center',
    'kal-w-full',
  ].join(' ');

  const nameClass = [
    'kal-font-medium',
    'kal-truncate',
    isDark ? 'kal-text-gray-200' : 'kal-text-gray-800'
  ].join(' ');

  return (
    <div className={containerClasses}>
      <div className={fileInfoClasses}>
        <div className="kal-flex kal-items-center">
          <FileIcon className="kal-w-6 kal-h-6 kal-mr-2 kal-text-blue-500" />
          <span className={nameClass} title={name}>
            {name}
          </span>
        </div>
        <a
          href={url}
          download={name}
          className="kal-flex kal-items-center kal-px-3 kal-py-1 kal-bg-blue-500 kal-text-white kal-rounded kal-hover:kal-bg-blue-600"
        >
          <ArrowDownIcon className="kal-w-4 kal-h-4 kal-mr-1" />
          Download
        </a>
      </div>
      {caption && <p className={captionClasses}>{caption}</p>}
    </div>
  );
};

export default File;