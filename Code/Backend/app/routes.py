from flask import Blueprint, request, jsonify
from .handlers.file_converter import file_converter
from .handlers.anova_analysis import anova_analysis
from .handlers.lineal_regresion import run_regression

bp = Blueprint('main', __name__)

@bp.route('/api/v1.0/converter_file', methods=['POST'])
def converter_file():
    if 'file' not in request.files:
        return jsonify({"error": "No se recibió ningún archivo"}), 400

    file = request.files['file']

    try:
        result = file_converter(file)
        response = jsonify(result)
        return response, 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/api/v1.0/anova', methods=['POST'])
def anova():
    data = request.get_json()

    if not data or 'data' not in data or 'columns' not in data:
        return jsonify({"error": "Datos insuficientes para el análisis ANOVA"}), 400

    try:
        resultado = anova_analysis(data['data'], data['columns'])
        status_code = 200 if resultado.get("ok") else 400
        return jsonify(resultado), status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route('/api/v1.0/regression', methods=['POST'])
def lineal_regression():
    payload = request.get_json()

    if not payload or 'data' not in payload or 'columns' not in payload or 'dependent' not in payload:
        return jsonify({"ok": False, "error": "Debe enviar 'data', 'columns' y 'dependent' en el cuerpo"}), 400

    result = run_regression(payload['data'], payload['columns'], payload['dependent'])
    return jsonify(result), 200 if result.get("ok") else 400

