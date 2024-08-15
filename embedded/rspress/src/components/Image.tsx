import React from 'react';
import { getColorClass } from '../utils/style';
import { useDark } from 'rspress/runtime';

interface ImageData {
  id: string;
  type: 'image';
  props: {
    backgroundColor?: string;
    textAlignment?: 'left' | 'center' | 'right';
    name: string;
    url: string;
    caption?: string;
    showPreview: boolean;
    previewWidth: number;
  };
  children: any[];
}

interface ImageProps {
  rawJson: ImageData;
}

export const Image: React.FC<ImageProps> = ({ rawJson }) => {
  const { props } = rawJson;
  const {
    backgroundColor,
    textAlignment = 'center',
    url,
    caption,
    showPreview,
    previewWidth,
    name,
  } = props;

  const containerClasses = [
    'kal-flex',
    'kal-flex-col',
    textAlignment === 'left' ? 'kal-items-start' : 
    textAlignment === 'right' ? 'kal-items-end' : 'kal-items-center',
    getColorClass(backgroundColor, true),
    'kal-p-4',
    'kal-w-full',  // Ensure the container takes full width
  ].filter(Boolean).join(' ');

  const imageClasses = [
    'kal-max-w-full',
    'kal-h-auto',
    showPreview ? `kal-max-w-[${previewWidth}px]` : '',
  ].filter(Boolean).join(' ');

  const captionClasses = [
    'kal-mt-2',
    'kal-text-sm',
    useDark() ? 'kal-text-gray-100' : 'kal-text-gray-800',
    textAlignment === 'left' ? 'kal-text-left' : 
    textAlignment === 'right' ? 'kal-text-right' : 'kal-text-center',
    'kal-w-full',
  ].join(' ');

  return (
    <div className={containerClasses}>
      <img src={url} alt={name} className={imageClasses} />
      {caption && <p className={captionClasses}>{caption}</p>}
    </div>
  );
};

export default Image;