import { createApi } from "@flexy/api-client";

const baseUrl = import.meta.env.VITE_API_BASE ?? "http://localhost:8787";
export const api = createApi(baseUrl);
