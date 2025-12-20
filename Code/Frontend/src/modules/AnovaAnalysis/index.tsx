import type { TableFile } from "@/@types";
import { useState } from "react";
import { anova_analysis, type AnovaResult } from "@/services/anova_analysis";
import { AnovaResultsTable } from "./AnovaResultsTable";

type Props = {
  data: TableFile | undefined;
};

export const AnovaAnalysis = ({ data }: Props) => {
  const [view, setView] = useState(false);
  const [result, setResult] = useState<AnovaResult>({} as AnovaResult);

  const handleSend = async () => {
    if (!data || !data.columns || !data.data) {
      alert("No hay datos para enviar.");
      return;
    }
    try {
      const response = await anova_analysis({
        columns: data.columns,
        data: data.data,
      });
      setResult(response);
      setView(true);
    } catch (error) {
      console.error("Error al realizar el análisis ANOVA:", error);
      alert("Ocurrió un error al realizar el análisis ANOVA.");
    }
  };

  return (
    <div className="mx-auto p-6 bg-white shadow-md rounded-lg">
      <button
        onClick={handleSend}
        className="mb-6 px-5 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
      >
        Ejecutar Análisis ANOVA
      </button>

      {view && result.ok && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Resultados del Análisis ANOVA (one-way)
          </h2>

          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <p className="text-gray-700">
              <span className="font-semibold">H0:</span> Las medias de los tres
              métodos son iguales.
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">H1:</span> Al menos una media es
              diferente.
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Total de grupos (k):</span>{" "}
              {result.k_groups}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Total de datos (N):</span>{" "}
              {result.n_data}
            </p>
          </div>

          <AnovaResultsTable data={data} result={result} />

          <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-2">
            <p className="text-gray-700">
              <span className="font-semibold">df(entre):</span>{" "}
              {result.k_groups - 1}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">df(dentro):</span>{" "}
              {result.n_data - result.k_groups}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">MSB:</span> {result.ssb_total}/(
              {result.k_groups} - 1) = {result.msb}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">MSE:</span> {result.sse_total}/(
              {result.n_data} - {result.k_groups}) = {result.mse}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Estadístico F:</span>{" "}
              {result.f_statistics}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Valor p:</span> {result.p_value}
            </p>
            {result.conclusion && (
              <p className="mt-2 text-green-700 font-semibold">
                {result.conclusion}
              </p>
            )}
          </div>
        </div>
      )}

      {result?.error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded border border-red-200">
          <p>Error: {result.error}</p>
        </div>
      )}
    </div>
  );
};
