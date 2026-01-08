import axios from "axios";
import type { RegressionResponse } from "../types";

type DataSend = {
  columns: string[];
  data: (string | number | null)[][];
  dependent: string;
};

export const set_regression = async (data: DataSend) => {
  try {
    const res = await axios.post<RegressionResponse>(
      "http://localhost:5000/api/v1.0/regression",
      { ...data }
    );
    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
