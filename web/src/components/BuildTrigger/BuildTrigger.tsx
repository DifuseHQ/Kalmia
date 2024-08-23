import { Icon } from "@iconify/react/dist/iconify.js";
import { formatDistanceToNow, parseISO } from "date-fns";
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
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [relativeTime, setRelativeTime] = useState<string>("");
  const { t } = useTranslation();

  const updateRelativeTime = useCallback(() => {
    if (triggerData) {
      const timestamp = triggerData.completedAt || triggerData.createdAt;
      if (timestamp) {
        setRelativeTime(
          formatDistanceToNow(parseISO(timestamp), { addSuffix: true }),
        );
      }
    }
  }, [triggerData]);

  const fetchData = useCallback(async () => {
    if (!docId) return;

    try {
      const result = await buildTrigger();
      const allTriggerData: TriggerData[] = result.data;
      const relevantTriggers = allTriggerData.filter(
        (doc) => doc.documentationId === docId,
      );

      if (relevantTriggers.length > 0) {
        const latestTrigger = relevantTriggers.sort((a, b) => b.id - a.id)[0];
        setTriggerData(latestTrigger);
        setIsBuilding(latestTrigger.completedAt === null);
      } else {
        setTriggerData(null);
        setIsBuilding(false);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [docId]);

  useEffect(() => {
    fetchData();
    const fetchIntervalId = setInterval(fetchData, 1000);
    return () => clearInterval(fetchIntervalId);
  }, [fetchData]);

  useEffect(() => {
    updateRelativeTime();
    const updateTimeIntervalId = setInterval(updateRelativeTime, 1000);
    return () => clearInterval(updateTimeIntervalId);
  }, [updateRelativeTime]);

  if (!triggerData) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isBuilding ? "building" : "built"}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${
          isBuilding
            ? "bg-yellow-200 dark:bg-yellow-700 border-yellow-400 dark:border-yellow-900"
            : "bg-green-300 dark:bg-green-800 border-green-500 dark:border-green-900"
        }`}
      >
        <Icon
          icon={
            isBuilding
              ? "line-md:loading-twotone-loop"
              : "carbon:checkmark-filled"
          }
          className={`w-6 h-6 ${
            isBuilding
              ? "text-black dark:text-white"
              : "text-green-600 dark:text-green-500"
          }`}
        />
        <span className="dark:text-white text-md whitespace-nowrap">
          {isBuilding
            ? `${t("building_since")} ${relativeTime}`
            : `${t("built")} ${relativeTime}`}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
