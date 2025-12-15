import pandas as pd
from pymongo import MongoClient
from sklearn.tree import DecisionTreeClassifier
import pickle

client = MongoClient("mongodb://localhost:27017/")
db = client["bombeiros_db"]
colecao = db["ocorrencias"]

dados = list(colecao.find({}, {"_id": 0}))
df = pd.DataFrame(dados)

X = df[["idade"]]
y = df["tipo"]

modelo = DecisionTreeClassifier()
modelo.fit(X, y)

pickle.dump(modelo, open("model.pkl", "wb"))
print("Modelo treinado com sucesso!")
