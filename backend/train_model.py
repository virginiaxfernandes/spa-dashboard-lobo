from pymongo import MongoClient
import pandas as pd
import pickle
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

MONGO_URI = "mongodb+srv://virginiaxfernandes:2225@meu-banco.7vhz77c.mongodb.net/bombeiros_db?retryWrites=true&w=majority"
client = MongoClient(MONGO_URI)
db = client["bombeiros_db"]
colecao = db["ocorrencias"]

dados = list(colecao.find({}, {"_id": 0}))

if not dados:
    raise Exception("Banco de dados vazio. Gere dados antes de treinar.")

df = pd.DataFrame(dados)

df = df[["local", "horario", "minuto", "tipo"]]

y = df["tipo"]

le_local = LabelEncoder()
le_tipo = LabelEncoder()

df["local"] = le_local.fit_transform(df["local"])
y = le_tipo.fit_transform(y)

X = df[["local", "horario", "minuto"]]

modelo = XGBClassifier(
    n_estimators=100,
    max_depth=4,
    learning_rate=0.1,
    objective="multi:softprob",
    eval_metric="mlogloss",
    random_state=42
)

modelo.fit(X, y)

with open("model.pkl", "wb") as f:
    pickle.dump({
        "modelo": modelo,
        "le_local": le_local,
        "le_tipo": le_tipo,
        "features": X.columns.tolist()
    }, f)

print("Modelo XGBoost treinado e salvo com sucesso!")