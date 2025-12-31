var db = firebase.apps[0].firestore();

const tabla = document.querySelector('#tabla');

db.collection("datosZodiaco")
    .orderBy('posic', 'asc')
    .get()
    .then(function (query) {
        let salida = "";

        query.forEach(function (doc) {
            const data = doc.data();
            const id = doc.id;

            salida += `
                <div class="divAnuncio m-3">
                    <div class="imgBlock">
                        <img src="${data.url}" alt="${data.signo}" width="100%" />
                    </div>
                    <div class="infoBlock">
                        <h5 class="signoTitulo">${data.posic}. ${data.signo}</h5>
                        <p class="mb-1"><strong>Elemento:</strong> ${data.elemento}</p>
                        <p class="mb-1"><strong>Astro Celeste:</strong> ${data.astroCelestial}</p>
                        <p class="mb-1"><strong>Piedra Preciosa:</strong> ${data.piedraPreciosa}</p>
                        <p class="mb-2"><strong>Rango de Fechas:</strong> ${data.rango}</p>

                        <button class="btn btn-sm btn-primary" onclick="editarSigno('${id}')">
                            Editar
                        </button>
                    </div>
                </div>
            `;
        });

        tabla.innerHTML = salida;
    })
    .catch(function (error) {
        console.error("Error al obtener signos:", error);
    });

function editarSigno(id) {
    window.location.href = `editar.html?id=${id}`;
}
