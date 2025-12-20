import numpy as np
from scipy.stats import f

def run_anova(data):
    # Transponer filas en columnas
    columnas = list(zip(*data))

    datos_limpios = []
    medias = []
    total_valores = 0

    for columna in columnas:
        limpios = []

        for valor in columna:
            if valor is None:
                continue

            try:
                num = float(valor)
                limpios.append(num)
            except (ValueError, TypeError):
                continue

        if limpios:
            datos_limpios.append(limpios)
            total_valores += len(limpios)
            media = sum(limpios) / len(limpios)
            medias.append(media)

    media_global = np.mean([m for m in medias if m is not None])

    # Cálculo de SSB y SSE por grupo
    ssb_strings = []
    sse_strings = []
    ssb = []
    sse = []

    for i, grupo in enumerate(datos_limpios):
        ni = len(grupo)
        media_i = medias[i]

        # === SSB ===
        ssb_val = ni * (media_i - media_global) ** 2
        ssb.append(ssb_val)
        ssb_str = f"{ni} × ({media_i} - {round(media_global, 3)})² = {round(ssb_val, 2)}"
        ssb_strings.append(ssb_str)

        # === SSE ===
        sse_val = 0
        sse_terms = []

        for x in grupo:
            term = (x - media_i) ** 2
            sse_val += term
            sse_terms.append(f"({x} - {media_i})²")

        sse_str = f" + ".join(sse_terms) + f" = {round(sse_val, 2)}"
        sse.append(round(sse_val, 2))
        sse_strings.append(sse_str)

        sum_ssb = sum(ssb)
        sum_sse = sum(sse)

        msb = sum_ssb/(len(columnas) - 1)
        mse = sum_sse/(total_valores - len(columnas))

    return {
        "n_data": total_valores,
        "grupos": datos_limpios,
        "medias": medias,
        "media_global": media_global,
        "ssb_string": ssb_strings,
        "sse_string": sse_strings,
        "sse_total": sum_sse,
        "ssb_total": sum_ssb,
        "ssb": ssb,
        "sse": sse,
        "msb": msb,
        "mse": mse
    }


def anova_analysis(data, columns, alpha=0.05):
    """
    Realiza un análisis ANOVA de un solo factor.

    Args:
        data (list of list): Datos numéricos organizados por filas.
        columns (list): Nombres de los grupos o métodos.
        alpha (float): Nivel de significancia, por defecto 0.05.

    Returns:
        dict: Diccionario con estadísticas ANOVA, p-valor y conclusión.
    """

    # Limpiar los datos: convertir a float y eliminar NaN y strings vacíos
    resultados = run_anova(data)

    grupos = resultados["grupos"]

    # Verificación: asegurarse de que cada grupo tiene al menos 2 datos
    if any(len(grupo) < 2 for grupo in grupos):
        return {"error": "Cada grupo debe tener al menos dos valores."}

    # Aplicar ANOVA
    k_groups = len(columns)
    f_statistic = resultados["msb"]/resultados["mse"]
    df_between = k_groups - 1
    df_within = resultados["n_data"] - k_groups
    p_value = 1 - f.cdf(f_statistic, df_between, df_within)

    # Conclusión
    conclusion = (
        "Se rechaza la hipótesis nula: hay diferencias significativas entre los grupos."
        if p_value < alpha else
        "No se rechaza la hipótesis nula: no hay diferencias significativas entre los grupos."
    )

    return {
        "ok": True,
        "n_data": resultados["n_data"],
        "k_groups": k_groups,
        "f_statistics": round(f_statistic, 2),
        "means": [round(x, 2) for x in resultados["medias"]],
        "global_mean": round(resultados["media_global"], 2),
        "p_value": round(p_value, 2),
        "conclusion": conclusion,
        "sse":  [round(x, 2) for x in resultados["sse"]],
        "ssb": [round(x, 2) for x in resultados["ssb"]],
        "sse_string": resultados["sse_string"],
        "ssb_string": resultados["ssb_string"],
        "ssb_total": round(resultados["ssb_total"], 2),
        "sse_total": round(resultados["sse_total"],2),
        "mse": round(resultados["mse"], 2),
        "msb": round(resultados["msb"], 2)
    }
