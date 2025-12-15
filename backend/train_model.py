import pandas as pd
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier
import pickle

dados = [
    {"local": "Centro", "horario": "14:30", "tipo": "Acidente de Trânsito"},
    {"local": "Zona Norte", "horario": "08:15", "tipo": "Incêndio"},
    {"local": "Zona Sul", "horario": "19:40", "tipo": "Resgate"},
    {"local": "Zona Sul", "horario": "06:05", "tipo": "Enchente"},
    {"local": "Centro", "horario": "22:10", "tipo": "Acidente doméstico"}
]

df = pd.DataFrame(dados)

df['horario_minutos'] = df['horario'].apply(
    lambda x: int(x.split(':')[0]) * 60 + int(x.split(':')[1])
)

le_local = LabelEncoder()
le_tipo = LabelEncoder()

df['local_enc'] = le_local.fit_transform(df['local'])
y = le_tipo.fit_transform(df['tipo'])

X = df[['local_enc', 'horario_minutos']]

modelo = XGBClassifier(
    n_estimators=100,
    max_depth=4,
    learning_rate=0.1,
    objective='multi:softmax',
    eval_metric='mlogloss',
    random_state=42
)

modelo.fit(X, y)

with open("model.pkl", "wb") as f:
    pickle.dump({
        "modelo": modelo,
        "le_local": le_local,
        "le_tipo": le_tipo,
        "feature_names": ['Local', 'Horário'],
        "importancias": modelo.feature_importances_.tolist()
    }, f)

print(" Modelo XGBoost treinado e salvo com sucesso!")
