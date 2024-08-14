import { JSX, useContext } from 'react';
import { motion } from 'framer-motion';

import { ModalContext } from '../../context/ModalContext';

export default function Loading (): JSX.Element | null {
  const { loadingModal, loadingMessage } = useContext(ModalContext);

  if (!loadingModal) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      key="loading-modal-container"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-lg">
        {loadingMessage && (
          <h2 className="text-md sm:text-xl text-black dark:text-white font-semibold mb-6">
            {loadingMessage}
          </h2>
        )}
        <div className="flex space-x-2 justify-center items-center">
          <span className="sr-only">Loading...</span>
          <div className="h-6 w-6 bg-gray-400 dark:bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="h-6 w-6 bg-gray-400 dark:bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="h-6 w-6 bg-gray-400 dark:bg-white rounded-full animate-bounce" />
        </div>
      </div>
    </motion.div>
  );
}
