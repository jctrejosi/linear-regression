from flask import Blueprint
from scipy.stats import f
from gpt4all import GPT4All
from pandas.api.types import (
    is_numeric_dtype,
    is_bool_dtype
)
import pandas as pd
import numpy as np
import statsmodels.api as sm
from dotenv import load_dotenv
import os
from statsmodels.stats.outliers_influence import variance_inflation_factor
from statsmodels.stats.diagnostic import het_breuschpagan, het_white
from statsmodels.stats.stattools import durbin_watson, jarque_bera
from scipy.stats import shapiro, kstest

load_dotenv()
bp = Blueprint('bp', __name__)

def is_serial_by_sort(s, tol=0.99):
    s = s.dropna()
    if not pd.api.types.is_numeric_dtype(s):
        return False
    diffs = s.sort_values().diff().dropna()
    # fracción de diferencias iguales
    most_common_ratio = diffs.value_counts(normalize=True).max()
    return most_common_ratio >= tol

# Clasificación automática de columnas para saber cuáles no usar en la regresión
def classify_columns(df, dependent=None, max_categories=15):
    info = {
        "other": [],
        "categorical": [],
        "datetime": [],
        "boolean": [],
        "constant": [],
        "id_like": [],
        "invalid": [],
        "serial": [],
    }

    n_rows = len(df)

    for col in df.columns:
        if col == dependent:
            continue

        s = df[col]
        nunique = s.nunique(dropna=True)

        # 1) constante
        if nunique <= 1:
            info["constant"].append(col)
            continue

        # 2) booleanos
        if is_bool_dtype(s) or set(s.dropna().unique()).issubset({0, 1, "0", "1", True, False}):
            info["boolean"].append(col)
            continue

        # 3) Comprobar si es una serie
        if is_numeric_dtype(s):
            if nunique == n_rows and pd.api.types.is_integer_dtype(s):
                if is_serial_by_sort(s):
                    info["serial"] = info.get("serial", []) + [col]
                else:
                    info["id_like"].append(col)

        # 4) datetime SOLO si es texto
        if s.dtype == "object":
            parsed = pd.to_datetime(s.dropna(), dayfirst=True, errors="coerce")

            # además exigimos separadores típicos de fecha
            has_date_tokens = s.dropna().astype(str).str.contains(r"[./\-:]").mean()

            if (
                len(parsed) > 0
                and parsed.notna().mean() >= 0.8
                and has_date_tokens >= 0.8
            ):
                info["datetime"].append(col)
                continue

        # 5) categóricos
        if nunique <= max_categories:
            info["categorical"].append(col)
            continue

        # 6) otros

        info["other"].append(col)

    return info

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

def run_regression(data: list, columns: list, dependent: str, alpha: float = 0.05) -> dict:
    try:
        # ---------------------------------------------------
        # limpieza, validación automática de columnas
        # ---------------------------------------------------
        df_raw = pd.DataFrame(data, columns=columns)
        column_errors = {}         # detalles por columna (ejemplos/filas)
        meta = {
            "dropped_columns": [],   # columnas eliminadas automáticamente
            "auto_dummies": [],      # categóricas convertidas a dummies
            "warnings": [],          # avisos (e.g. dependent reasignado)
            "rows_before": len(df_raw),
            "rows_after": None,
            "imputed_columns": {},   # columnas imputadas: {col: {"mean":..., "count":...}}
        }

        # 1) Clasificar columnas y eliminar las innecesarias
        info = classify_columns(df_raw, dependent)
        drop_cols = info["datetime"] + info["id_like"] + info["constant"] + info["serial"] + ['id']
        meta["dropped_columns"] = drop_cols.copy()
        meta["warnings"].append(
            f"Columnas eliminadas por tipo: {', '.join(drop_cols)}"
        )
        df = df_raw.drop(columns=drop_cols, errors="ignore").copy()

        # 11) detectar columnas constantes resultantes y descartarlas
        constant_cols_after = [c for c in df.columns if df[c].nunique() <= 1]
        if constant_cols_after:
            df = df.drop(columns=constant_cols_after, errors="ignore")
            meta["dropped_columns"] += constant_cols_after
            meta["warnings"].append(
                f"Se quitaron columnas constantes tras limpieza: {', '.join(constant_cols_after)}"
            )

        # 7) descartar columnas con demasiados NaN parciales
        nan_ratio = df.isna().mean()
        PARTIAL_NAN_THRESHOLD = 0.10  # 10% de tolerancia para NaN parciales
        cols_with_too_many_nan = nan_ratio[nan_ratio > PARTIAL_NAN_THRESHOLD].index.tolist()
        if cols_with_too_many_nan:
            meta["dropped_columns"].extend(cols_with_too_many_nan)
            meta["warnings"].append(
                f"Columnas eliminadas por exceso de valores no numéricos (> {PARTIAL_NAN_THRESHOLD*100}% NaN): {cols_with_too_many_nan}"
            )
            df = df.drop(columns=cols_with_too_many_nan, errors="ignore")

        # 5) transformar categóricas a dummies y booleanos a 0/1 (si existen)
        cats_to_dummy = [c for c in info["categorical"] if c in df.columns]
        bool_cols = [c for c in info["boolean"] if c in df.columns]

        for col in cats_to_dummy:
            df[col] = df[col].fillna("missing")  # asigna missing a NaN antes de dummies

        if cats_to_dummy:
            df = pd.get_dummies(df, columns=cats_to_dummy, drop_first=True)  # aplicar dummies a categóricas

        for col in bool_cols:
            df[col] = df[col].map({True: 1, False: 0, "True": 1, "False": 0}) # Convertir booleanos a 0/1
            df[col] = df[col].fillna(0).astype(int)

        # Asegurarse de que los datos sean números luego de transformar dummies
        for col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        df = df.astype(float)

        meta["auto_dummies"] = cats_to_dummy.copy()

        # 8) en los valores NaN colocar la media de la columna (imputación)
        for col in df.columns:
            if df[col].isna().any():
                # calcular media sin NaN
                df[col] = df[col].astype(float) # asegurar float para la media
                mean_val = df[col].mean()
                if np.isnan(mean_val):
                    # si la media no se puede calcular (col vacía), se descartará más arriba
                    continue
                count_nan = int(df[col].isna().sum())
                df[col].fillna(mean_val, inplace=True)
                meta["imputed_columns"][col] = {"mean": float(mean_val), "count": count_nan}

        # 10) validar que quedan filas y columnas suficientes
        meta["rows_after"] = len(df)

        MIN_OBS = 5
        if df.columns.size < 2:
            return {
                "ok": False,
                "error": "No quedaron columnas utilizables después de la limpieza.",
                "details": column_errors,
                "meta": meta
            }

        if len(df) < MIN_OBS:
            return {
                "ok": False,
                "error": f"Se requieren al menos {MIN_OBS} observaciones después de la limpieza.",
                "n_after_clean": len(df),
                "meta": meta,
                "details": column_errors
            }

        # 13) determinar variable dependiente final
        dependent_col = dependent if dependent in df.columns else df.columns[0]
        if dependent_col not in df.columns:
            return {
                "ok": False,
                "error": "No se pudo determinar una variable dependiente válida tras la limpieza.",
                "meta": meta,
                "details": column_errors
            }

        # 14) construir y, X desde df_valid (ya limpio y con imputaciones)
        df_valid = df.copy()
        y = df_valid[dependent_col]
        X = df_valid.drop(columns=[dependent_col])

        if X.shape[1] == 0:
            return {
                "ok": False,
                "error": "No quedaron variables independientes después de la limpieza.",
                "meta": meta,
                "details": column_errors
            }

        # ============================================================
        # 9. agregar constante y ajustar modelo
        # ============================================================
        X_const = sm.add_constant(X)
        model = sm.OLS(y, X_const).fit()

        # Métricas principales
        r2, r2_adj = model.rsquared, model.rsquared_adj
        f_stat, f_pvalue = model.fvalue, model.f_pvalue

        # Tabla ANOVA
        resultados_anova = run_anova(data)

        grupos = resultados_anova["grupos"]

        # Verificación: asegurarse de que cada grupo tiene al menos 2 datos
        if any(len(grupo) < 2 for grupo in grupos):
            return {"error": "Cada grupo debe tener al menos dos valores."}

        # Aplicar ANOVA
        k_groups = len(columns)
        f_statistic = resultados_anova["msb"]/resultados_anova["mse"]
        df_between = k_groups - 1
        df_within = resultados_anova["n_data"] - k_groups
        p_value = 1 - f.cdf(f_statistic, df_between, df_within)

        # Conclusión
        conclusion_anova = (
            "Se rechaza la hipótesis nula: hay diferencias significativas entre los grupos."
            if p_value < alpha else
            "No se rechaza la hipótesis nula: no hay diferencias significativas entre los grupos."
        )

        # Tabla ANOVA
        try:
            anova_tbl = sm.stats.anova_lm(model)
            anova = {
                idx: {
                    "df": float(row["df"]),
                    "sum_sq": float(row["sum_sq"]),
                    "mean_sq": float(row["mean_sq"]),
                    "F": float(row.get("F", np.nan)),
                    "PR(>F)": float(row.get("PR(>F)", np.nan))
                }
                for idx, row in anova_tbl.iterrows()
            }
        except Exception as e:
            anova = {"error": "No se pudo calcular tabla ANOVA", "detalle": str(e)}

        resid = model.resid

        # Normalidad
        sw_stat, sw_p = shapiro(resid)
        ks_stat, ks_p = kstest((resid - resid.mean()) / resid.std(ddof=1), 'norm')
        jb_stat, jb_p, jb_skew, jb_kurt = jarque_bera(resid)

        # Heterocedasticidad
        bp_test = het_breuschpagan(resid, X_const)
        try:
            white_test = het_white(resid, X_const)
            white_result = {
                "stat": round(white_test[0], 4),
                "p_value": round(white_test[1], 4),
                "f_stat": round(white_test[2], 4),
                "f_p_value": round(white_test[3], 4)
            }
        except Exception:
            white_result = {
                "error": "No se pudo calcular la prueba de White (posible colinealidad exacta)."
            }

        # Durbin-Watson
        dw = durbin_watson(resid)

        # VIF
        vif = []
        for i, col in enumerate(X_const.columns):
            if col == 'const':
                continue
            vif_value = variance_inflation_factor(X_const.values, i)
            vif.append({"variable": col, "VIF": float(vif_value)})

        # Coeficientes
        coefs = [{
            "variable": var,
            "coef": float(model.params[var]),
            "p_value": float(model.pvalues[var])
        } for var in model.params.index]

        # Cook's distance y otros valores diagnósticos
        influence = model.get_influence()
        summary_frame = influence.summary_frame()

        results_table = pd.DataFrame({
            "id": df.index,
            "Y_observado": model.model.endog,
            "Y_predicho": model.fittedvalues,
            "Residuo": model.resid,
            "Residuo_estandarizado": summary_frame["standard_resid"],
            "Leverage": summary_frame["hat_diag"],
            "Cooks_distance": summary_frame["cooks_d"],
            "Outlier": np.abs(summary_frame["standard_resid"]) > 2
        })

        # Conclusión global
        conclusion = (
            "Rechazamos H0: el modelo es significativo"
            if f_pvalue < alpha else
            "No rechazamos H0: el modelo no es significativo"
        )

        # Cadena de coeficientes y VIF para el prompt
        coefs_str = "\n".join([
            f"{c['variable']}\t{c['coef']}\t{c['p_value']}"
            for c in coefs
        ])
        vif_str = "\n".join([
            f"{v['variable']}\t{v['VIF']}"
            for v in vif
        ])

        # Prompt para la IA
        prompt = f"""
Eres un experto en estadística. Analiza los coeficientes de la regresión que te paso y da una interpretación clara:

Variable	Coeiciente	Valor p
{coefs_str}

Para cada variable, indica:
1. Si es estadísticamente significativa.
2. El efecto que tiene sobre la variable dependiente.
3. Sugerencias para mejorar el modelo si alguna variable no es significativa.

"""

        # Consultar a una IA
        model_path = "C:/Users/jctre/AppData/Local/nomic.ai/GPT4All/Llama-3.2-1B-Instruct-Q4_0.gguf"
        # cargar modelo sin intentar descargar
        model_ia = GPT4All(model_path, allow_download=False)
        ia_response = model_ia.generate(prompt)

        return {
            "ok": True,
            "meta": meta,
            "n_obs": int(model.nobs),
            "n_vars": int(len(model.params) - 1),
            "r2": round(r2, 4),
            "r2_adj": round(r2_adj, 4),
            "f_statistic": round(f_stat, 4),
            "f_pvalue": round(f_pvalue, 4),
            "anova": anova,
            "coefs": coefs,
            "dependent_variable": dependent_col,
            "normality": {
                "shapiro_p": round(sw_p, 4),
                "ks_p": round(ks_p, 4),
                "jarque_bera_p": round(jb_p, 4),
                "skewness": round(jb_skew, 4),
                "kurtosis": round(jb_kurt, 4)
            },
            "breusch_pagan": {
                "LM_p": round(bp_test[1], 4),
                "F_p": round(bp_test[3], 4)
            },
            "white_test": white_result,
            "durbin_watson": round(dw, 4),
            "vif": vif,
            "conclusion": conclusion,
            "interpretacion": ia_response,
            "results_table": results_table.round(4).to_dict(orient="records"),
            "anova": {
                "ok": True,
                "n_data": resultados_anova["n_data"],
                "k_groups": k_groups,
                "f_statistics": round(f_statistic, 2),
                "means": [round(x, 2) for x in resultados_anova["medias"]],
                "global_mean": round(resultados_anova["media_global"], 2),
                "p_value": round(p_value, 2),
                "conclusion": conclusion_anova,
                "sse":  [round(x, 2) for x in resultados_anova["sse"]],
                "ssb": [round(x, 2) for x in resultados_anova["ssb"]],
                "sse_string": resultados_anova["sse_string"],
                "ssb_string": resultados_anova["ssb_string"],
                "ssb_total": round(resultados_anova["ssb_total"], 2),
                "sse_total": round(resultados_anova["sse_total"],2),
                "mse": round(resultados_anova["mse"], 2),
                "msb": round(resultados_anova["msb"], 2)
            }
        }

    except Exception as e:
        import traceback
        return {
            "ok": False,
            "meta": meta,
            "error": str(e),
            "trace": traceback.format_exc()
        }
