import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslation } from "react-i18next";

/* eslint-disable react/prop-types */
interface OnClick {
  onClick: () => Promise<void>;
}

const DeleteButton: React.FC<OnClick> = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      title={t("delete_field")}
      className="flex items-center gap-1 rounded-lg text-sm "
    >
      <Icon
        icon="material-symbols:delete"
        className="text-red-500 dark:text-red-600 hover:text-red-800 h-7 w-7"
      />
    </button>
  );
};

export default DeleteButton;
