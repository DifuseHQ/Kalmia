import { Icon } from "@iconify/react";
import { JSX, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

interface ErrorConfig {
  title: string;
  icon: string;
}

interface ErrorConfigs {
  [key: number]: ErrorConfig;
}

const errorConfig: ErrorConfigs = {
  400: { title: "Bad Request", icon: "carbon:warning-alt" },
  401: { title: "Unauthorized", icon: "carbon:user-profile" },
  403: { title: "Forbidden", icon: "carbon:locked" },
  404: { title: "Not Found", icon: "carbon:search" },
  500: { title: "Internal Server Error", icon: "carbon:server-error" },
  502: { title: "Bad Gateway", icon: "carbon:network-3" },
  503: { title: "Service Unavailable", icon: "carbon:time" },
  504: { title: "Gateway Timeout", icon: "carbon:hourglass" },
};

export default function Error(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const params = useParams<{ code?: string }>();
  const titleRef = useRef<string>("");

  const getErrorCode = (): number => {
    if (params.code) return parseInt(params.code, 10);
    const searchParams = new URLSearchParams(location.search);
    const queryErrorCode = searchParams.get("e");
    if (queryErrorCode) return parseInt(queryErrorCode, 10);
    return (
      (location.state as { errorDetails?: { code: number } })?.errorDetails
        ?.code || 404
    );
  };

  const errorCode = getErrorCode();
  const { title, icon } = errorConfig[errorCode] || errorConfig[404];

  useEffect(() => {
    const newTitle = `Kalmia - ${errorCode} ${title}`;
    titleRef.current = newTitle;
    document.title = titleRef.current;
  }, [errorCode, title]);

  const goBack = (): void => navigate(-1);
  const reloadPage = (): void => navigate(-1);

  const isServerError = errorCode >= 500;

  return (
    <section className="bg-neutral-300 dark:bg-gray-900 min-h-screen flex items-center justify-center">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center">
          <Icon icon={icon} className="text-gray-500 w-32 h-32 mx-auto mb-4" />
          <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500">
            {errorCode}
          </h1>
          <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
            {t(title.toLowerCase().replaceAll(" ", "_"))}
          </p>
          <p className="mb-4 text-lg text-gray-500 dark:text-gray-400">
            {t("error_message", {
              context: isServerError ? "server" : "client",
            })}
          </p>
          <button
            onClick={isServerError ? reloadPage : goBack}
            className="inline-flex items-center text-lg text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg px-5 py-2.5 text-center dark:focus:ring-primary-900 my-4 transition duration-150 ease-in-out"
          >
            <Icon
              icon={isServerError ? "carbon:restart" : "carbon:arrow-left"}
              className="mr-2"
            />
            {isServerError ? t("reload_page") : t("go_back")}
          </button>
        </div>
      </div>
    </section>
  );
}
