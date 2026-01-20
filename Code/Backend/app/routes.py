import math
from flask import Blueprint, request, jsonify
from .handlers.file_converter import file_converter
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

def clean_nan_values(obj):
    """Reemplaza NaN, Infinity y -Infinity por None o valores válidos"""
    if isinstance(obj, float):
        if math.isnan(obj):
            return None
        if math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: clean_nan_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_values(item) for item in obj]
    else:
        return obj

@bp.route('/api/v1.0/regression', methods=['POST'])
def lineal_regression():
    payload = request.get_json()

    if not payload or 'data' not in payload or 'columns' not in payload or 'dependent' not in payload:
        return jsonify({"ok": False, "error": "Debe enviar 'data', 'columns' y 'dependent' en la petición"}), 400

    result = run_regression(payload['data'], payload['columns'], payload['dependent'])
    cleaned_result = clean_nan_values(result)

    return jsonify(cleaned_result), 200 if result.get("ok") else 400

@bp.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "regresion-backend"
    }), 200
