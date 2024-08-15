import React from 'react';
import ReactPlayer from 'react-player';
import { getColorClass } from '../utils/style';
import { useDark } from 'rspress/runtime';

interface VideoData {
  id: string;
  type: 'video';
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

interface VideoProps {
  rawJson: VideoData;
}

export const Video: React.FC<VideoProps> = ({ rawJson }) => {
  const { props } = rawJson;
  const {
    backgroundColor,
    textAlignment = 'center',
    url,
    caption,
    showPreview,
    previewWidth,
  } = props;

  const containerClasses = [
    'kal-flex',
    'kal-flex-col',
    textAlignment === 'left' ? 'kal-items-start' : 
    textAlignment === 'right' ? 'kal-items-end' : 'kal-items-center',
    getColorClass(backgroundColor, true),
    'kal-p-4',
    'kal-w-full',
  ].filter(Boolean).join(' ');

  const playerWrapperClasses = [
    'kal-relative',
    'kal-w-full',
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
      <div className={playerWrapperClasses}>
        <ReactPlayer
          url={url}
          width="100%"
          height="100%"
          controls={true}
          config={{
            file: {
              attributes: {
                controlsList: 'nodownload',  // Disable download button
                preload: 'metadata',
              },
            },
          }}
        />
      </div>
      {caption && <p className={captionClasses}>{caption}</p>}
    </div>
  );
};

export default Video;