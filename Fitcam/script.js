let stream;
let mediaRecorder;
let chunks = [];

//  CONTADOR
let tiempo = 0;
let intervalo;

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
        enviarVideo(blob);

        //  detener contador
        clearInterval(intervalo);
        document.getElementById("estadoGrabacion").textContent = "";
    };

    mediaRecorder.start();

    //  INICIAR CONTADOR
    tiempo = 0;
    document.getElementById("estadoGrabacion").textContent = " Grabando...";
    
    intervalo = setInterval(() => {
        tiempo++;
        document.getElementById("tiempoGrabacion").textContent = "Tiempo: " + tiempo + " s";
    }, 1000);
}

// DETENER GRABACION
function detener(){
    if(mediaRecorder){
        mediaRecorder.stop();
    }
}

// SUBIR VIDEO
function subirVideo(){
    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];

    if(!file){
        alert("Selecciona un video");
        return;
    }

    enviarVideo(file);
}

//  ENVIAR AL BACKEND
function enviarVideo(video){
    let formData = new FormData();
    formData.append("video", video);

    fetch("http://127.0.0.1:5000/analizar", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        let resultado = document.getElementById("resultado");
        let frase = document.getElementById("frase");

        resultado.textContent = data.resultado;
        frase.textContent = data.mensaje;

        //  COLOR
        if(data.resultado.toLowerCase() === "correcta"){
            resultado.style.color = "lime";
        } else {
            resultado.style.color = "red";
        }
    })
    .catch(err => {
        alert("Error al analizar el video");
        console.error(err);
    });
}

//  RESET
function resetear(){
    document.getElementById("resultado").textContent = "";
    document.getElementById("frase").textContent = "";
    document.getElementById("fileInput").value = "";
    document.getElementById("estadoGrabacion").textContent = "";
    document.getElementById("tiempoGrabacion").textContent = "";

    clearInterval(intervalo);

    if(stream){
        stream.getTracks().forEach(track => track.stop());
        document.getElementById("video").srcObject = null;
    }

    alert("Listo para otro intento ");
}