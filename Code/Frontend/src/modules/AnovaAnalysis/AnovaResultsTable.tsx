import type { TableFile } from "@/@types";
import type { AnovaResult } from "@/services/anova_analysis";

type Props = {
  result: AnovaResult | null;
  data: TableFile | undefined;
};

export const AnovaResultsTable = ({ result, data }: Props) => {
  if (!result || !data) {
    return <p className="text-gray-500">No hay resultados para mostrar.</p>;
  }

  // Transponer data.data (filas → columnas)
  const numColumns = data.columns.length;
  const columnas: (string | number | null)[][] = Array.from(
    { length: numColumns },
    () => []
  );

  data.data.forEach((fila) => {
    fila.forEach((valor, colIndex) => {
      columnas[colIndex].push(valor);
    });
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 divide-y divide-gray-200 rounded-lg">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
              Variable
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
              Datos de la variable
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
              Media
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
              SSE
            </th>
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
              SSB
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {columnas.map((colData, colIndex) => {
            const grupo = data.columns[colIndex];
            const valores = colData.filter((v) => v !== null && v !== "") as (
              | string
              | number
            )[];
            const valoresStr = valores.map((v) => v.toString()).join(", ");
            const media = result.means[colIndex];
            const sse = result.sse[colIndex];
            const ssb = result.ssb[colIndex];
            const sse_str = result.sse_string[colIndex];
            const ssb_str = result.ssb_string[colIndex];

            return (
              <tr key={colIndex} className="hover:bg-gray-50 transition">
                <td className="px-4 py-2 text-sm text-gray-700">{grupo}</td>
                <td className="px-4 py-2 text-sm text-gray-700 max-w-xs overflow-x-auto whitespace-nowrap">
                  {valoresStr}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700">
                  {media !== undefined ? media.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700" title={sse_str}>
                  {sse}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700" title={ssb_str}>
                  {ssb}
                </td>
              </tr>
            );
          })}
          <tr className="bg-gray-50 font-semibold">
            <td className="px-4 py-2">Total / Global</td>
            <td className="px-4 py-2"></td>
            <td className="px-4 py-2">{result.global_mean}</td>
            <td className="px-4 py-2">{result.sse_total}</td>
            <td className="px-4 py-2">{result.ssb_total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
