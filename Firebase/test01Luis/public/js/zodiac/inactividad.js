(function () {
    const LIMITE_INACTIVIDAD = 3 * 60 * 1000; // 180000 ms = 3 minutes
    let temporizador = null;

    function cerrarSesionPorInactividad() {
        console.log("Cerrando sesion por inactividad...");
        // we use the "salir" function defined in users/islogin.js
       	if (typeof salir === "function") {
            alert("Su sesion ha sido cerrada por inactividad.");
            salir();
        } else if (window.firebase && firebase.auth) {
            // Plan B in case the "salir()" function does not exist in some context
            firebase.auth().signOut()
                .then(() => {
                    alert("Su sesion ha sido cerrada por inactividad.");
                    window.location.href = "index.html";
                })
                .catch((error) => {
                    console.error("Error al cerrar sesion por inactividad:", error);
                });
        } else {
            // Last resort: just redirect
            alert("Su sesion ha sido cerrada por inactividad.");
            window.location.href = "index.html";
        }
    }

    function reiniciarTemporizador() {
        // every time the user does something, we reset the countdown
        if (temporizador) {
            clearTimeout(temporizador);
        }
        temporizador = setTimeout(cerrarSesionPorInactividad, LIMITE_INACTIVIDAD);
    }

    function inicializarInactividad() {
        // start the timer for the first time
        reiniciarTemporizador();
        // any "movement" resets the countdown
        const eventos = ["click", "mousemove", "keydown", "scroll", "touchstart"];
        eventos.forEach((evento) => {
            document.addEventListener(evento, reiniciarTemporizador);
        });
    }

    // when the page finishes loading, we activate the inactivity control
    window.addEventListener("load", inicializarInactividad);
})();
