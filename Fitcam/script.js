let stream;
let mediaRecorder;
let chunks = [];

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
        const url = URL.createObjectURL(blob);

        let a = document.createElement("a");
        a.href = url;
        a.download = "video_fitcam.mp4";
        a.click();
    };

    mediaRecorder.start();
}

// DETENER GRABACION
function detener(){
    if(mediaRecorder){
        mediaRecorder.stop();
    }
}