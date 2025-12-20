import type { TableFile } from "@/@types";
import { useState } from "react";

import {
  set_regression,
  type RegressionResponse,
} from "@/services/lineal_regression";

type props = {
  data: TableFile | undefined;
};

export const LinealRegresion = ({ data }: props) => {
  const [view, setView] = useState<boolean>(false);
  const [result, setResult] = useState<RegressionResponse>(
    {} as RegressionResponse
  );

  const handleSend = async () => {
    if (!data || !data.columns || !data.data) {
      alert("No hay datos para enviar.");
      return;
    }
    try {
      const response = await set_regression({
        columns: data.columns,
        data: data.data,
      });
      setResult(response);
      setView(true);
    } catch (error) {
      console.error(
        "Error al realizar el análisis de regresión lineal:",
        error
      );
      alert("Ocurrió un error al realizar el análisis de regresión lineal.");
    }
  };

  return (
    <div>
      <button onClick={handleSend}>Regresión lineal</button>

      {view && result.ok && (
        <>
          <h1>Resultados de la Regresión Lineal Múltiple</h1>

          <p>
            <strong>Observaciones:</strong> {result.n_obs}
          </p>
          <p>
            <strong>Variables independientes:</strong> {result.n_vars}
          </p>
          <p>
            <strong>R²:</strong> {result.r2}
          </p>
          <p>
            <strong>R² ajustado:</strong> {result.r2_adj}
          </p>
          <p>
            <strong>Estadístico F:</strong> {result.f_statistic}
          </p>
          <p>
            <strong>Valor p del modelo:</strong> {result.f_pvalue}
          </p>
          <p>
            <strong>Conclusión:</strong> {result.conclusion}
          </p>

          <h2>Coeficientes</h2>
          <table>
            <thead>
              <tr>
                <th>Variable</th>
                <th>Coeficiente</th>
                <th>Valor p</th>
              </tr>
            </thead>
            <tbody>
              {result.coefs.map((c) => (
                <tr key={c.variable}>
                  <td>{c.variable}</td>
                  <td>{c.coef}</td>
                  <td>{c.p_value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Pruebas de Supuestos</h2>
          <p>
            <strong>Shapiro-Wilk p:</strong> {result.normality.shapiro_p}
          </p>
          <p>
            <strong>Kolmogorov-Smirnov p:</strong> {result.normality.ks_p}
          </p>
          <p>
            <strong>Jarque-Bera p:</strong> {result.normality.jarque_bera_p}
          </p>
          <p>
            <strong>Skewness:</strong> {result.normality.skewness}
          </p>
          <p>
            <strong>Kurtosis:</strong> {result.normality.kurtosis}
          </p>
          <p>
            <strong>Durbin-Watson:</strong> {result.durbin_watson}
          </p>

          <h2>Breusch-Pagan</h2>
          <p>
            <strong>LM p:</strong> {result.breusch_pagan["LM_p"]}
          </p>
          <p>
            <strong>F p:</strong> {result.breusch_pagan["F_p"]}
          </p>

          <h2>White (Heterocedasticidad)</h2>
          {typeof result.white_test?.stat === "number" ? (
            <>
              <p>
                <strong>Estadístico:</strong> {result.white_test.stat}
              </p>
              <p>
                <strong>p-valor:</strong> {result.white_test.p_value}
              </p>
              <p>
                <strong>F-stat:</strong> {result.white_test.f_stat}
              </p>
              <p>
                <strong>F p-valor:</strong> {result.white_test.f_p_value}
              </p>
            </>
          ) : (
            <p>
              <strong>Error:</strong>{" "}
              {result.white_test?.error ?? "No disponible"}
            </p>
          )}

          <h2>VIF (Multicolinealidad)</h2>
          <table>
            <thead>
              <tr>
                <th>Variable</th>
                <th>VIF</th>
              </tr>
            </thead>
            <tbody>
              {result.vif.map((v) => (
                <tr key={v.variable}>
                  <td>{v.variable}</td>
                  <td>{v.VIF}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="interpretacion-box">
            <h2>Interpretación del Modelo</h2>
            <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>
              {result.interpretacion}
            </pre>
          </div>

          <h2>Tabla de Residuos y Diagnóstico</h2>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Y observado</th>
                <th>Y predicho</th>
                <th>Residuo</th>
                <th>Residuo estandarizado</th>
                <th>Leverage</th>
                <th>Cook's distance</th>
                <th>Outlier</th>
              </tr>
            </thead>
            <tbody>
              {result.results_table?.map((row, index) => (
                <tr key={index}>
                  <td>{row.id}</td>
                  <td>{row.Y_observado.toFixed(4)}</td>
                  <td>{row.Y_predicho.toFixed(4)}</td>
                  <td>{row.Residuo.toFixed(4)}</td>
                  <td>{row.Residuo_estandarizado.toFixed(4)}</td>
                  <td>{row.Leverage.toFixed(4)}</td>
                  <td>{row.Cooks_distance.toFixed(4)}</td>
                  <td style={{ color: row.Outlier ? "red" : "black" }}>
                    {row.Outlier ? "Sí" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};
