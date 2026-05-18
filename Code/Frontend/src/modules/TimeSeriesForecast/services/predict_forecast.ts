import axios from "axios";
import type { ForecastRequest, ForecastResponse } from "../types";

export const predict_forecast = async (
  payload: ForecastRequest
): Promise<ForecastResponse> => {
  const res = await axios.post("/predict", payload);

  return res.data;
};
