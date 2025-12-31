var db = firebase.apps[0].firestore();
var container = firebase.apps[0].storage().ref();

const txtPosic = document.querySelector('#txtPosic');
const txtRango = document.querySelector('#txtRango');
const txtArchi = document.querySelector('#txtArchi');
const selElemento = document.querySelector('#selElemento');
const selSigno = document.querySelector('#selSigno');
const selAstroCelestial = document.querySelector('#selAstroCelestial');
const selPiedraPreciosa = document.querySelector('#selPiedraPreciosa');
const btnLoad = document.querySelector('#btnLoad');

const metadataPorSigno = {
    "Aries": { posic: 1, rango: "21 de marzo – 19 de abril" },
    "Tauro": { posic: 2, rango: "20 de abril – 20 de mayo" },
    "Geminis": { posic: 3, rango: "21 de mayo – 20 de junio" },
    "Cancer": { posic: 4, rango: "21 de junio – 22 de julio" },
    "Leo": { posic: 5, rango: "23 de julio – 22 de agosto" },
    "Virgo": { posic: 6, rango: "23 de agosto – 22 de septiembre" },
    "Libra": { posic: 7, rango: "23 de septiembre – 22 de octubre" },
    "Escorpio": { posic: 8, rango: "23 de octubre – 21 de noviembre" },
    "Sagitario": { posic: 9, rango: "22 de noviembre – 21 de diciembre" },
    "Capricornio": { posic: 10, rango: "22 de diciembre – 19 de enero" },
    "Acuario": { posic: 11, rango: "20 de enero – 18 de febrero" },
    "Piscis": { posic: 12, rango: "19 de febrero – 20 de marzo" }
};

const signosPorElemento = {
    "Fuego": ["Aries", "Leo", "Sagitario"],
    "Tierra": ["Tauro", "Virgo", "Capricornio"],
    "Aire": ["Geminis", "Libra", "Acuario"],
    "Agua": ["Cancer", "Escorpio", "Piscis"]
};

const astrosPorSigno = {
    "Aries": ["Marte"],
    "Tauro": ["Venus"],
    "Geminis": ["Mercurio"],
    "Cancer": ["Luna"],
    "Leo": ["Sol"],
    "Virgo": ["Mercurio"],
    "Libra": ["Venus"],
    "Escorpio": ["Marte", "Pluton"],
    "Sagitario": ["Jupiter"],
    "Capricornio": ["Saturno"],
    "Acuario": ["Saturno", "Urano"],
    "Piscis": ["Jupiter", "Neptuno"]
};

const piedrasPorSigno = {
    "Aries": ["Jaspe rojo", "Rubi", "Granate", "Diamante"],
    "Tauro": ["Cuarzo rosa", "Esmeralda", "Zafiro"],
    "Geminis": ["Agata", "Zafiro", "Topacio"],
    "Cancer": ["Piedra luna", "Esmeralda", "Perlas"],
    "Leo": ["Ojo de tigre", "Peridoto", "Citrino"],
    "Virgo": ["Amazonita", "Cornalina", "Ambar"],
    "Libra": ["Lapislazuli", "Opalo", "Turmalina rosa"],
    "Escorpio": ["Obsidiana", "Berilo", "Coral"],
    "Sagitario": ["Amatista", "Topacio"],
    "Capricornio": ["Onix", "Granate"],
    "Acuario": ["Turquesa", "Amatista", "Fluorita"],
    "Piscis": ["Aguamarina", "Amatista"]
};

// function to fill a select element with options

function llenarSelect(select, opciones, textoInicial) {
    select.innerHTML = "";
    const optDefault = document.createElement("option");
    optDefault.value = "";
    optDefault.textContent = textoInicial;
    select.appendChild(optDefault);

    opciones.forEach(valor => {
        const opt = document.createElement("option");
        opt.value = valor;
        opt.textContent = valor;
        select.appendChild(opt);
    });
}

// when the element changes, we fill the signs

selElemento.addEventListener('change', function () {
    const elemento = selElemento.value;

    if (!elemento) {
        llenarSelect(selSigno, [], "Seleccione primero un elemento...");
        selSigno.disabled = true;

        llenarSelect(selAstroCelestial, [], "Seleccione primero un signo...");
        selAstroCelestial.disabled = true;

        llenarSelect(selPiedraPreciosa, [], "Seleccione primero un signo...");
        selPiedraPreciosa.disabled = true;

        return;
    }

    const signos = signosPorElemento[elemento] || [];
    llenarSelect(selSigno, signos, "Seleccione un signo...");
    selSigno.disabled = false;

    llenarSelect(selAstroCelestial, [], "Seleccione primero un signo...");
    selAstroCelestial.disabled = true;

    llenarSelect(selPiedraPreciosa, [], "Seleccione primero un signo...");
    selPiedraPreciosa.disabled = true;
});

// when the sign changes, we fill astro and stones

selSigno.addEventListener('change', function () {
    const signo = selSigno.value;

    if (!signo) {
        llenarSelect(selAstroCelestial, [], "Seleccione primero un signo...");
        selAstroCelestial.disabled = true;

        llenarSelect(selPiedraPreciosa, [], "Seleccione primero un signo...");
        selPiedraPreciosa.disabled = true;

        txtPosic.value = "";
        txtRango.value = "";
        return;
    }

    const astros = astrosPorSigno[signo] || [];
    llenarSelect(selAstroCelestial, astros, "Seleccione un astro...");
    selAstroCelestial.disabled = astros.length === 0;

    const piedras = piedrasPorSigno[signo] || [];
    llenarSelect(selPiedraPreciosa, piedras, "Seleccione una piedra...");
    selPiedraPreciosa.disabled = piedras.length === 0;

    const meta = metadataPorSigno[signo];
    if (meta) {
        txtPosic.value = meta.posic;
        txtRango.value = meta.rango;
    } else {
        txtPosic.value = "";
        txtRango.value = "";
    }
});

// insert Button

btnLoad.addEventListener('click', function () {
    const archivo = txtArchi.files[0];

    const posic = parseInt(txtPosic.value);
    const rango = txtRango.value.trim();
    const elemento = selElemento.value;
    const signo = selSigno.value;
    const astroCelestial = selAstroCelestial.value;
    const piedraPreciosa = selPiedraPreciosa.value;

    if (!archivo) {
        alert('Debe seleccionar una imagen');
        return;
    }

    if (isNaN(posic) || !rango || !elemento || !signo || !astroCelestial || !piedraPreciosa) {
        alert('Debe completar todos los campos antes de insertar');
        return;
    }

    const nomarch = archivo.name;
    const metadata = {
        contentType: archivo.type
    };

    const subir = container.child('zodiaco/' + nomarch).put(archivo, metadata);
    subir
        .then(snapshot => snapshot.ref.getDownloadURL())
        .then(url => {
            return db.collection("datosZodiaco").add({
                "posic": posic,
                "signo": signo,
                "rango": rango,
                "elemento": elemento,
                "astroCelestial": astroCelestial,
                "piedraPreciosa": piedraPreciosa,
                "url": url
            });
        })
        .then(function (docRef) {
            alert("ID del registro: " + docRef.id);
            limpiar();
        })
        .catch(function (FirebaseError) {
            alert("Error al subir la imagen: " + FirebaseError);
        });
});

function limpiar() {
    txtPosic.value = '';
    txtRango.value = '';
    txtArchi.value = '';

    selElemento.value = '';
    llenarSelect(selSigno, [], "Seleccione primero un elemento...");
    selSigno.disabled = true;

    llenarSelect(selAstroCelestial, [], "Seleccione primero un signo...");
    selAstroCelestial.disabled = true;

    llenarSelect(selPiedraPreciosa, [], "Seleccione primero un signo...");
    selPiedraPreciosa.disabled = true;

    txtPosic.focus();
}
