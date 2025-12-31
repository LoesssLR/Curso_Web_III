// JavaScript Document
// create local database firestore variable
var db = firebase.apps[0].firestore();
var auth = firebase.apps[0].auth();

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    const alertSuccess = document.getElementById('alertSuccess');
    const alertError = document.getElementById('alertError');
    
    // ========= TOGGLE PASSWORD VISIBILITY (ya lo tenías, lo mantenemos) =========
    function togglePasswordVisibility(input, toggle) {
        if (!input || !toggle) return;
        
        toggle.addEventListener('click', function() {
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Si el toggle tiene un <i> dentro, usamos las clases de FontAwesome
            const icon = this.querySelector('i') || this;
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }
    
    togglePasswordVisibility(passwordInput, togglePassword);
    togglePasswordVisibility(confirmPasswordInput, toggleConfirmPassword);
    
    // ========= PASSWORD STRENGTH (tu barra + strengthBar/strengthText del otro código) =========
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        let strengthPercent = 0;
        
        // Verificar longitud
        if (password.length >= 8) strengthPercent += 25;
        
        // Verificar letras mayúsculas y minúsculas
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strengthPercent += 25;
        
        // Verificar números
        if (/\d/.test(password)) strengthPercent += 25;
        
        // Verificar caracteres especiales
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strengthPercent += 25;
        
        // ---- Tu barra original (#passwordStrength) ----
        if (passwordStrength) {
            passwordStrength.style.width = strengthPercent + '%';
            
            if (strengthPercent < 50) {
                passwordStrength.style.backgroundColor = '#ff3333';
            } else if (strengthPercent < 75) {
                passwordStrength.style.backgroundColor = '#ffa500';
            } else {
                passwordStrength.style.backgroundColor = '#4bb543';
            }
        }

        // ---- NUEVO: soporte para strengthBar + strengthText (segundo código) ----
        const strengthBar = document.getElementById('strengthBar');
        const strengthText = document.getElementById('strengthText');

        if (strengthBar && strengthText) {
            // Convertimos el porcentaje en un valor de 0–4
            let strength = 0;
            if (password.length >= 8) strength++;
            if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
            if (password.match(/[0-9]/)) strength++;
            if (password.match(/[^a-zA-Z0-9]/)) strength++;

            // Reset de clases
            strengthBar.className = 'strength-bar';

            if (strength === 0) {
                strengthText.textContent = '';
            } else if (strength <= 2) {
                strengthBar.classList.add('strength-weak');
                strengthText.textContent = 'Débil';
                strengthText.style.color = '#dc3545';
            } else if (strength === 3) {
                strengthBar.classList.add('strength-medium');
                strengthText.textContent = 'Media';
                strengthText.style.color = '#ffc107';
            } else {
                strengthBar.classList.add('strength-strong');
                strengthText.textContent = 'Fuerte';
                strengthText.style.color = '#28a745';
            }
        }
    });
    
    // ========= FUNCIONES DE VALIDACIÓN =========
    function validateField(field, validationFunction, errorElement) {
        if (!field) return;

        field.addEventListener('blur', function() {
            const isValid = validationFunction(this.value);
            
            if (!isValid && this.value) {
                if (errorElement) errorElement.style.display = 'block';
                this.classList.add('is-invalid');
            } else {
                if (errorElement) errorElement.style.display = 'none';
                this.classList.remove('is-invalid');
                
                if (isValid && this.value) {
                    this.classList.add('is-valid');
                } else {
                    this.classList.remove('is-valid');
                }
            }
        });
    }
    
    function validateName(name) {
        return name.trim().length >= 2;
    }
    
    function validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function validatePassword(password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
        return passwordRegex.test(password);
    }
    
    function validateConfirmPassword(confirmPassword) {
        return confirmPassword === passwordInput.value;
    }
    
    // Aplicar validaciones a campos
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');

    validateField(nameInput, validateName, document.getElementById('nameError'));
    validateField(emailInput, validateEmail, document.getElementById('emailError'));
    validateField(passwordInput, validatePassword, document.getElementById('passwordError'));
    validateField(confirmPasswordInput, validateConfirmPassword, document.getElementById('confirmPasswordError'));
    
    // ========= SUBMIT DEL FORMULARIO (mantengo tu lógica con Firebase) =========
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Ocultar alertas previas
        alertSuccess.style.display = 'none';
        alertError.style.display = 'none';
        
        // Validar todos los campos
        const name = nameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const terms = document.getElementById('terms').checked;
        
        let isValid = true;
        
        if (!validateName(name)) {
            document.getElementById('nameError').style.display = 'block';
            nameInput.classList.add('is-invalid');
            isValid = false;
        }
        
        if (!validateEmail(email)) {
            document.getElementById('emailError').style.display = 'block';
            emailInput.classList.add('is-invalid');
            isValid = false;
        }
        
        if (!validatePassword(password)) {
            document.getElementById('passwordError').style.display = 'block';
            passwordInput.classList.add('is-invalid');
            isValid = false;
        }
        
        if (!validateConfirmPassword(confirmPassword)) {
            document.getElementById('confirmPasswordError').style.display = 'block';
            confirmPasswordInput.classList.add('is-invalid');
            isValid = false;
        }
        
        if (!terms) {
            const termsError = document.getElementById('termsError');
            if (termsError) termsError.style.display = 'block';
            isValid = false;
        }
        
        if (isValid) {
            // Mostrar loading state
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
            submitBtn.disabled = true;
            
            try {
                // Crear usuario con Firebase Auth
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Guardar datos adicionales en Firestore
                await db.collection("userData").add({
                    "idemp": user.uid,
                    "userName": name,
                    "email": email,
                    "creationDate": new Date()
                });
                
                // Mostrar mensaje de éxito
                alertSuccess.style.display = 'block';
                document.getElementById('errorMessage').textContent = '';
                
                // Redireccionar después de 2 segundos
                setTimeout(function() {
                    window.location.href = 'catalog.html';
                }, 2000);
                
            } catch (error) {
                console.error('Error en registro:', error);
                
                let errorMessage = 'Error al crear la cuenta. ';
                
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage += 'El correo electrónico ya está en uso.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage += 'El correo electrónico no es válido.';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMessage += 'La operación no está permitida.';
                        break;
                    case 'auth/weak-password':
                        errorMessage += 'La contraseña es demasiado débil.';
                        break;
                    default:
                        errorMessage += error.message;
                }
                
                document.getElementById('errorMessage').textContent = errorMessage;
                alertError.style.display = 'block';
            } finally {
                // Restaurar botón
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        } else {
            // Mostrar mensaje de error de validación
            document.getElementById('errorMessage').textContent = 'Por favor, corrige los errores en el formulario.';
            alertError.style.display = 'block';
        }
    });
    
    // ========= LIMPIAR ERRORES AL ESCRIBIR =========
    const inputs = registerForm.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            const errorElement = document.getElementById(`${this.id}Error`);
            if (errorElement) {
                errorElement.style.display = 'none';
                this.classList.remove('is-invalid');
            }
        });
    });

    // ========= EXTRA: Real-time validación tipo "form-input" del segundo snippet =========
    // (Solo si en tu HTML usas la clase .form-input, esto no afecta lo demás)
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                this.classList.add('is-valid');
            }
        });
    });
});

// ========= FUNCIÓN LIMPIAR =========
function limpiar(){
    document.getElementById('name').value = "";
    document.getElementById('email').value = "";
    document.getElementById('password').value = "";
    document.getElementById('confirmPassword').value = "";
    document.getElementById('terms').checked = false;
    
    // Limpiar estados de validación
    const inputs = document.querySelectorAll('.form-control, .form-input');
    inputs.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });
    
    const errorMessages = document.querySelectorAll('.validation-error');
    errorMessages.forEach(error => {
        error.style.display = 'none';
    });
    
    // Resetear barra de fortaleza de contraseña
    const passwordStrength = document.getElementById('passwordStrength');
    if (passwordStrength) passwordStrength.style.width = '0%';

    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    if (strengthBar && strengthText) {
        strengthBar.className = 'strength-bar';
        strengthText.textContent = '';
    }
}
