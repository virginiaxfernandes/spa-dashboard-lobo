from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
import random
import pickle
import os
import pandas as pd

from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

app = Flask(__name__)
CORS(app)

MONGO_URI = "mongodb+srv://virginiaxfernandes:2225@meu-banco.7vhz77c.mongodb.net/bombeiros_db?retryWrites=true&w=majority"

client = MongoClient(MONGO_URI)
db = client["bombeiros_db"]
colecao = db["ocorrencias"]

TIPOS_CASOS = [
    "Incêndio",
    "Resgate",
    "Acidente de Trânsito",
    "Enchente",
    "Acidente doméstico"
]

LOCAIS = ["Centro", "Zona Norte", "Zona Sul", "Zona Leste", "Zona Oeste"]
REGIOES = ["Urbana", "Rural", "Residencial"]

MODEL_PATH = "model.pkl"

def gerar_dados(n=50):
    dados = []
    hoje = datetime.now()

    for _ in range(n):
        hora = random.randint(0, 23)
        minuto = random.randint(0, 59)

        dados.append({
            "data": (hoje - timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d"),
            "tipo": random.choice(TIPOS_CASOS),
            "local": random.choice(LOCAIS),
            "horario": f"{hora:02d}:{minuto:02d}",
            "regiao": random.choice(REGIOES)
        })

    return dados


def popular_banco():
    if colecao.count_documents({}) == 0:
        colecao.insert_many(gerar_dados(50))


popular_banco()

def horario_para_minutos(horario):
    h, m = horario.split(":")
    return int(h) * 60 + int(m)


def carregar_modelo():
    if not os.path.exists(MODEL_PATH):
        return None
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)


def treinar_modelo():
    dados = list(colecao.find({}, {"_id": 0}))

    if len(dados) < 10:
        print("Dados insuficientes para treinar o modelo")
        return

    df = pd.DataFrame(dados)

    df["horario_min"] = df["horario"].apply(horario_para_minutos)

    le_local = LabelEncoder()
    le_tipo = LabelEncoder()

    df["local_enc"] = le_local.fit_transform(df["local"])
    df["tipo_enc"] = le_tipo.fit_transform(df["tipo"])

    X = df[["local_enc", "horario_min"]]
    y = df["tipo_enc"]

    modelo = XGBClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        objective="multi:softmax",
        eval_metric="mlogloss",
        random_state=42
    )

    modelo.fit(X, y)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump({
            "modelo": modelo,
            "le_local": le_local,
            "le_tipo": le_tipo,
            "importancias": modelo.feature_importances_.tolist(),
            "feature_names": ["Local", "Horário"]
        }, f)

    print(" Modelo treinado e salvo com sucesso!")


if not os.path.exists(MODEL_PATH):
    treinar_modelo()

@app.route("/api/opcoes")
def opcoes():
    return jsonify({
        "tipos": TIPOS_CASOS,
        "locais": LOCAIS,
        "regioes": REGIOES
    })


@app.route("/api/casos", methods=["GET"])
def listar_casos():
    query = {}

    data_inicio = request.args.get("data_inicio")
    data_fim = request.args.get("data_fim")
    local = request.args.get("cidade")
    tipo = request.args.get("tipo")

    if data_inicio and data_fim:
        query["data"] = {"$gte": data_inicio, "$lte": data_fim}

    if local:
        query["local"] = local

    if tipo:
        query["tipo"] = tipo

    casos = list(colecao.find(query, {"_id": 0}))
    return jsonify(casos)


@app.route("/api/casos", methods=["POST"])
def criar_caso():
    dados = request.json

    campos = ["data", "horario", "local", "tipo"]
    if not all(c in dados for c in campos):
        return jsonify({"erro": "Campos obrigatórios: data, horario, local, tipo"}), 400

    dados["regiao"] = random.choice(REGIOES)
    colecao.insert_one(dados)

    return jsonify({"mensagem": "Ocorrência cadastrada com sucesso!"}), 201


@app.route("/api/estatisticas")
def estatisticas():
    casos = list(colecao.find({}, {"_id": 0}))

    contagem_tipos = {}
    contagem_regioes = {}

    for c in casos:
        contagem_tipos[c["tipo"]] = contagem_tipos.get(c["tipo"], 0) + 1
        contagem_regioes[c["regiao"]] = contagem_regioes.get(c["regiao"], 0) + 1

    modelo_data = carregar_modelo()

    return jsonify({
        "tipos": contagem_tipos,
        "regioes": contagem_regioes,
        "importancia": {
            "nomes": modelo_data["feature_names"],
            "valores": modelo_data["importancias"]
        }
    })


@app.route("/api/predizer", methods=["POST"])
def predizer():
    modelo_data = carregar_modelo()
    if not modelo_data:
        return jsonify({"erro": "Modelo não encontrado"}), 500

    dados = request.json

    if not all(k in dados for k in ["local", "horario"]):
        return jsonify({"erro": "Informe local e horário"}), 400

    local_enc = modelo_data["le_local"].transform([dados["local"]])[0]
    horario_min = horario_para_minutos(dados["horario"])

    X = [[local_enc, horario_min]]
    pred = modelo_data["modelo"].predict(X)[0]

    tipo_previsto = modelo_data["le_tipo"].inverse_transform([pred])[0]

    return jsonify({
        "previsao": tipo_previsto,
        "importancia": modelo_data["importancias"]
    })


if __name__ == "__main__":
    app.run(debug=True)
