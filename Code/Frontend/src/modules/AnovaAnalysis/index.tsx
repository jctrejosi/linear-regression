import type { TableFile } from "@/@types";
import { useState } from "react";

import { anova_analysis, type AnovaResult } from "@/services/anova_analysis";
import { AnovaResultsTable } from "./AnovaResultsTable";

type props = {
  data: TableFile | undefined;
};

export const AnovaAnalysis = ({ data }: props) => {
  const [view, setView] = useState<boolean>(false);
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
    <div>
      <button onClick={handleSend}>Análisis ANOVA</button>
      {view && result.ok && (
        <>
          <h1>Resultados del Análisis ANOVA (one-way)</h1>
          <p>H0: Las medias de los tres métodos son iguales.</p>
          <p>H1: Al menos una media es diferente.</p>
          <p>Total de grupos: 𝑘 = {result.k_groups}</p>
          <p>Total de datos: 𝑁 = {result.n_data}</p>
          <AnovaResultsTable data={data} result={result} />
          <p>df(entre) = 𝑘 - 1 = {result.k_groups - 1}</p>
          <p>df(dentro) = 𝑁 - 𝑘 = {result.n_data - result.k_groups}</p>
          <p>{result?.conclusion}</p>
          <p>
            MSB = SSB/de(entre) = {result.ssb_total}/({result.k_groups} - 1) ={" "}
            {result.msb}
          </p>
          <p>
            MSE = SSE/de(dentro) = {result.sse_total}/({result.n_data} -{" "}
            {result.k_groups}) = {result.mse}
          </p>
          <p>Estadístico F = MSB/MSE = {result?.f_statistics}</p>
          <p>Valor p: {result?.p_value}</p>
        </>
      )}
      {result?.error && <p>Error: {result.error}</p>}
    </div>
  );
};
