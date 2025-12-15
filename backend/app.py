from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime, timedelta
import random
import pickle
import os
import pandas as pd

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

LOCAIS = [
    "Centro",
    "Zona Norte",
    "Zona Sul"
]


def gerar_dados(n=30):
    dados = []
    hoje = datetime.now()

    for _ in range(n):
        hora = random.randint(0, 23)
        minuto = random.randint(0, 59)

        dados.append({
            "data": (hoje - timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d"),
            "tipo": random.choice(TIPOS_CASOS),
            "local": random.choice(LOCAIS),
            "horario": f"{hora:02d}:{minuto:02d}"
        })

    return dados

if colecao.count_documents({}) == 0:
    colecao.insert_many(gerar_dados())

@app.route("/api/casos")
def listar_casos():
    return jsonify(list(colecao.find({}, {"_id": 0})))

@app.route("/api/opcoes")
def opcoes():
    return jsonify({
        "tipos": TIPOS_CASOS,
        "locais": LOCAIS
    })

@app.route("/api/predizer", methods=["POST"])
def predizer():
    if not os.path.exists("model.pkl"):
        return jsonify({"erro": "Modelo não treinado"}), 500

    modelo = pickle.load(open("model.pkl", "rb"))
    dados = request.json

    df = pd.DataFrame([dados])
    previsao = modelo.predict(df)[0]

    return jsonify({"previsao": previsao})

if __name__ == "__main__":
    app.run(debug=True)

