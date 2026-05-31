import json
import numpy as np
import tensorflow as tf

from flask import Flask
from flask import request
from flask import jsonify

from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.preprocessing.text import tokenizer_from_json

app = Flask(__name__)

import os
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../models/inventory_classifier.keras")
TOKENIZER_PATH = os.path.join(BASE_DIR, "../models/tokenizer.json")
CLASS_NAMES_PATH = os.path.join(BASE_DIR, "../models/class_names.json")

MAX_LENGTH = 32

print("[AI] Loading model...")
model = tf.keras.models.load_model(
    MODEL_PATH
)

print("[AI] Loading tokenizer...")
with open(
    TOKENIZER_PATH,
    "r",
    encoding="utf-8"
) as f:
    raw = f.read()
    parsed = json.loads(raw)
    # parse double guard
    if isinstance(parsed, str):
        tokenizer = tokenizer_from_json(parsed)
    else:
        tokenizer = tokenizer_from_json(raw)

print("AI Loading class names...")
with open(
    CLASS_NAMES_PATH,
    "r",
    encoding="utf-8"
) as f:

    class_names = json.load(f)

print("[AI] Ready")


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok"
    })


@app.route("/predict", methods=["POST"])
def predict():

    data = request.get_json()

    text = data.get(
        "text",
        ""
    )

    sequence = tokenizer.texts_to_sequences(
        [text]
    )

    padded = pad_sequences(
        sequence,
        maxlen=MAX_LENGTH,
        padding="post",
        truncating="post"
    )

    prediction = model.predict(
        padded,
        verbose=0
    )

    predicted_index = int(
        np.argmax(prediction)
    )

    confidence = float(
        np.max(prediction)
    )

    intent = class_names[
        predicted_index
    ]

    return jsonify({
        "intent": intent,
        "confidence": confidence
    })


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=False
    )