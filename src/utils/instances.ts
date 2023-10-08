import axios from "axios";
import { convertTobase64 } from "./utils";

const accountAPIInstance = axios.create({
  baseURL: process.env.ORPHANAGE_API_DOMAIN,
});

accountAPIInstance.interceptors.request.use(
  (config) => {
    config.headers["Api-key"] = convertTobase64(
      process.env.ORPHANAGE_ENDPOINT_API_KEY || ""
    );
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

export default accountAPIInstance;
