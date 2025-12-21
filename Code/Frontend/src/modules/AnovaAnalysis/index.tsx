import type { TableFile } from "@/@types";
import { useState } from "react";
import { anova_analysis, type AnovaResult } from "@/services/anova_analysis";
import { AnovaResultsTable } from "./AnovaResultsTable";
import { FaEye } from "react-icons/fa";

type Props = {
  data: TableFile | undefined;
};

export const AnovaAnalysis = ({ data }: Props) => {
  const [view, setView] = useState(false); // para mostrar modal
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnovaResult>({} as AnovaResult);

  const handleSend = async () => {
    if (!data || !data.columns || !data.data) {
      alert("No hay datos para enviar.");
      return;
    }
    try {
      setLoading(true);
      const response = await anova_analysis({
        columns: data.columns,
        data: data.data,
      });
      setResult(response);
      setView(true);
    } catch (error) {
      console.error("Error al realizar el análisis ANOVA:", error);
      alert("Ocurrió un error al realizar el análisis ANOVA.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => setView(false);

  return (
    <div className="bg-white rounded-lg">
      <div className="flex gap-2 items-center">
        <button
          onClick={handleSend}
          disabled={loading}
          className={`px-5 py-2 font-semibold rounded transition ${
            loading
              ? "bg-blue-300 cursor-not-allowed animate-pulse"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {loading ? "Ejecutando..." : "Ejecutar Análisis ANOVA"}
        </button>

        {result.ok && (
          <button
            onClick={() => setView(true)}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded transition text-gray-700 flex items-center gap-1"
            title="Ver último resultado"
          >
            <FaEye />
          </button>
        )}
      </div>

      {view && result.ok && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-6">
            {/* Botón cerrar */}
            <div className="sticky top-0 z-10 flex justify-end mb-4">
              <button
                onClick={closeModal}
                className="text-gray-700 hover:text-gray-900 font-bold text-xl"
              >
                ×
              </button>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Resultados del Análisis ANOVA (one-way)
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-gray-700">
                  <span className="font-semibold">H0:</span> Las medias de los
                  tres métodos son iguales.
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">H1:</span> Al menos una media
                  es diferente.
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
                  <span className="font-semibold">MSB:</span> {result.ssb_total}
                  /({result.k_groups} - 1) = {result.msb}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">MSE:</span> {result.sse_total}
                  /({result.n_data} - {result.k_groups}) = {result.mse}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Estadístico F:</span>{" "}
                  {result.f_statistics}
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">Valor p:</span>{" "}
                  {result.p_value}
                </p>
                {result.conclusion && (
                  <p className="mt-2 text-green-700 font-semibold">
                    {result.conclusion}
                  </p>
                )}
              </div>
            </div>
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
