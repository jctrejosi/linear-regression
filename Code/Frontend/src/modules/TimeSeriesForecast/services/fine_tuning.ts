import axios from "axios";

interface FineTuningPayload {
  model_name: string;
  data: Record<string, string | number | boolean>[];
}

export const fine_tuning = async (payload: FineTuningPayload) => {
  const res = await axios.post("/fine_tuning", payload);

  return res.data;
};
