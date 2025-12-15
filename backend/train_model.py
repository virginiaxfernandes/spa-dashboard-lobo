import pandas as pd
from pymongo import MongoClient
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
import pickle

MONGO_URI = "mongodb+srv://virginiaxfernandes:2225@meu-banco.7vhz77c.mongodb.net/bombeiros_db?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client["bombeiros_db"]
colecao = db["ocorrencias"]

dados = list(colecao.find({}, {"_id": 0}))
df = pd.DataFrame(dados)

df["hora"] = df["horario"].str.split(":").str[0].astype(int)

X = df[["local", "hora"]]
y = df["tipo"]

preprocessador = ColumnTransformer(
    transformers=[
        ("local", OneHotEncoder(), ["local"])
    ],
    remainder="passthrough"
)

modelo = Pipeline(steps=[
    ("preprocessador", preprocessador),
    ("classificador", RandomForestClassifier(
        n_estimators=100,
        random_state=42
    ))
])

modelo.fit(X, y)

with open("model.pkl", "wb") as f:
    pickle.dump(modelo, f)

print("Modelo treinado e salvo com sucesso!")
