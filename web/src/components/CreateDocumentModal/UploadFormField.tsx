import { UploadFormFieldData } from "../../types/doc";
import { Icon } from "@iconify/react"

export const UploadFormField: React.FC<UploadFormFieldData> = ({
  label,
  placeholder,
  onChange,
  name,
  required = false,
  ref,
  uploaded
}) => {

  return (
    <div>
      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      <div className="relative  flex justify-center items-center">
        <input
          ref={ref}
          onChange={onChange}
          type={"file"}
          name={name}
          id={name}
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full p-2.5 pr-10 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
          placeholder={placeholder}
          required={required}
        />

        {uploaded && <Icon icon="solar:check-circle-bold" className="w-6 h-6 text-green-400" />}
      </div>
    </div>
  );
};
