import axios from "axios";

type DataSend = {
  columns: string[];
  data: (string | number | null)[][];
  dependent: string;
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

export type RegressionMeta = {
  dropped_columns?: string[];
  auto_dummies?: string[];
  warnings?: string[];
  rows_before?: number | null;
  rows_after?: number | null;
  imputed_columns?: Record<
    string,
    { mean: number; count: number } | { mean?: number; count?: number }
  >;
};

export type RegressionResponse = {
  ok: boolean;
  dependent_variable: string;
  meta?: RegressionMeta;
  n_obs: number;
  n_vars: number;
  r2: number;
  r2_adj: number;
  f_statistic: number;
  f_pvalue: number;
  anova: AnovaResult;
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
  ia_response_general_section: string;
  ia_response_anova_analisis: string;
  ia_response_coefs: string;
  ia_response_normality: string;
  ia_response_breuch_and_white: string;
  ia_response_vif: string;
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
