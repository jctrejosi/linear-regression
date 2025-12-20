import axios from "axios";

type DataSend = {
  columns: string[];
  data: (string | number | null)[][];
};

export type AnovaResult = {
  ok: boolean;
  f_statistics: number;
  p_value: number;
  conclusion: string;
  error?: string;
  means: number[];
  global_mean: number;
  n_data: number;
  k_groups: number;
  ssb: number[];
  sse: number[];
  sse_string: string[];
  ssb_string: string[];
  ssb_total: number;
  sse_total: number;
  mse: number;
  msb: number;
};

export const anova_analysis = async (data: DataSend) => {
  try {
    const res = await axios.post<AnovaResult>(
      "http://localhost:5000/api/v1.0/anova",
      data
    );
    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
