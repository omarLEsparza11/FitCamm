let stream;
let mediaRecorder;
let chunks = [];

// 📤 ENVIAR VIDEO AL BACKEND
async function subirVideo(file) {
    const formData = new FormData();
    formData.append("video", file);

    const res = await fetch("http://localhost:5000/analizar", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    // 🔥 mostrar resultado
    document.getElementById("frase").innerText = data.mensaje;

    if (data.resultado === "correcta") {
        document.getElementById("resultado").innerText = "✅ Correcta";
        document.getElementById("resultado").style.color = "green";
    } else {
        document.getElementById("resultado").innerText = "❌ Incorrecta";
        document.getElementById("resultado").style.color = "red";
    }
}

// 📁 SUBIR VIDEO DESDE PC
function enviarArchivo(){
    const file = document.getElementById("fileInput").files[0];
    if(!file){
        alert("Selecciona un video");
        return;
    }
    subirVideo(file);
}

// ENCENDER CAMARA
function activarCamara(){
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(s => {
        stream = s;
        document.getElementById("video").srcObject = stream;
    })
    .catch(err => {
        alert("Error al acceder a la cámara");
    });
}

// APAGAR CAMARA
function apagarCamara(){
    if(stream){
        stream.getTracks().forEach(track => track.stop());
        document.getElementById("video").srcObject = null;
    }
}

// GRABAR
function grabar(){
    if(!stream){
        alert("Primero enciende la cámara");
        return;
    }

    chunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
        chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/mp4" });
        chunks = [];

        // 🔥 EN VEZ DE DESCARGAR → ANALIZAR
        subirVideo(blob);
    };

    mediaRecorder.start();
}

// DETENER
function detener(){
    if(mediaRecorder){
        mediaRecorder.stop();
    }
}