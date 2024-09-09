import { Icon } from "@iconify/react/dist/iconify.js";
import { useTranslation } from "react-i18next";

/* eslint-disable react/prop-types */
interface OnClick {
  onClick: () => Promise<void>;
}
const AddButton: React.FC<OnClick> = ({ onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      title={t("add_new_field")}
      onClick={onClick}
      className="flex items-center gap-1 text-blue-600 rounded-lg text-sm  "
    >
      <Icon icon="ei:plus" className="w-8 h-8  hover:text-blue-400" />
    </button>
  );
};

export default AddButton;
