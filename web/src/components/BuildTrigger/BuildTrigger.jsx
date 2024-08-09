import { Icon } from '@iconify/react/dist/iconify.js'
import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom';
import { buildTrigger } from '../../api/Requests';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default function BuildTrigger() {
    const [searchParam] = useSearchParams();
    const docId = searchParam.get('id');
    const [triggerData, setTriggerData] = useState(null)
    const [isBuild, setIsBuild] = useState(false);
    const [relativeTime, setRelativeTime] = useState('');

    useEffect(() => {
        // Function to fetch data
        const fetchData = async () => {
            try {
                const result = await buildTrigger();
                console.log('backend trigger', result);
                const triggerData = result.data;
                const build = triggerData.find((doc) => doc.documentationId === parseInt(docId, 10) || null);
                setTriggerData(build);
                if (build) {
                    setIsBuild(build.triggered);

                    const timestamp = build.completedAt || build.createdAt;

                    const updateRelativeTime = () => {
                        if (timestamp) {
                            setRelativeTime(formatDistanceToNow(parseISO(timestamp), { addSuffix: true }));
                        }
                    };

                    updateRelativeTime();

                    const timeIntervalId = setInterval(updateRelativeTime, 1000);

                    return () => clearInterval(timeIntervalId);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();

        const fetchIntervalId = setInterval(fetchData, 1000);

        return () => clearInterval(fetchIntervalId);
    }, [docId]); 

  return (
    <>
    {triggerData?.documentationId === parseInt(docId) ? (
        <>
      {isBuild ? (
        <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded dark:bg-green-800 border border-green-900">

            <Icon icon="carbon:checkmark-filled" className='w-6 h-6 text-green-500'/>
            <span className="dark:text-white text-md">
              Build {relativeTime}
            </span>
          </div>
        ) : (
            <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded dark:bg-yellow-700 border border-yellow-900">

            <Icon icon="line-md:loading-twotone-loop" className='w-6 h-6 text-white'/>
            <span className="dark:text-white text-md">
              Build in progress {relativeTime}
            </span>
          </div>
        )}
        </>
    ) : (
        <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded-md dark:bg-green-800 border border-green-900">

            <Icon icon="carbon:checkmark-filled" className='w-6 h-6 text-green-500'/>
            <span className="dark:text-white text-md">
              Build completed
            </span>
          </div>
    )}
  </>
  )
}
