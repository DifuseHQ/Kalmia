import React from 'react';
import ReactPlayer from 'react-player';
import { getColorClass } from '../utils/style';
import { useDark } from 'rspress/runtime';

interface AudioData {
  id: string;
  type: 'audio';
  props: {
    backgroundColor?: string;
    name: string;
    url: string;
    caption?: string;
    showPreview: boolean;
  };
  children: any[];
}

interface AudioProps {
  rawJson: AudioData;
}

export const Audio: React.FC<AudioProps> = ({ rawJson }) => {
  const { props } = rawJson;
  const {
    backgroundColor,
    url,
    caption,
    showPreview,
    name,
  } = props;

  const containerClasses = [
    'kal-flex',
    'kal-flex-col',
    'kal-items-center',
    getColorClass(backgroundColor, true),
    'kal-p-4',
    'kal-w-full',
  ].filter(Boolean).join(' ');

  const playerWrapperClasses = [
    'kal-w-full',
    'kal-max-w-md',  // Limit maximum width for better appearance
    showPreview ? '' : 'kal-hidden',
  ].filter(Boolean).join(' ');

  const captionClasses = [
    'kal-mt-2',
    'kal-text-sm',
    useDark() ? 'kal-text-gray-100' : 'kal-text-gray-800',
    'kal-text-center',
    'kal-w-full',
  ].join(' ');

  return (
    <div className={containerClasses}>
      <div className={playerWrapperClasses}>
        <ReactPlayer
          url={url}
          width="100%"
          height="50px"  // Fixed height for audio player
          controls={true}
          config={{
            file: {
              forceAudio: true,  // Force audio mode
              attributes: {
                controlsList: 'nodownload',  // Disable download button
                preload: 'metadata',
              },
            },
          }}
        />
      </div>
      {!showPreview && (
        <button 
          className="kal-mt-2 kal-px-4 kal-py-2 kal-bg-blue-500 kal-text-white kal-rounded kal-hover:kal-bg-blue-600"
          onClick={() => window.open(url, '_blank')}
        >
          Play Audio
        </button>
      )}
      {caption && <p className={captionClasses}>{caption}</p>}
    </div>
  );
};

export default Audio;