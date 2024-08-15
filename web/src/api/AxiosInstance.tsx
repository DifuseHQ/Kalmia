import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
  Method,
} from "axios";

export const baseURL: string =
  process.env.NODE_ENV === "development" ? "http://127.0.0.1:2727" : "";

const instance: AxiosInstance = axios.create({
  baseURL,
});

instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error) {
      throw error;
    }
    return Promise.reject(error);
  },
);

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      try {
        const parsedToken = JSON.parse(accessToken);
        if (config.headers && parsedToken?.token) {
          config.headers.Authorization = `Bearer ${parsedToken.token}`;
        }
      } catch (error) {
        console.error("Error parsing access token:", error);
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

export const makeRequestWithCustomAuth = (
  url: string,
  method: Method = "get",
  token: string,
  data?: object,
): Promise<AxiosResponse> => {
  return instance({
    method,
    url,
    data,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export default instance;
