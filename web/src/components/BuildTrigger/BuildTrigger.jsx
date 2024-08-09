import { Icon } from '@iconify/react/dist/iconify.js'
import React, { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom';
import { buildTrigger } from '../../api/Requests';
import { formatDistance, parseISO, differenceInSeconds, format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

export default function BuildTrigger() {
    const [searchParam] = useSearchParams();
    const docId = searchParam.get('id');
    const [triggerData, setTriggerData] = useState(null)
    const [isBuild, setIsBuild] = useState(false);
    const [relativeTime, setRelativeTime] = useState('');
    const [timestamp, setTimestamp] = useState(null);

      const updateRelativeTime = useCallback(() => {
        if (timestamp) {
            const now = new Date();
            const seconds = differenceInSeconds(now, parseISO(timestamp));

            if (seconds < 60) {
                setRelativeTime(`${seconds} seconds ago`);
            } else {
                setRelativeTime(formatDistance(parseISO(timestamp), now, { addSuffix: true }));
            }
        }
    }, [timestamp]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await buildTrigger();
                const triggerData = result.data;
                const build = triggerData.find((doc) => doc.documentationId === parseInt(docId, 10) || null);
                setTriggerData(build);
                if (build) {
                    setIsBuild(build.triggered);

                    const newTimestamp = build.completedAt || build.createdAt;
                    setTimestamp(newTimestamp);
                    updateRelativeTime();  
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();

        const fetchIntervalId = setInterval(fetchData, 2000);

        return () => clearInterval(fetchIntervalId);
    }, [docId, updateRelativeTime]); 

  return (
    <>
    {triggerData?.documentationId === parseInt(docId) && (
        <AnimatePresence className="">
      {isBuild ? (
        <motion.div
        initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="build-complete-trigger"
        className="flex items-center gap-2 bg-green-300 px-3 py-1.5 rounded-md dark:bg-green-800 border border-green-500 dark:border-green-900">

            <Icon icon="carbon:checkmark-filled" className='w-6 h-6 text-green-600 dark:text-green-500 '/>
            <span className="dark:text-white text-md whitespace-nowrap">
              Build {relativeTime}
            </span>
          </motion.div>
        ) : (
            <div
              key="build-progress-trigger"
            className="flex items-center gap-2 bg-yellow-200 px-3 py-1.5 rounded-md dark:bg-yellow-700 border border-yellow-400 dark:border-yellow-900">

            <Icon icon="line-md:loading-twotone-loop" className='w-6 h-6 text-black dark:text-white'/>
            <span className="dark:text-white text-md whitespace-nowrap">
              Build in progress {relativeTime}
            </span>
          </div>
        )}
        </AnimatePresence>
    )}
  </>
  )
}
