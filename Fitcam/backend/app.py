from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import joblib
import os
import tempfile
import pandas 
# 🔥 INICIALIZAR APP
app = Flask(__name__)
CORS(app)

# 🔥 CARGAR MODELOS
model = joblib.load("modelo.pkl")
scaler = joblib.load("scaler.pkl")

# 🔥 FUNCION ANGULO
def calcular_angulo(a, b, c):
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    cos = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    angulo = np.degrees(np.arccos(cos))

    return angulo

# 🔥 PROCESAR VIDEO
def procesar_video(path):
    import mediapipe as mp
    from mediapipe.tasks import python
    from mediapipe.tasks.python import vision

    cap = cv2.VideoCapture(path)
    datos = []

    base_options = python.BaseOptions(model_asset_path='pose_landmarker.task')
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.VIDEO
    )
    detector = vision.PoseLandmarker.create_from_options(options)

    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps == 0:
        fps = 30

    frame_id = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # saltar frames
        if frame_id % 2 != 0:
            frame_id += 1
            continue

        frame = cv2.resize(frame, (640, 480))
        frame = cv2.convertScaleAbs(frame, alpha=1.5, beta=20)

        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame)

        timestamp_ms = int((frame_id / fps) * 1000)
        result = detector.detect_for_video(mp_image, timestamp_ms)

        frame_id += 1

        if result.pose_landmarks:
            lm = result.pose_landmarks[0]

            hombro = [lm[11].x, lm[11].y]
            cadera = [lm[23].x, lm[23].y]
            rodilla = [lm[25].x, lm[25].y]
            tobillo = [lm[27].x, lm[27].y]
            pie = [lm[31].x, lm[31].y]

            ang_rodilla = calcular_angulo(cadera, rodilla, tobillo)
            ang_cadera = calcular_angulo(hombro, cadera, rodilla)
            ang_tobillo = calcular_angulo(rodilla, tobillo, pie)
            inclinacion = calcular_angulo(hombro, cadera, [cadera[0], cadera[1]+1])

            datos.append([ang_rodilla, ang_cadera, ang_tobillo, inclinacion])

    cap.release()

    return datos

# 🔥 RUTA API
@app.route("/analizar", methods=["POST"])
def analizar():
    if "video" not in request.files:
        return jsonify({"error": "No se envió video"}), 400

    file = request.files["video"]

    # guardar temporal
    temp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
    file.save(temp.name)

    datos = procesar_video(temp.name)

    if len(datos) == 0:
        return jsonify({
            "resultado": "error",
            "mensaje": "No se detectó cuerpo 😿"
        })

    import pandas as pd
    X = scaler.transform(pd.DataFrame(datos, columns=["rodilla","cadera","tobillo","espalda"]))
    pred = model.predict(X)

    # 🔥 decisión final
    resultado = int(np.round(np.mean(pred)))

    if resultado == 1:
        return jsonify({
            "resultado": "correcta",
            "mensaje": "🔥 Excelente técnica, sigue así!"
        })
    else:
        return jsonify({
            "resultado": "incorrecta",
            "mensaje": "💪 No te rindas, mejora tu postura!"
        })

# 🔥 RUN
if __name__ == "__main__":
    app.run(debug=True)