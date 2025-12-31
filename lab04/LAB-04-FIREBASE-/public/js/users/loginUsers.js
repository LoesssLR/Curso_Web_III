// login.js - Script para inicio de sesión (Fusionado)

// Escucha principal
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado, inicializando login...');

    // ================== INICIALIZAR FIREBASE ==================
    const auth = firebase.auth();
    const db = firebase.firestore();

    const loginForm = document.getElementById('loginForm');

    // Verificar que el formulario existe
    if (!loginForm) {
        console.error('Formulario no encontrado. Verifica el ID del formulario.');
        console.log('IDs de formularios disponibles:',
            Array.from(document.querySelectorAll('form')).map(form => form.id)
        );
        return;
    }

    const emailInput        = document.getElementById('email');
    const passwordInput     = document.getElementById('password');
    const togglePassword    = document.getElementById('togglePassword');
    const emailError        = document.getElementById('emailError');
    const passwordError     = document.getElementById('passwordError');
    const alertSuccess      = document.getElementById('alertSuccess');
    const alertError        = document.getElementById('alertError');
    const errorMessageLabel = document.getElementById('errorMessage');

    // ================== TOGGLE PASSWORD VISIBILITY ==================
    function togglePasswordVisibility(input, toggle) {
        if (!input || !toggle) {
            console.warn('Input o toggle no encontrados para password visibility');
            return;
        }

        toggle.addEventListener('click', function() {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);

            // Soporta tanto <button><i class="fa-eye"></i></button> como botón directo
            const icon = this.querySelector('i') || this;
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    if (passwordInput && togglePassword) {
        togglePasswordVisibility(passwordInput, togglePassword);
        console.log('Toggle de contraseña inicializado');
    }

    // ================== VALIDACIÓN EN TIEMPO REAL ==================
    function validateField(field, validationFunction, errorElement) {
        if (!field || !errorElement) {
            console.warn('Campo o elemento de error no encontrado para validación');
            return;
        }

        field.addEventListener('blur', function() {
            const isValid = validationFunction(this.value);

            if (!isValid && this.value) {
                errorElement.style.display = 'block';
                this.classList.add('is-invalid');
            } else {
                errorElement.style.display = 'none';
                this.classList.remove('is-invalid');

                if (isValid && this.value) {
                    this.classList.add('is-valid');
                } else {
                    this.classList.remove('is-valid');
                }
            }
        });
    }

    // ================== FUNCIONES DE VALIDACIÓN ==================
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function validatePassword(password) {
        // Para login mínimo 6, como Firebase
        return password.length >= 6;
    }

    // Aplicar validaciones si existen
    if (emailInput && emailError) {
        validateField(emailInput, validateEmail, emailError);
        console.log('Validación de email inicializada');
    }

    if (passwordInput && passwordError) {
        validateField(passwordInput, validatePassword, passwordError);
        console.log('Validación de password inicializada');
    }

    // ================== ENVÍO DEL FORMULARIO (LOGIN CON FIREBASE) ==================
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('Formulario enviado');

        // Ocultar alertas previas
        if (alertSuccess) {
            alertSuccess.style.display = 'none';
            alertSuccess.classList.remove('show');
        }
        if (alertError) {
            alertError.style.display = 'none';
            alertError.classList.remove('show');
        }
        if (errorMessageLabel) {
            errorMessageLabel.textContent = '';
        }

        const email    = emailInput ? emailInput.value : '';
        const password = passwordInput ? passwordInput.value : '';

        console.log('Datos del formulario:', { email, passwordLength: password.length });

        let isValid = true;

        // Validar email
        if (!validateEmail(email)) {
            if (emailError && emailInput) {
                emailError.style.display = 'block';
                emailInput.classList.add('is-invalid');
            }
            isValid = false;
            console.log('Email inválido');
        }

        // Validar password
        if (!validatePassword(password)) {
            if (passwordError && passwordInput) {
                passwordError.style.display = 'block';
                passwordInput.classList.add('is-invalid');
            }
            isValid = false;
            console.log('Password inválido');
        }

        if (isValid) {
            console.log('Formulario válido, procediendo con login...');

            // Mostrar loading en botón
            const submitBtn   = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : '';

            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
                submitBtn.disabled = true;
            }

            try {
                console.log('Intentando autenticar con Firebase...');
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;

                console.log('Usuario autenticado:', user.email);

                // Traer datos adicionales desde Firestore
                try {
                    const userDoc = await db.collection("userData")
                        .where("idemp", "==", user.uid)
                        .limit(1)
                        .get();

                    let userName = "Usuario";
                    if (!userDoc.empty) {
                        const userData = userDoc.docs[0].data();
                        userName = userData.userName || "Usuario";

                        // Guardar en localStorage
                        localStorage.setItem('userName', userName);
                        localStorage.setItem('userEmail', user.email);
                        localStorage.setItem('userId', user.uid);
                    }

                    console.log('Datos del usuario cargados:', userName);
                } catch (firestoreError) {
                    console.warn('Error al cargar datos de Firestore:', firestoreError);
                    // Continuamos aunque falle Firestore
                }

                // Mostrar éxito
                if (alertSuccess) {
                    alertSuccess.style.display = 'block';
                    alertSuccess.classList.add('show'); // del segundo snippet
                }

                console.log('Login exitoso, redirigiendo...');

                setTimeout(function() {
                    window.location.href = 'index.html'; // o 'catalog.html', según tu flujo
                }, 2000);

            } catch (error) {
                console.error('Error en inicio de sesión:', error);

                let errorMessage = 'Error al iniciar sesión. ';

                switch (error.code) {
                    case 'auth/invalid-email':
                        errorMessage += 'El correo electrónico no es válido.';
                        break;
                    case 'auth/user-disabled':
                        errorMessage += 'Esta cuenta ha sido deshabilitada.';
                        break;
                    case 'auth/user-not-found':
                        errorMessage += 'No existe una cuenta con este correo electrónico.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage += 'La contraseña es incorrecta.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage += 'Demasiados intentos fallidos. Intenta más tarde.';
                        break;
                    case 'auth/network-request-failed':
                        errorMessage += 'Error de conexión. Verifica tu internet.';
                        break;
                    default:
                        errorMessage += error.message;
                }

                if (alertError && errorMessageLabel) {
                    errorMessageLabel.textContent = errorMessage;
                    alertError.style.display = 'block';
                    alertError.classList.add('show');
                }

            } finally {
                // Restaurar botón
                if (submitBtn) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            }
        } else {
            // Mostrar mensaje genérico de error de validación
            if (alertError && errorMessageLabel) {
                errorMessageLabel.textContent = 'Por favor, corrige los errores en el formulario.';
                alertError.style.display = 'block';
                alertError.classList.add('show');
            }

            // Quitar clase show después de un rato (como el segundo snippet)
            if (alertError) {
                setTimeout(() => {
                    alertError.classList.remove('show');
                }, 3000);
            }
        }
    });

    // ================== LIMPIAR VALIDACIONES AL ESCRIBIR ==================
    const inputs = loginForm.querySelectorAll('input');
    console.log('Inputs encontrados en el formulario:', inputs.length);

    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const errorElement = document.getElementById(`${this.id}Error`);
            if (errorElement) {
                errorElement.style.display = 'none';
            }
            this.classList.remove('is-invalid');
        });
    });

    // Extra: real-time validation estilo ".form-input" (del segundo snippet)
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                this.classList.remove('is-invalid');
            }
        });
    });

    // ================== SESIÓN ACTIVA (AUTO REDIRECT) ==================
    auth.onAuthStateChanged(function(user) {
        if (user) {
            console.log('Usuario ya autenticado:', user.email);
            // Si quieres que si ya está logueado lo mande al catálogo:
            window.location.href = 'catalog.html';
        } else {
            console.log('No hay usuario autenticado');
        }
    });

    // ================== RECUPERAR CONTRASEÑA ==================
    function recoverPassword(email) {
        return auth.sendPasswordResetEmail(email)
            .then(() => {
                alert('Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.');
            })
            .catch((error) => {
                console.error('Error al enviar correo de recuperación:', error);
                let errorMsg = 'Error al enviar correo de recuperación. ';
                if (error.code === 'auth/user-not-found') {
                    errorMsg += 'No existe una cuenta con este correo electrónico.';
                } else {
                    errorMsg += error.message;
                }
                alert(errorMsg);
            });
    }

    const forgotPasswordLink = document.getElementById('forgotPassword');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            const email = emailInput ? emailInput.value : '';
            if (email && validateEmail(email)) {
                recoverPassword(email);
            } else {
                const recoveryEmail = prompt('Por favor ingresa tu correo electrónico para recuperar tu contraseña:');
                if (recoveryEmail && validateEmail(recoveryEmail)) {
                    recoverPassword(recoveryEmail);
                } else {
                    alert('Por favor ingresa un correo electrónico válido.');
                }
            }
        });
    }

    // ================== SOCIAL LOGIN HANDLERS (del segundo snippet) ==================
    const googleLoginBtn   = document.getElementById('googleLogin');
    const facebookLoginBtn = document.getElementById('facebookLogin');
    const githubLoginBtn   = document.getElementById('githubLogin');

    if (googleLoginBtn) {
        googleLoginBtn.addEventListener('click', function() {
            console.log('Login con Google (placeholder)');
            // Aquí iría la lógica de Firebase Auth con Google
            // const provider = new firebase.auth.GoogleAuthProvider();
            // auth.signInWithPopup(provider)...
        });
    }

    if (facebookLoginBtn) {
        facebookLoginBtn.addEventListener('click', function() {
            console.log('Login con Facebook (placeholder)');
            // Aquí iría la lógica de Firebase Auth con Facebook
            // const provider = new firebase.auth.FacebookAuthProvider();
            // auth.signInWithPopup(provider)...
        });
    }

    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', function() {
            console.log('Login con GitHub (placeholder)');
            // Aquí iría la lógica de Firebase Auth con GitHub
            // const provider = new firebase.auth.GithubAuthProvider();
            // auth.signInWithPopup(provider)...
        });
    }
});

// ================== FUNCIONES GLOBALES PARA OTRAS PÁGINAS ==================
function logout() {
    if (typeof firebase !== 'undefined') {
        firebase.auth().signOut().then(() => {
            // Limpiar localStorage
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userId');

            // Redirigir al login
            window.location.href = 'login.html';
        }).catch((error) => {
            console.error('Error al cerrar sesión:', error);
        });
    }
}

function checkAuth() {
    return new Promise((resolve, reject) => {
        if (typeof firebase !== 'undefined') {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    resolve(user);
                } else {
                    reject(new Error('Usuario no autenticado'));
                    window.location.href = 'login.html';
                }
            });
        } else {
            reject(new Error('Firebase no está disponible'));
        }
    });
}
