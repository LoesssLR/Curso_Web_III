// ============================================
// CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES
// ============================================
var db = firebase.apps[0].firestore();
const tabla = document.getElementById('bodyTbUserData');
const paginationElement = document.getElementById('pagination');
const showingCountElement = document.getElementById('showingCount');
const totalCountElement = document.getElementById('totalCount');

// Variables globales para la paginación
let currentPage = 1;
const usersPerPage = 20;
let totalUsers = 0;
let allUsers = [];

console.log("Script userData.js cargado");

// ============================================
// FUNCIONES DE LISTADO Y PAGINACIÓN
// ============================================

function cargarClientes() {
    db.collection("userData").orderBy('creationDate', 'desc').get().then(function(query){
        allUsers = [];
        totalUsers = query.size;
        totalCountElement.textContent = totalUsers;
        
        // Almacenar todos los clientes
        query.forEach(function(doc){
            const cliente = doc.data();
            
            // Formatear fecha
            let fechaRegistro = 'N/A';
            if (cliente.creationDate) {
                const fecha = cliente.creationDate.toDate();
                fechaRegistro = fecha.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
            
            allUsers.push({
                id: doc.id,
                idemp: cliente.idemp || 'N/A',
                userName: cliente.userName || 'N/A',
                email: cliente.email || 'N/A',
                creationDate: fechaRegistro
            });
        });
        
        // Generar paginación y mostrar primera página
        generarPaginacion();
        mostrarPagina(currentPage);
        
    }).catch(function(error){
        console.error("Error cargando clientes: ", error);
        tabla.innerHTML = '<tr><td colspan="6" class="text-center">Error cargando clientes</td></tr>';
    });
}

function mostrarPagina(page) {
    currentPage = page;
    const startIndex = (page - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const clientesPagina = allUsers.slice(startIndex, endIndex);
    
    let salida = "";
    let contador = startIndex + 1;
    
    clientesPagina.forEach(function(cliente) {
        salida += '<tr>';
        salida += '<td><span class="custom-checkbox"><input type="checkbox" id="checkbox' + contador + '" name="options[]" value="' + cliente.id + '"><label for="checkbox' + contador + '"></label></span></td>';
        salida += '<td>' + cliente.userName + '</td>';
        salida += '<td>' + cliente.email + '</td>';
        salida += '<td>' + cliente.idemp + '</td>';
        salida += '<td>' + cliente.creationDate + '</td>';
        salida += '<td>';
        salida += '<a href="#editUserDataModal" class="edit" data-toggle="modal" data-id="' + cliente.id + '"><i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a>';
        salida += '<a href="#deleteUserDataModal" class="delete" data-toggle="modal" data-id="' + cliente.id + '"><i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i></a>';
        salida += '</td>';
        salida += '</tr>';
        
        contador++;
    });
    
    tabla.innerHTML = salida;
    
    // Actualizar contador de registros mostrados
    const showingStart = startIndex + 1;
    const showingEnd = Math.min(endIndex, totalUsers);
    showingCountElement.textContent = showingEnd - showingStart + 1;
    
    // Reactivar tooltips después de cargar la tabla
    $('[data-toggle="tooltip"]').tooltip();
    
    // Actualizar estado de la paginación
    actualizarEstadoPaginacion();
}

function generarPaginacion() {
    const totalPages = Math.ceil(totalUsers / usersPerPage);
    let paginacionHTML = '';
    
    // Botón Previous
    if (currentPage === 1) {
        paginacionHTML += '<li class="page-item disabled"><a href="#" class="page-link">Previous</a></li>';
    } else {
        paginacionHTML += '<li class="page-item"><a href="#" class="page-link" data-page="' + (currentPage - 1) + '">Previous</a></li>';
    }
    
    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginacionHTML += '<li class="page-item active"><a href="#" class="page-link" data-page="' + i + '">' + i + '</a></li>';
        } else {
            paginacionHTML += '<li class="page-item"><a href="#" class="page-link" data-page="' + i + '">' + i + '</a></li>';
        }
    }
    
    // Botón Next
    if (currentPage === totalPages) {
        paginacionHTML += '<li class="page-item disabled"><a href="#" class="page-link">Next</a></li>';
    } else {
        paginacionHTML += '<li class="page-item"><a href="#" class="page-link" data-page="' + (currentPage + 1) + '">Next</a></li>';
    }
    
    paginationElement.innerHTML = paginacionHTML;
    
    // Agregar event listeners a los enlaces de paginación
    document.querySelectorAll('.page-link[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            mostrarPagina(page);
            generarPaginacion();
        });
    });
}

function actualizarEstadoPaginacion() {
    // Esta función se puede expandar para manejar estados adicionales si es necesario
}

// ============================================
// FUNCIONES DE AGREGAR
// ============================================

function obtenerDatosFormularioAgregar() {
    return {
        userName: document.getElementById('addUserName').value,
        email: document.getElementById('addEmail').value,
        idemp: document.getElementById('addIdemp').value,
        creationDate: firebase.firestore.FieldValue.serverTimestamp()
    };
}

function agregarCliente(userData) {
    return db.collection("userData")
        .add({
            userName: userData.userName,
            email: userData.email,
            idemp: userData.idemp,
            creationDate: userData.creationDate
        })
        .then(function (docRef) {
            console.log("Cliente agregado con ID: " + docRef.id);
            alert("Cliente agregado exitosamente");
            limpiarFormularioAgregar();
            return docRef;
        })
        .catch(function (error) {
            console.error("Error al agregar cliente:", error);
            throw error;
        });
}

function limpiarFormularioAgregar() {
    document.getElementById('addUserName').value = '';
    document.getElementById('addEmail').value = '';
    document.getElementById('addIdemp').value = '';
}

// ============================================
// FUNCIONES DE EDITAR
// ============================================

function forzarCerrarModales() {
    // Cerrar todos los modales de Bootstrap si alguno sigue abierto
    try {
        $('#editUserDataModal').modal('hide');
        $('#deleteUserDataModal').modal('hide');
    } catch (e) {
        console.warn("Error cerrando modales por jQuery/Bootstrap: ", e);
    }

    // Quitar clase que bloquea el scroll
    document.body.classList.remove('modal-open');

    // Eliminar TODAS las capas oscuras que se hayan acumulado
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(b => b.remove());

    console.log("forzarCerrarModales() ejecutado: backdrops eliminados y body limpio");
}

async function actualizarCliente(userId, datosActualizados) {
    return db.collection("userData").doc(userId).update({
        userName: datosActualizados.userName,
        email: datosActualizados.email,
        idemp: datosActualizados.idemp,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function() {
        console.log("Cliente actualizado con ID: ", userId);
        limpiarFormularioEdicion();
        alert("Cliente actualizado exitosamente");
        return;
    }).catch(function(error) {
        console.error("Error actualizando cliente: ", error);
        alert("Error al actualizar el cliente");
        throw error;
    });
}

async function abrirModalEditar(userId) {
    console.log("Cargando cliente para editar: ", userId);
    
    try {
        // Obtener los datos del cliente
        const doc = await db.collection("userData").doc(userId).get();
        
        if (doc.exists) {
            const cliente = doc.data();
            console.log("Datos del cliente cargados:", cliente);
            
            // Llenar el formulario de edición
            document.getElementById('editUserName').value = cliente.userName || '';
            document.getElementById('editEmail').value = cliente.email || '';
            document.getElementById('editIdemp').value = cliente.idemp || '';
            
            // Mostrar fecha de creación (solo lectura)
            if (cliente.creationDate) {
                const fecha = cliente.creationDate.toDate();
                const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                document.getElementById('editCreationDate').value = fechaFormateada;
            }
            
            // Guardar el ID del documento de Firestore
            document.getElementById('editUserDataModal').setAttribute('data-doc-id', userId);
            
            console.log("Formulario llenado, abriendo modal...");
            
            // Mostrar el modal
            $('#editUserDataModal').modal({
                backdrop: false,
                keyboard: true,
                show: true
            });
        } else {
            console.error("El documento no existe");
            alert("Cliente no encontrado");
        }
    } catch (error) {
        console.error("Error cargando cliente:", error);
        alert("Error al cargar el cliente: " + error.message);
    }
}

function limpiarFormularioEdicion() {
    const form = document.querySelector('#editUserDataModal form');
    if (form) {
        form.reset();
    }
    document.getElementById('editUserDataModal').removeAttribute('data-doc-id');
}

// ============================================
// FUNCIONES DE ELIMINAR
// ============================================

async function eliminarCliente(userId) {
    return db.collection("userData").doc(userId).delete()
    .then(function() {
        console.log("Cliente eliminado con ID: ", userId);
        alert("Cliente eliminado exitosamente");
        // Limpiar el modal
        const modal = document.getElementById('deleteUserDataModal');
        modal.removeAttribute('data-doc-id');
        modal.removeAttribute('data-modo');
        return;
    })
    .catch(function(error) {
        console.error("Error eliminando cliente: ", error);
        alert("Error al eliminar el cliente");
        throw error;
    });
}

async function eliminarClientesMasivo(userIds) {
    console.log("Eliminando clientes en masa:", userIds);
    
    // Crear un batch para eliminar múltiples documentos
    const batch = db.batch();
    
    userIds.forEach(id => {
        const docRef = db.collection("userData").doc(id);
        batch.delete(docRef);
    });
    
    return batch.commit()
    .then(function() {
        console.log(`${userIds.length} cliente(s) eliminado(s) exitosamente`);
        alert(`${userIds.length} cliente(s) eliminado(s) exitosamente`);
        
        // Limpiar el modal
        const modal = document.getElementById('deleteUserDataModal');
        modal.removeAttribute('data-ids-seleccionados');
        modal.removeAttribute('data-modo');
        return;
    })
    .catch(function(error) {
        console.error("Error eliminando clientes en masa: ", error);
        alert("Error al eliminar los clientes");
        throw error;
    });
}

function abrirModalEliminarIndividual(userId) {
    console.log("Preparando eliminación de cliente: ", userId);
    
    const modal = document.getElementById('deleteUserDataModal');
    
    // Guardar el ID y modo
    modal.setAttribute('data-doc-id', userId);
    modal.setAttribute('data-modo', 'individual');
    
    // Actualizar el mensaje del modal
    const modalBody = modal.querySelector('.modal-body p:first-of-type');
    if (modalBody) {
        modalBody.textContent = '¿Estás seguro de que deseas eliminar este cliente?';
    }
    
    console.log("Abriendo modal de eliminación individual...");
    
    // Mostrar el modal
    $('#deleteUserDataModal').modal('show');
}

function abrirModalEliminarMasivo(idsSeleccionados) {
    console.log("Preparando eliminación masiva de clientes: ", idsSeleccionados);
    
    const modal = document.getElementById('deleteUserDataModal');
    
    // Guardar los IDs y modo
    modal.setAttribute('data-ids-seleccionados', JSON.stringify(idsSeleccionados));
    modal.setAttribute('data-modo', 'masivo');
    
    // Actualizar el mensaje del modal
    const modalBody = modal.querySelector('.modal-body p:first-of-type');
    if (modalBody) {
        const cantidad = idsSeleccionados.length;
        modalBody.textContent = cantidad === 1 
            ? '¿Estás seguro de que deseas eliminar este cliente?' 
            : `¿Estás seguro de que deseas eliminar ${cantidad} clientes?`;
    }
    
    console.log("Abriendo modal de eliminación masiva...");
    
    // Mostrar el modal
    $('#deleteUserDataModal').modal('show');
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando userData.js");
    
    // Cargar clientes al iniciar
    cargarClientes();
    
    // Inicializar formularios
    inicializarFormularioAgregar();
    inicializarFormularioEdicion();
    inicializarFormularioEliminacion();
    configurarEliminacionMasiva();
});

// Event listener para botones de editar (delegación de eventos)
document.addEventListener('click', function(e) {
    // Buscar si el clic fue en un botón edit
    const editBtn = e.target.closest('a.edit');
    if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        const userId = editBtn.getAttribute('data-id');
        console.log("Botón editar clickeado, ID:", userId);
        
        if (userId) {
            abrirModalEditar(userId);
        }
    }
    
    // Buscar si el clic fue en un botón delete individual
    const deleteBtn = e.target.closest('a.delete');
    if (deleteBtn && !deleteBtn.classList.contains('btn-danger')) {
        e.preventDefault();
        e.stopPropagation();
        
        const userId = deleteBtn.getAttribute('data-id');
        console.log("Botón eliminar clickeado, ID:", userId);
        
        if (userId) {
            abrirModalEliminarIndividual(userId);
        }
    }
});

function inicializarFormularioAgregar() {
    const addForm = document.querySelector('#addUserDataModal form');
    
    if (addForm) {
        addForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const userData = obtenerDatosFormularioAgregar();
                console.log("Datos del cliente:", userData);
                
                if (!userData.userName || !userData.email) {
                    alert("Por favor ingresa el nombre y el email");
                    return;
                }
                
                await agregarCliente(userData);
                
                $('#addUserDataModal').modal('hide');
                cargarClientes();
                
            } catch (error) {
                console.error("Error en el proceso:", error);
                alert("Error al agregar cliente: " + error.message);
            }
        });
    }
}

function inicializarFormularioEdicion() {
    const editForm = document.querySelector('#editUserDataModal form');

    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const userId = document.getElementById('editUserDataModal').getAttribute('data-doc-id');
                if (!userId) {
                    throw new Error("ID de cliente no encontrado para actualización");
                }
                
                const userName = document.getElementById('editUserName').value;
                const email = document.getElementById('editEmail').value;
                
                if (!userName || !email) {
                    alert("Por favor ingresa el nombre y el email");
                    return;
                }
                
                const datosActualizados = {
                    userName: userName,
                    email: email,
                    idemp: document.getElementById('editIdemp').value
                };
                
                console.log("Datos actualizados del cliente:", datosActualizados);
                
                await actualizarCliente(userId, datosActualizados);
                
                $('#editUserDataModal').modal('hide');
                forzarCerrarModales();
                cargarClientes();
                
            } catch (error) {
                console.error("Error en el proceso de actualización:", error);
                alert("Error al actualizar cliente: " + error.message);
            }
        });
    }

    // Botón cancelar edición
    const btnCancelEdit = document.querySelector('#editUserDataModal .btn-cancel-edit');
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', function(e) {
            e.preventDefault();
            const salir = confirm("¿Desea dejar de editar el cliente?\nLos cambios no guardados se perderán.");
            if (salir) {
                limpiarFormularioEdicion();
                forzarCerrarModales();
            }
        });
    }

    // Botón cancelar delete
    const btnCancelDelete = document.querySelector('#deleteUserDataModal .btn-cancel-delete');
    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', function(e) {
            e.preventDefault();
            const salir = confirm("¿Desea cancelar la eliminación del cliente?");
            if (salir) {
                forzarCerrarModales();
            }
        });
    }
}

function inicializarFormularioEliminacion() {
    const deleteForm = document.querySelector('#deleteUserDataModal form');
    
    if (deleteForm) {
        deleteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const modal = document.getElementById('deleteUserDataModal');
                const modoEliminacion = modal.getAttribute('data-modo');
                
                if (modoEliminacion === 'masivo') {
                    // Eliminación masiva
                    const idsSeleccionados = modal.getAttribute('data-ids-seleccionados');
                    if (!idsSeleccionados) {
                        throw new Error("No hay clientes seleccionados para eliminar");
                    }
                    
                    const ids = JSON.parse(idsSeleccionados);
                    await eliminarClientesMasivo(ids);
                    
                } else {
                    // Eliminación individual
                    const userId = modal.getAttribute('data-doc-id');
                    if (!userId) {
                        throw new Error("ID de cliente no encontrado para eliminación");
                    }
                    
                    await eliminarCliente(userId);
                }
                
                $('#deleteUserDataModal').modal('hide');
                cargarClientes();
                
                // Limpiar checkboxes
                $('#selectAll').prop('checked', false);
                $('table tbody input[type="checkbox"]').prop('checked', false);
                
            } catch (error) {
                console.error("Error en el proceso de eliminación:", error);
                alert("Error al eliminar cliente(s): " + error.message);
            }
        });
    }
}

function configurarEliminacionMasiva() {
    // Capturar el clic en el botón de borrar masivo
    const btnBorrarMasivo = document.querySelector('a[href="#deleteUserDataModal"].btn-danger');
    
    if (btnBorrarMasivo) {
        btnBorrarMasivo.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Obtener todos los checkboxes seleccionados
            const checkboxes = document.querySelectorAll('table tbody input[type="checkbox"]:checked');
            const idsSeleccionados = [];
            
            checkboxes.forEach(checkbox => {
                const id = checkbox.value;
                if (id) {
                    idsSeleccionados.push(id);
                }
            });
            
            console.log("IDs seleccionados para eliminar:", idsSeleccionados);
            
            if (idsSeleccionados.length === 0) {
                alert('Por favor selecciona al menos un cliente para eliminar');
                return;
            }
            
            abrirModalEliminarMasivo(idsSeleccionados);
        });
    }
}

// ============================================
// JQUERY - CHECKBOXES
// ============================================

$(document).ready(function(){
    // Activate tooltip
    $('[data-toggle="tooltip"]').tooltip();
    
    // Select/Deselect checkboxes
    var checkbox = $('table tbody input[type="checkbox"]');
    $("#selectAll").click(function(){
        if(this.checked){
            checkbox.each(function(){
                this.checked = true;                        
            });
        } else{
            checkbox.each(function(){
                this.checked = false;                        
            });
        } 
    });
    checkbox.click(function(){
        if(!this.checked){
            $("#selectAll").prop("checked", false);
        }
    });
});