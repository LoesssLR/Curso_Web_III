let loginAttempts = 0;
const maxAttempts = 3;

document.addEventListener('DOMContentLoaded', () => {
    // ====== Inicializar Firebase (ya debes tener el script de Firebase incluido antes) ======
    const auth = firebase.auth();
    const db   = firebase.firestore();

    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput  = document.getElementById('password');

    const form           = document.getElementById('loginForm');
    const employeeIdInput = document.getElementById('employeeId');

    const alertSuccess   = document.getElementById('alertSuccess');
    const alertError     = document.getElementById('alertError');
    const alertWarning   = document.getElementById('alertWarning');
    const errorMessage   = document.getElementById('errorMessage');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function() {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    }

    // ====== Form validation + login ======
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        let isValid = true;

        // Limpia alerts previos
        if (alertSuccess) {
            alertSuccess.classList.remove('show');
            alertSuccess.style.display = 'none';
        }
        if (alertError) {
            alertError.classList.remove('show');
            alertError.style.display = 'none';
        }
        if (alertWarning) {
            alertWarning.classList.remove('show');
            alertWarning.style.display = 'none';
        }
        if (errorMessage) {
            errorMessage.textContent = '';
        }
        
        // Employee ID / Email validation
        const emailOrEmp = employeeIdInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const empIdRegex = /^EMP-\d+$/i;
        
        if (
            !emailRegex.test(emailOrEmp) &&
            !empIdRegex.test(emailOrEmp) &&
            emailOrEmp.length < 3
        ) {
            employeeIdInput.classList.add('is-invalid');
            isValid = false;
        } else {
            employeeIdInput.classList.remove('is-invalid');
            employeeIdInput.classList.add('is-valid');
        }
        
        // Password validation
        const password = passwordInput;
        if (password.value.trim() === '') {
            password.classList.add('is-invalid');
            isValid = false;
        } else {
            password.classList.remove('is-invalid');
            password.classList.add('is-valid');
        }
        
        if (!isValid) {
            manejarIntentoFallido();
            return;
        }

        // Aquí empieza el login real contra Firebase
        try {
            const identifier = emailOrEmp;
            const pwd = password.value.trim();
            let emailToUse = null;

            // 1) Si lo que escribió parece email → usamos directamente ese email
            if (emailRegex.test(identifier)) {
                emailToUse = identifier;
            } else {
                // 2) Si parece employeeId → buscar el correo en la colección "employees"
                const snapshot = await db
                    .collection('employees')
                    .where('employeeId', '==', identifier)
                    .limit(1)
                    .get();

                if (snapshot.empty) {
                    throw new Error('Empleado no encontrado');
                }

                const empData = snapshot.docs[0].data();
                emailToUse = empData.email;

                if (!emailToUse) {
                    throw new Error('El empleado no tiene correo configurado.');
                }
            }

            // Mostrar loading en botón
            const btn = form.querySelector('.btn-submit') || form.querySelector('button[type="submit"]');
            const originalText = btn ? btn.innerHTML : '';
            if (btn) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
                btn.disabled = true;
            }

            // LOGIN con Firebase Auth
            const userCredential = await auth.signInWithEmailAndPassword(emailToUse, pwd);
            const user = userCredential.user;

            console.log('Login exitoso de:', user.email);

            // Opcional: cargar info extra del empleado
            // (por ejemplo, para guardar nombre/rol en localStorage)
            try {
                const empSnap = await db
                    .collection('employees')
                    .where('email', '==', emailToUse)
                    .limit(1)
                    .get();

                if (!empSnap.empty) {
                    const empData = empSnap.docs[0].data();
                    localStorage.setItem('employeeName', empData.name || '');
                    localStorage.setItem('employeeId',   empData.employeeId || '');
                    localStorage.setItem('employeeRole', empData.role || '');
                }
            } catch (errInfo) {
                console.warn('No se pudo cargar info extra del empleado:', errInfo);
            }

            // Reset de intentos fallidos
            loginAttempts = 0;

            if (alertSuccess) {
                alertSuccess.style.display = 'block';
                alertSuccess.classList.add('show');
            }

            setTimeout(() => {
                console.log('Redirigiendo...');
                // Cambia esto por la página que quieras:
                window.location.href = 'products.html';
            }, 1500);

            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }

        } catch (err) {
            console.error('Error de login:', err);
            manejarIntentoFallido(err);
        }
    });

    function manejarIntentoFallido(err) {
        loginAttempts++;

        let msg = 'Credenciales inválidas. Intenta nuevamente.';
        if (err && err.code) {
            switch (err.code) {
                case 'auth/invalid-email':
                    msg = 'El correo no es válido.';
                    break;
                case 'auth/user-not-found':
                    msg = 'No existe un usuario con esas credenciales.';
                    break;
                case 'auth/wrong-password':
                    msg = 'La contraseña es incorrecta.';
                    break;
                case 'auth/too-many-requests':
                    msg = 'Demasiados intentos fallidos. Intenta más tarde.';
                    break;
                default:
                    msg = err.message || msg;
            }
        } else if (err && err.message) {
            msg = err.message;
        }

        if (errorMessage) {
            errorMessage.textContent = msg;
        }

        if (loginAttempts >= maxAttempts - 1 && alertWarning) {
            alertWarning.classList.add('show');
            setTimeout(() => {
                alertWarning.classList.remove('show');
            }, 5000);
        } else if (alertError) {
            alertError.classList.add('show');
            setTimeout(() => {
                alertError.classList.remove('show');
            }, 3000);
        }

        if (loginAttempts >= maxAttempts) {
            if (errorMessage) {
                errorMessage.textContent = '❌ Cuenta bloqueada temporalmente por seguridad. Contacta a IT.';
            }
            const btn = form.querySelector('.btn-submit') || form.querySelector('button[type="submit"]');
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            }
        }
    }

    // Real-time validation + animaciones
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', function() {
            if (this.classList.contains('is-invalid')) {
                this.classList.remove('is-invalid');
            }
        });
        
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
            this.parentElement.style.transition = 'transform 0.2s';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });

    // Keyboard shortcut for quick access (Alt + L)
    document.addEventListener('keydown', function(e) {
        if (e.altKey && e.key === 'l') {
            employeeIdInput.focus();
        }
    });
});
