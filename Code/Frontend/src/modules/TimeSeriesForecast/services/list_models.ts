import axios from "axios";
import type { ModelsResponse } from "../types";

export const list_models = async (): Promise<ModelsResponse> => {
  const res = await axios.get("/list_models");

  return res.data;
};
