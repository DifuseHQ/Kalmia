import React from 'react';
import { AlertTriangleIcon } from 'lucide-react';
import { useDark, useLocation } from 'rspress/runtime';

interface OldVersionProps {
    newVersion: string;
}

export const OldVersion: React.FC<OldVersionProps> = ({ newVersion }) => {
  const isDarkMode = useDark();

  const containerStyles = {
    padding: '16px',
    marginBottom: '16px',
    fontSize: '14px',
    borderLeft: '4px solid',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column' as 'column',
    backgroundColor: isDarkMode ? '#3b2f01' : '#fffbeb',
    borderColor: isDarkMode ? '#816100' : '#ffecb5',
    color: isDarkMode ? '#fff8db' : '#856404',
  };

  const iconStyles = {
    marginRight: '12px',
    width: '20px',
    height: '20px',
    flexShrink: 0,
    color: isDarkMode ? '#ffecb5' : '#856404',
  };

  const headingStyles = {
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  };

  const textStyles = {
    marginTop: '8px',
  };

  const latestPath = `/${((useLocation()).pathname).split('/')[1]}/guides/index.html`;

  return (
    <div style={containerStyles}>
      <div style={headingStyles}>
        <AlertTriangleIcon style={iconStyles} />
        <span>WARNING</span>
      </div>
      <p style={textStyles}>This is <b>not</b> the latest version of this documentation, for the one that is upto date, please see the <a className='font-bold' style={{textDecoration:"underline"}} href={latestPath}>latest version</a> ({newVersion})</p>
    </div>
  );
};

export default OldVersion;
