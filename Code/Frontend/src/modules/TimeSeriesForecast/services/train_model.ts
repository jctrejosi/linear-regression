import axios from "axios";

interface TrainPayload {
  model_name: string;
  data: Record<string, string | number>[];
}

export const train_model = async (payload: TrainPayload) => {
  const res = await axios.post("/train", payload);

  return res.data;
};
