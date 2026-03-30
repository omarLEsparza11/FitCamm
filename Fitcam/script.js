let stream;
let mediaRecorder;
let chunks = [];

// CAMARA
function activarCamara(){
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(s => {
        stream = s;
        document.getElementById("video").srcObject = stream;
    });
}

function apagarCamara(){
    if(stream){
        stream.getTracks().forEach(track => track.stop());
        document.getElementById("video").srcObject = null;
    }
}

// GRABAR
function grabar(){
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
        chunks.push(e.data);
    };

    mediaRecorder.start();
}

// DETENER Y ENVIAR
function detener(){
    mediaRecorder.stop();

    mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "video/mp4" });

        enviarVideo(blob);
    };
}

// SUBIR ARCHIVO
function subirVideo(){
    const file = document.getElementById("fileInput").files[0];
    enviarVideo(file);
}

// ENVIAR AL BACKEND
async function enviarVideo(videoFile){
    const formData = new FormData();
    formData.append("video", videoFile);

    const res = await fetch("http://localhost:5000/analizar", {
        method: "POST",
        body: formData
    });

    const data = await res.json();

    document.getElementById("resultado").textContent = data.resultado;
    document.getElementById("frase").textContent = data.mensaje;
}