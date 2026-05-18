import type { TableFile } from "@/@types";

import { useEffect, useState } from "react";

import axios from "axios";

import { type ForecastResponse, type ModelItem } from "./types";

import { predict_forecast } from "./services/predict_forecast";
import { list_models } from "./services/list_models";

type Props = {
  data: TableFile | undefined;
};

export const TimeSeriesForecast = ({ data }: Props) => {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [model, setModel] = useState<string>("");

  const [points, setPoints] = useState<number>(24);

  const [loading, setLoading] = useState<boolean>(false);

  const [result, setResult] = useState<ForecastResponse | null>(null);

  /* =========================
     cargar modelos
  ========================= */

  useEffect(() => {
    async function fetchModels() {
      try {
        const response = await list_models();

        setModels(response.models);

        if (response.models.length > 0) {
          setModel(response.models[0].model_name);
        }
      } catch (err) {
        console.error(err);
      }
    }

    fetchModels();
  }, []);

  /* =========================
     ejecutar forecast
  ========================= */

  const handleForecast = async () => {
    if (!data?.data?.length) {
      alert("No hay datos cargados");
      return;
    }

    if (!model) {
      alert("Seleccione un modelo");
      return;
    }

    try {
      setLoading(true);

      const normalized = data.data.map((row) => {
        const parsed: Record<string, string | number> = {};

        Object.entries(row).forEach(([key, value]) => {
          const asNumber = Number(value);

          parsed[key] = Number.isNaN(asNumber) ? value ?? "" : asNumber;
        });

        return parsed;
      });

      const response = await predict_forecast({
        model_name: model,
        points,
        data: normalized,
      });

      setResult(response);
    } catch (error: unknown) {
      console.error(error);

      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.detail ?? "Error ejecutando predicción");
      } else {
        alert("Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 w-full max-w-xl">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          predicción de series temporales
        </h2>

        {/* modelo */}
        <label className="flex flex-col text-sm text-gray-600">
          Modelo
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="border rounded px-2 py-2 mt-1"
          >
            {models.map((m) => (
              <option key={m.model_name} value={m.model_name}>
                {m.model_name}
              </option>
            ))}
          </select>
        </label>

        {/* puntos futuros */}
        <label className="flex flex-col text-sm text-gray-600">
          Puntos a predecir
          <input
            type="number"
            min={1}
            value={points}
            onChange={(e) => setPoints(Number(e.target.value))}
            className="border rounded px-2 py-2 mt-1"
          />
        </label>

        {/* ejecutar */}
        <button
          onClick={handleForecast}
          disabled={loading}
          className={`
            px-4 py-2 rounded text-white font-semibold transition
            ${
              loading
                ? "bg-green-300 animate-pulse"
                : "bg-green-600 hover:bg-green-700"
            }
          `}
        >
          {loading ? "Generando forecast..." : "Ejecutar forecast"}
        </button>

        {/* resultados */}
        {result && (
          <div className="bg-gray-50 border rounded p-3 overflow-auto max-h-80">
            <pre className="text-xs">
              {JSON.stringify(result.forecast, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
