// JavaScript Document
// create local database firestore variable
var db = firebase.apps[0].firestore();
var auth = firebase.apps[0].auth();

// create local from webpage inputs
const txtEmail = document.querySelector('#txtEmail');
const txtContra = document.querySelector('#txtContra');

// create local insert button
const btnLogin = document.querySelector('#btnLogin');

// function to format datetime for display
function formatDateTime(date) {
	if (!date) return 'N/A';
	const options = { 
		year: 'numeric', 
		month: '2-digit', 
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit'
	};
	return new Intl.DateTimeFormat('es-ES', options).format(date);
}

// assign button listener
btnLogin.addEventListener('click', function () {
	auth.signInWithEmailAndPassword(txtEmail.value, txtContra.value)
		.then((userCredential) => {
			const user = userCredential.user;
			const fechaAcceso = new Date();
			db.collection("datosUsuarios").where('idemp', '==', user.uid).get()
				.then(function (docRef) {
					docRef.forEach(function (doc){
						doc.ref.update({ultAcceso: fechaAcceso}).then(function (){
							console.log("Último acceso registrado: " + formatDateTime(fechaAcceso));
							document.location.href = 'index.html';
						});
					});
				})
				.catch(function (FirebaseError) {
					var mensaje = "Error adding document: " + FirebaseError
					alert(mensaje);
				});
		})
		.catch((error) => {
			var mensaje = "Error user access: " + error.message;
			alert(mensaje);
		});
});
