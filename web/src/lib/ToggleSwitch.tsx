import { Field, Label, Switch } from "@headlessui/react";
import { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";

interface ToggleSwitchProps {
  name: string;
  checked: boolean | undefined;
  setChange: Dispatch<SetStateAction<boolean | undefined>>;
}

export default function ToggleSwitch({
  name,
  checked,
  setChange,
}: ToggleSwitchProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <Field className="inline-flex items-center space-x-3">
      <Label className="text-lg font-medium text-gray-900 dark:text-gray-300 ">
        {t(name)}
      </Label>
      <Switch
        checked={checked}
        onChange={setChange}
        className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-600 transition data-[checked]:bg-blue-600 dark:data-[checked]:bg-blue-600"
      >
        <span className="size-4 translate-x-1 rounded-full bg-white dark:bg-white transition group-data-[checked]:translate-x-6" />
      </Switch>
    </Field>
  );
}
