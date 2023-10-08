import axios from "axios";
import { convertTobase64 } from "./utils";
import { config } from "dotenv";

config();

const accountAPIInstance = axios.create({
  baseURL: process.env.ORPHANAGE_API_DOMAIN || "dummy.cll",
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
