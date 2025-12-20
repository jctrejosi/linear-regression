import type { TableFile } from "@/@types";
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaEye } from "react-icons/fa"; // Ícono de ojo

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
  const [dependent, setDependent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Inicializar dependent con la primera columna disponible
  useEffect(() => {
    if (data?.columns && data.columns.length > 0) {
      setDependent(data.columns[0]);
    }
  }, [data]);

  const handleSend = async () => {
    if (!data || !data.columns || !data.data) {
      alert("No hay datos para enviar.");
      return;
    }
    if (!dependent) {
      alert("Seleccione la columna a analizar.");
      return;
    }
    setLoading(true);
    try {
      const response = await set_regression({
        columns: data.columns,
        data: data.data,
        dependent,
      });
      setResult(response);
      setView(true);
    } catch (error) {
      console.error(
        "Error al realizar el análisis de regresión lineal:",
        error
      );
      alert("Ocurrió un error al realizar el análisis de regresión lineal.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    if (!result.ok) {
      alert("No hay resultados previos. Ejecute la regresión primero.");
      return;
    }
    setView(true);
  };

  const closeModal = () => setView(false);

  return (
    <div className="p-4">
      {/* Botón + select */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <label className="flex flex-col text-sm text-gray-700">
          Columna a analizar
          <select
            value={dependent}
            onChange={(e) => setDependent(e.target.value)}
            className="mt-1 border border-gray-300 rounded px-2 py-1 text-sm"
          >
            {data?.columns.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>
        </label>

        <div className="flex gap-2 items-center">
          <button
            onClick={handleSend}
            disabled={loading}
            className={`px-5 py-2 rounded text-white font-semibold transition ${
              loading
                ? "bg-blue-400 animate-pulse cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? "Ejecutando..." : "Ejecutar regresión lineal"}
          </button>

          <button
            onClick={openModal}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded transition text-gray-700 flex items-center gap-1"
            title="Ver último resultado"
          >
            <FaEye />
          </button>
        </div>
      </div>

      {/* Modal */}
      {view && result.ok && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6 pt-0">
            {/* Cerrar modal */}
            <div className="sticky top-0 z-10 flex justify-end mb-4">
              <button
                onClick={closeModal}
                className="text-gray-700 hover:text-gray-900 font-bold text-xl"
              >
                ×
              </button>
            </div>

            <h1 className="text-2xl font-semibold">
              Resultados de la regresión lineal
            </h1>

            {/* Sección general */}
            <div className="bg-gray-50 p-4 rounded-lg shadow mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
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
                <p className="col-span-full">
                  <strong>Conclusión:</strong> {result.conclusion}
                </p>
              </div>
            </div>

            {/* Coeficientes */}
            <div className="overflow-x-auto bg-white p-4 rounded-lg shadow mb-4">
              <h2 className="text-lg font-semibold mb-2">Coeficientes</h2>
              <table className="min-w-full border border-gray-300 divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Variable
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Coeficiente
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Valor p
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.coefs.map((c) => (
                    <tr
                      key={c.variable}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {c.variable}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {c.coef}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {c.p_value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pruebas de supuestos */}
            <div className="bg-gray-50 p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">
                Pruebas de Supuestos
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
                <p>
                  <strong>Shapiro-Wilk p:</strong> {result.normality.shapiro_p}
                </p>
                <p>
                  <strong>Kolmogorov-Smirnov p:</strong> {result.normality.ks_p}
                </p>
                <p>
                  <strong>Jarque-Bera p:</strong>{" "}
                  {result.normality.jarque_bera_p}
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
              </div>
            </div>

            {/* Breusch-Pagan y White */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-2">Breusch-Pagan</h2>
                <p>
                  <strong>LM p:</strong> {result.breusch_pagan["LM_p"]}
                </p>
                <p>
                  <strong>F p:</strong> {result.breusch_pagan["F_p"]}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-lg font-semibold mb-2">
                  White (Heterocedasticidad)
                </h2>
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
              </div>
            </div>

            {/* VIF */}
            <div className="overflow-x-auto bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">
                VIF (Multicolinealidad)
              </h2>
              <table className="min-w-full border border-gray-300 divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Variable
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      VIF
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.vif.map((v) => (
                    <tr
                      key={v.variable}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {v.variable}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {v.VIF}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Interpretación */}
            <div className="bg-gray-50 p-4 rounded-lg shadow mb-4">
              <h2 className="text-lg font-semibold mb-2">
                Interpretación del Modelo
              </h2>
              <div className="prose max-w-full">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.interpretacion}
                </ReactMarkdown>
              </div>
            </div>

            {/* Tabla de residuos */}
            <div className="overflow-x-auto bg-white p-4 rounded-lg shadow mb-4">
              <h2 className="text-lg font-semibold mb-2">
                Tabla de Residuos y Diagnóstico
              </h2>
              <table className="min-w-full border border-gray-300 divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      #
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Y observado
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Y predicho
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Residuo
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Residuo estandarizado
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Leverage
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Cook's distance
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                      Outlier
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {result.results_table?.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {row.id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {row.Y_observado.toFixed(4)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {row.Y_predicho.toFixed(4)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {row.Residuo.toFixed(4)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {row.Residuo_estandarizado.toFixed(4)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {row.Leverage.toFixed(4)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {row.Cooks_distance.toFixed(4)}
                      </td>
                      <td
                        className={`px-4 py-2 text-sm font-semibold ${
                          row.Outlier ? "text-red-500" : "text-gray-700"
                        }`}
                      >
                        {row.Outlier ? "Sí" : "No"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
