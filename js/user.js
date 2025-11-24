function getUsers() {
    const usersJSON = localStorage.getItem('majestyUsers');
    try {
        return usersJSON ? JSON.parse(usersJSON) : [];
    } catch (e) {
        console.error("Error al parsear usuarios de localStorage:", e);
        return [];
    }
}



 
function saveUsers(users) {
    localStorage.setItem('majestyUsers', JSON.stringify(users));
}


/**
 * Verifica si un email ya está registrado.
 * @param {string} email - El email a verificar.
 * @returns {boolean} True si el email existe, False en caso contrario.
 */
function isEmailRegistered(email) {
    const users = getUsers();
    return users.some(user => user.email === email);
}



function validateEmailFormat(email) {
    let regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}



function setError(input, message) {
    let errorDiv = input.parentElement.querySelector('.error-msg');


    // Buscar el error-msg en los elementos contiguos o dentro del padre.
    if (!errorDiv) {
         // Intenta buscar el error-msg más cercano al input
         let currentElement = input.nextElementSibling;
         while (currentElement) {
             if (currentElement.classList.contains('error-msg')) {
                 errorDiv = currentElement;
                 break;
             }
             currentElement = currentElement.nextElementSibling;
         }
    }
   
    if (errorDiv) {
        errorDiv.textContent = message;
    } else {
        console.warn(`No se encontró contenedor de error (.error-msg) para: ${input.id}`);
    }
   
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
}


function setSuccess(input) {

    const errorDiv = input.parentElement.querySelector('.error-msg');
    if (errorDiv) {
        errorDiv.textContent = "";
    }


    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
}

function displayFeedback(container, type, message) {
    container.innerHTML = `
        <div class="alert alert-${type}" role="alert">
            ${message}
        </div>
    `;
}




function handleRegistration() {
    const form = document.querySelector("#registerForm");
    if (!form) return; 
   
    const nameInput = document.querySelector("#name");
    const lastNameInput = document.querySelector("#lastName");
    const emailInput = document.querySelector("#email");
    const passwordInput = document.querySelector("#password");
    const repeatPasswordInput = document.querySelector("#repeatPassword");
    const termsCheck = document.querySelector("#termsCheck");
    const registrationFeedback = document.querySelector("#registrationFeedback");


    form.addEventListener("submit", (e) => {
        e.preventDefault();
        let valid = true;

        registrationFeedback.innerHTML = '';
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
        document.querySelectorAll(".error-msg").forEach(msg => msg.textContent = "");
       
        const name = nameInput.value.trim();
        const lastName = lastNameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const repeatPassword = repeatPasswordInput.value;
        const termsAccepted = termsCheck.checked;

        if (name === "") { setError(nameInput, "El nombre es obligatorio."); valid = false; } else { setSuccess(nameInput); }
        if (lastName === "") { setError(lastNameInput, "El apellido es obligatorio."); valid = false; } else { setSuccess(lastNameInput); }

        if (email === "") {
            setError(emailInput, "El email es obligatorio.");
            valid = false;
        } else if (!validateEmailFormat(email)) {
            setError(emailInput, "El email no es válido.");
            valid = false;
        } else if (isEmailRegistered(email)) {
             setError(emailInput, "Este email ya está registrado.");
             valid = false;
        } else {
            setSuccess(emailInput);
        }


        if (password === "") {
            setError(passwordInput, "La contraseña es obligatoria.");
            valid = false;
        } else if (password.length < 8 || password.length > 20) {
            setError(passwordInput, "La contraseña debe tener entre 8 y 20 caracteres.");
            valid = false;
        } else {
            setSuccess(passwordInput);
        }


        if (repeatPassword === "") {
            setError(repeatPasswordInput, "Repite la contraseña.");
            valid = false;
        } else if (repeatPassword !== password) {
            setError(repeatPasswordInput, "Las contraseñas no coinciden.");
            valid = false;
        } else {
            setSuccess(repeatPasswordInput);
        }


        if (!termsAccepted) {
            const termsErrorDiv = document.querySelector("#terms-error");
            if(termsErrorDiv) termsErrorDiv.textContent = "Debes aceptar los términos y condiciones.";
            termsCheck.classList.add('is-invalid');
            valid = false;
        } else {
            const termsCheckParent = termsCheck.parentElement;
            if(termsCheckParent && termsCheckParent.querySelector('#terms-error')) {
                 termsCheckParent.querySelector('#terms-error').textContent = "";
            }
            termsCheck.classList.remove('is-invalid');
        }

        if (valid) {
            const newUser = {
                id: Date.now(),
                name: name,
                lastName: lastName,
                email: email,
                password: password,
                registeredAt: new Date().toISOString()
            };


            const users = getUsers();
            users.push(newUser);
           
            saveUsers(users);


            displayFeedback(registrationFeedback, 'success', '¡Registro exitoso! Ya puedes iniciar sesión.');
           
            form.reset();
            document.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
        } else {
            displayFeedback(registrationFeedback, 'danger', 'Por favor, corrige los errores marcados en el formulario.');
        }
    });
}






function handleLogin() {
    
    const form = document.querySelector("#loginForm");
    if (!form) return; 
   
    const emailInput = document.querySelector("#loginEmail");
    const passwordInput = document.querySelector("#loginPassword");
    const loginFeedback = document.querySelector("#loginFeedback");


    form.addEventListener("submit", (e) => {
        e.preventDefault();
       
        loginFeedback.innerHTML = '';
        document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        document.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
        document.querySelectorAll(".error-msg").forEach(msg => msg.textContent = "");

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        let valid = true;


        if (email === "") {
            setError(emailInput, "El email es obligatorio.");
            valid = false;
        } else {
            setSuccess(emailInput);
        }

        if (password === "") {
            setError(passwordInput, "La contraseña es obligatoria.");
            valid = false;
        } else {
            setSuccess(passwordInput);
        }

        if (!valid) {
            displayFeedback(loginFeedback, 'danger', 'Por favor, introduce tu email y contraseña.');
            return;
        }

        const users = getUsers();
        const user = users.find(u => u.email === email && u.password === password);


        if (user) {
            localStorage.setItem('currentUser', JSON.stringify({
                id: user.id,
                name: user.name,
                email: user.email
            }));

            displayFeedback(loginFeedback, 'success', `¡Bienvenido, ${user.name}! Redirigiendo...`);
           
            setTimeout(() => {
                window.location.href = './index.html';
            }, 1500);


        } else {
            setError(emailInput, "Credenciales incorrectas.");
            setError(passwordInput, "Credenciales incorrectas.");
            displayFeedback(loginFeedback, 'danger', 'Email o contraseña incorrectos. Inténtalo de nuevo.');
        }
    });
}


// --- INICIALIZACIÓN DE LA LÓGICA ---


document.addEventListener("DOMContentLoaded", () => {
    // Detectar qué script inicializar basado en la presencia de los formularios
    if (document.querySelector("#registerForm")) {
        handleRegistration();
    }
   
    if (document.querySelector("#loginForm")) {
        handleLogin();
    }
});



