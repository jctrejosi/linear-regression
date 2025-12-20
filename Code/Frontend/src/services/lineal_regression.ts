import axios from "axios";

type DataSend = {
  columns: string[];
  data: (string | number | null)[][];
};

export type RegressionResponse = {
  ok: boolean;
  n_obs: number;
  n_vars: number;
  r2: number;
  r2_adj: number;
  f_statistic: number;
  f_pvalue: number;
  coefs: {
    variable: string;
    coef: number;
    p_value: number;
  }[];
  normality: {
    shapiro_stat: number;
    shapiro_p: number;
    ks_stat: number;
    ks_p: number;
    jarque_bera_stat: number;
    jarque_bera_p: number;
    skewness: number;
    kurtosis: number;
  };
  breusch_pagan: {
    "Lagrange multiplier": number;
    "p-value": number;
    "f-value": number;
    "f p-value": number;
    LM_p: number; // por compatibilidad extra
    F_p: number;
  };
  white_test: {
    stat: number;
    p_value: number;
    f_stat: number;
    f_p_value: number;
    error?: string;
  };
  durbin_watson: number;
  vif: {
    variable: string;
    VIF: number;
  }[];
  cooks_distance: number[];
  conclusion: string;
  interpretacion: string;
  results_table: {
    id: number;
    Y_observado: number;
    Y_predicho: number;
    Residuo: number;
    Residuo_estandarizado: number;
    Leverage: number;
    Cooks_distance: number;
    Outlier: boolean;
  }[];
};

export const set_regression = async (data: DataSend) => {
  try {
    const res = await axios.post<RegressionResponse>(
      "http://localhost:5000/api/v1.0/regression",
      { ...data, dependent: "Y", categorical: ["X6"] }
    );
    return res.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
