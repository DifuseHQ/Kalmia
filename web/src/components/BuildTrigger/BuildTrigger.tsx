import { Icon } from "@iconify/react/dist/iconify.js";
import { differenceInSeconds, formatDistance, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { buildTrigger } from "../../api/Requests";

interface TriggerData {
  id: number;
  documentationId: number;
  triggered: boolean;
  createdAt: string | null;
  completedAt: string | null;
}

export default function BuildTrigger() {
  const [searchParam] = useSearchParams();
  const docIdString = searchParam.get("id");
  const docId: number | null = docIdString ? parseInt(docIdString, 10) : null;
  const [triggerData, setTriggerData] = useState<TriggerData | null>(null);
  const [isBuild, setIsBuild] = useState<boolean>(false);
  const [relativeTime, setRelativeTime] = useState<string>("");
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const { t } = useTranslation();

  const updateRelativeTime = useCallback(() => {
    if (timestamp) {
      const now = new Date();
      const seconds = differenceInSeconds(now, parseISO(timestamp));

      if (seconds < 60) {
        setRelativeTime(`${seconds} seconds ago`);
      } else {
        setRelativeTime(
          formatDistance(parseISO(timestamp), now, { addSuffix: true }),
        );
      }
    }
  }, [timestamp]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await buildTrigger();
        const triggerData: TriggerData[] = result.data;
        const build =
          triggerData.find((doc) => doc.documentationId === docId) || null;
        if (build) {
          setTriggerData(build);
          setIsBuild(build.triggered);

          const newTimestamp = build.completedAt || build.createdAt;
          setTimestamp(newTimestamp);
          updateRelativeTime();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    const fetchIntervalId = setInterval(fetchData, 2000);

    return () => clearInterval(fetchIntervalId);
  }, [docId, updateRelativeTime]);

  return (
    <>
      {triggerData?.documentationId === docId && (
        <AnimatePresence>
          {isBuild ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              key="build-complete-trigger"
              className="flex items-center gap-2 bg-green-300 px-3 py-1.5 rounded-md dark:bg-green-800 border border-green-500 dark:border-green-900"
            >
              <Icon
                icon="carbon:checkmark-filled"
                className="w-6 h-6 text-green-600 dark:text-green-500 "
              />
              <span className="dark:text-white text-md whitespace-nowrap">
                {`${t("Built")} ${relativeTime}`}
              </span>
            </motion.div>
          ) : (
            <div
              key="build-progress-trigger"
              className="flex items-center gap-2 bg-yellow-200 px-3 py-1.5 rounded-md dark:bg-yellow-700 border border-yellow-400 dark:border-yellow-900"
            >
              <Icon
                icon="line-md:loading-twotone-loop"
                className="w-6 h-6 text-black dark:text-white"
              />
              <span className="dark:text-white text-md whitespace-nowrap">
                {`${t("building_since")} ${relativeTime}`}
              </span>
            </div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
