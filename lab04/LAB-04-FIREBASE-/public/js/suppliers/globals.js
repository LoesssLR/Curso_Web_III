// ============================================
// CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES
// ============================================
var db = firebase.apps[0].firestore();
const tabla = document.getElementById('bodyTbSuppliers');
const paginationElement = document.getElementById('pagination');
const showingCountElement = document.getElementById('showingCount');
const totalCountElement = document.getElementById('totalCount');

// Variables globales para la paginación
let currentPage = 1;
const suppliersPerPage = 20;
let totalSuppliers = 0;
let allSuppliers = [];

console.log("Script suppliers.js cargado");

// ============================================
// FUNCIONES DE LISTADO Y PAGINACIÓN
// ============================================

function cargarProveedores() {
    db.collection("suppliers").orderBy('supplierId', 'asc').get().then(function(query){
        allSuppliers = [];
        totalSuppliers = query.size;
        totalCountElement.textContent = totalSuppliers;
        
        // Almacenar todos los proveedores
        query.forEach(function(doc){
            const proveedor = doc.data();
            
            allSuppliers.push({
                id: doc.id,
                supplierId: proveedor.supplierId || doc.id,
                companyName: proveedor.companyName || 'N/A',
                contactName: proveedor.contactName || 'N/A',
                contactTitle: proveedor.contactTitle || 'N/A',
                address: proveedor.address || {},
                phone: proveedor.phone || 'N/A'
            });
        });
        
        // Generar paginación y mostrar primera página
        generarPaginacion();
        mostrarPagina(currentPage);
        
    }).catch(function(error){
        console.error("Error cargando proveedores: ", error);
        tabla.innerHTML = '<tr><td colspan="8" class="text-center">Error cargando proveedores</td></tr>';
    });
}

function mostrarPagina(page) {
    currentPage = page;
    const startIndex = (page - 1) * suppliersPerPage;
    const endIndex = startIndex + suppliersPerPage;
    const proveedoresPagina = allSuppliers.slice(startIndex, endIndex);
    
    let salida = "";
    let contador = startIndex + 1;
    
    proveedoresPagina.forEach(function(proveedor) {
        // Construir dirección completa
        const direccionCompleta = proveedor.address 
            ? `${proveedor.address.street || ''}, ${proveedor.address.city || ''}, ${proveedor.address.postalCode || ''}, ${proveedor.address.country || ''}`.replace(/, ,/g, ',').trim()
            : 'N/A';
        
        salida += '<tr>';
        salida += '<td><span class="custom-checkbox"><input type="checkbox" id="checkbox' + contador + '" name="options[]" value="' + proveedor.id + '"><label for="checkbox' + contador + '"></label></span></td>';
        salida += '<td>' + proveedor.supplierId + '</td>';
        salida += '<td>' + proveedor.companyName + '</td>';
        salida += '<td>' + proveedor.contactName + '</td>';
        salida += '<td>' + proveedor.contactTitle + '</td>';
        salida += '<td>' + direccionCompleta + '</td>';
        salida += '<td>' + proveedor.phone + '</td>';
        salida += '<td>';
        salida += '<a href="#editSupplierModal" class="edit" data-toggle="modal" data-id="' + proveedor.id + '"><i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a>';
        salida += '<a href="#deleteSupplierModal" class="delete" data-toggle="modal" data-id="' + proveedor.id + '"><i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i></a>';
        salida += '</td>';
        salida += '</tr>';
        
        contador++;
    });
    
    tabla.innerHTML = salida;
    
    // Actualizar contador de registros mostrados
    const showingStart = startIndex + 1;
    const showingEnd = Math.min(endIndex, totalSuppliers);
    showingCountElement.textContent = showingEnd - showingStart + 1;
    
    // Reactivar tooltips después de cargar la tabla
    $('[data-toggle="tooltip"]').tooltip();
    
    // Actualizar estado de la paginación
    actualizarEstadoPaginacion();
}

function generarPaginacion() {
    const totalPages = Math.ceil(totalSuppliers / suppliersPerPage);
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

function obtenerUltimoId() {
    return db.collection("suppliers")
        .orderBy('supplierId', 'desc')
        .limit(1)
        .get()
        .then(function(query) {
            if (!query.empty) {
                const ultimoProveedor = query.docs[0].data();
                return ultimoProveedor.supplierId || 0;
            } else {
                return 0;
            }
        })
        .catch(function(error) {
            console.error("Error obteniendo último ID: ", error);
            return 0;
        });
}

async function obtenerDatosFormularioAgregar() {
    const ultimoId = await obtenerUltimoId();
    
    return {
        supplierId: ultimoId + 1,
        companyName: document.getElementById('addCompanyName').value,
        contactName: document.getElementById('addContactName').value,
        contactTitle: document.getElementById('addContactTitle').value,
        address: {
            street: document.getElementById('addStreet').value,
            city: document.getElementById('addCity').value,
            postalCode: document.getElementById('addPostalCode').value,
            country: document.getElementById('addCountry').value
        },
        phone: document.getElementById('addPhone').value
    };
}

function agregarProveedor(supplierData) {
    return db.collection("suppliers")
        .add({
            supplierId: supplierData.supplierId,
            companyName: supplierData.companyName,
            contactName: supplierData.contactName,
            contactTitle: supplierData.contactTitle,
            address: supplierData.address,
            phone: supplierData.phone,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() 
        })
        .then(function (docRef) {
            console.log("Proveedor agregado con ID: " + docRef.id);
            alert("Proveedor agregado exitosamente");
            limpiarFormularioAgregar();
            return docRef;
        })
        .catch(function (error) {
            console.error("Error al agregar proveedor:", error);
            throw error;
        });
}

function limpiarFormularioAgregar() {
    document.getElementById('addCompanyName').value = '';
    document.getElementById('addContactName').value = '';
    document.getElementById('addContactTitle').value = '';
    document.getElementById('addStreet').value = '';
    document.getElementById('addCity').value = '';
    document.getElementById('addPostalCode').value = '';
    document.getElementById('addCountry').value = '';
    document.getElementById('addPhone').value = '';
}

// ============================================
// FUNCIONES DE EDITAR
// ============================================

function forzarCerrarModales() {
    // Cerrar todos los modales de Bootstrap si alguno sigue abierto
    try {
        $('#editSupplierModal').modal('hide');
        $('#deleteSupplierModal').modal('hide');
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

async function actualizarProveedor(supplierId, datosActualizados) {
    return db.collection("suppliers").doc(supplierId).update({
        companyName: datosActualizados.companyName,
        contactName: datosActualizados.contactName,
        contactTitle: datosActualizados.contactTitle,
        address: datosActualizados.address,
        phone: datosActualizados.phone,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function() {
        console.log("Proveedor actualizado con ID: ", supplierId);
        limpiarFormularioEdicion();
        alert("Proveedor actualizado exitosamente");
        return;
    }).catch(function(error) {
        console.error("Error actualizando proveedor: ", error);
        alert("Error al actualizar el proveedor");
        throw error;
    });
}

async function abrirModalEditar(supplierId) {
    console.log("Cargando proveedor para editar: ", supplierId);
    
    try {
        // Obtener los datos del proveedor
        const doc = await db.collection("suppliers").doc(supplierId).get();
        
        if (doc.exists) {
            const proveedor = doc.data();
            console.log("Datos del proveedor cargados:", proveedor);
            
            // Llenar el formulario de edición
            document.getElementById('editSupplierId').value = proveedor.supplierId || '';
            document.getElementById('editCompanyName').value = proveedor.companyName || '';
            document.getElementById('editContactName').value = proveedor.contactName || '';
            document.getElementById('editContactTitle').value = proveedor.contactTitle || '';
            
            // Llenar dirección
            if (proveedor.address) {
                document.getElementById('editStreet').value = proveedor.address.street || '';
                document.getElementById('editCity').value = proveedor.address.city || '';
                document.getElementById('editPostalCode').value = proveedor.address.postalCode || '';
                document.getElementById('editCountry').value = proveedor.address.country || '';
            }
            
            document.getElementById('editPhone').value = proveedor.phone || '';
            
            // Guardar el ID del documento de Firestore
            document.getElementById('editSupplierModal').setAttribute('data-doc-id', supplierId);
            
            console.log("Formulario llenado, abriendo modal...");
            
            // Mostrar el modal
            $('#editSupplierModal').modal({
                backdrop: false,
                keyboard: true,
                show: true
            });
        } else {
            console.error("El documento no existe");
            alert("Proveedor no encontrado");
        }
    } catch (error) {
        console.error("Error cargando proveedor:", error);
        alert("Error al cargar el proveedor: " + error.message);
    }
}

function limpiarFormularioEdicion() {
    const form = document.querySelector('#editSupplierModal form');
    if (form) {
        form.reset();
    }
    document.getElementById('editSupplierModal').removeAttribute('data-doc-id');
}

// ============================================
// FUNCIONES DE ELIMINAR
// ============================================

async function eliminarProveedor(supplierId) {
    return db.collection("suppliers").doc(supplierId).delete()
    .then(function() {
        console.log("Proveedor eliminado con ID: ", supplierId);
        alert("Proveedor eliminado exitosamente");
        // Limpiar el modal
        const modal = document.getElementById('deleteSupplierModal');
        modal.removeAttribute('data-doc-id');
        modal.removeAttribute('data-modo');
        return;
    })
    .catch(function(error) {
        console.error("Error eliminando proveedor: ", error);
        alert("Error al eliminar el proveedor");
        throw error;
    });
}

async function eliminarProveedoresMasivo(supplierIds) {
    console.log("Eliminando proveedores en masa:", supplierIds);
    
    // Crear un batch para eliminar múltiples documentos
    const batch = db.batch();
    
    supplierIds.forEach(id => {
        const docRef = db.collection("suppliers").doc(id);
        batch.delete(docRef);
    });
    
    return batch.commit()
    .then(function() {
        console.log(`${supplierIds.length} proveedor(es) eliminado(s) exitosamente`);
        alert(`${supplierIds.length} proveedor(es) eliminado(s) exitosamente`);
        
        // Limpiar el modal
        const modal = document.getElementById('deleteSupplierModal');
        modal.removeAttribute('data-ids-seleccionados');
        modal.removeAttribute('data-modo');
        return;
    })
    .catch(function(error) {
        console.error("Error eliminando proveedores en masa: ", error);
        alert("Error al eliminar los proveedores");
        throw error;
    });
}

function abrirModalEliminarIndividual(supplierId) {
    console.log("Preparando eliminación de proveedor: ", supplierId);
    
    const modal = document.getElementById('deleteSupplierModal');
    
    // Guardar el ID y modo
    modal.setAttribute('data-doc-id', supplierId);
    modal.setAttribute('data-modo', 'individual');
    
    // Actualizar el mensaje del modal
    const modalBody = modal.querySelector('.modal-body p:first-of-type');
    if (modalBody) {
        modalBody.textContent = '¿Estás seguro de que deseas eliminar este proveedor?';
    }
    
    console.log("Abriendo modal de eliminación individual...");
    
    // Mostrar el modal
    $('#deleteSupplierModal').modal('show');
}

function abrirModalEliminarMasivo(idsSeleccionados) {
    console.log("Preparando eliminación masiva de proveedores: ", idsSeleccionados);
    
    const modal = document.getElementById('deleteSupplierModal');
    
    // Guardar los IDs y modo
    modal.setAttribute('data-ids-seleccionados', JSON.stringify(idsSeleccionados));
    modal.setAttribute('data-modo', 'masivo');
    
    // Actualizar el mensaje del modal
    const modalBody = modal.querySelector('.modal-body p:first-of-type');
    if (modalBody) {
        const cantidad = idsSeleccionados.length;
        modalBody.textContent = cantidad === 1 
            ? '¿Estás seguro de que deseas eliminar este proveedor?' 
            : `¿Estás seguro de que deseas eliminar ${cantidad} proveedores?`;
    }
    
    console.log("Abriendo modal de eliminación masiva...");
    
    // Mostrar el modal
    $('#deleteSupplierModal').modal('show');
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando suppliers.js");
    
    // Cargar proveedores al iniciar
    cargarProveedores();
    
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
        
        const supplierId = editBtn.getAttribute('data-id');
        console.log("Botón editar clickeado, ID:", supplierId);
        
        if (supplierId) {
            abrirModalEditar(supplierId);
        }
    }
    
    // Buscar si el clic fue en un botón delete individual
    const deleteBtn = e.target.closest('a.delete');
    if (deleteBtn && !deleteBtn.classList.contains('btn-danger')) {
        e.preventDefault();
        e.stopPropagation();
        
        const supplierId = deleteBtn.getAttribute('data-id');
        console.log("Botón eliminar clickeado, ID:", supplierId);
        
        if (supplierId) {
            abrirModalEliminarIndividual(supplierId);
        }
    }
});

function inicializarFormularioAgregar() {
    const addForm = document.querySelector('#addSupplierModal form');
    
    if (addForm) {
        addForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const supplierData = await obtenerDatosFormularioAgregar();
                console.log("Datos del proveedor:", supplierData);
                
                if (!supplierData.companyName) {
                    alert("Por favor ingresa el nombre de la compañía");
                    return;
                }
                
                await agregarProveedor(supplierData);
                
                $('#addSupplierModal').modal('hide');
                cargarProveedores();
                
            } catch (error) {
                console.error("Error en el proceso:", error);
                alert("Error al agregar proveedor: " + error.message);
            }
        });
    }
}

function inicializarFormularioEdicion() {
    const editForm = document.querySelector('#editSupplierModal form');

    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const supplierId = document.getElementById('editSupplierModal').getAttribute('data-doc-id');
                if (!supplierId) {
                    throw new Error("ID de proveedor no encontrado para actualización");
                }
                
                const companyName = document.getElementById('editCompanyName').value;
                
                if (!companyName) {
                    alert("Por favor ingresa el nombre de la compañía");
                    return;
                }
                
                const datosActualizados = {
                    companyName: companyName,
                    contactName: document.getElementById('editContactName').value,
                    contactTitle: document.getElementById('editContactTitle').value,
                    address: {
                        street: document.getElementById('editStreet').value,
                        city: document.getElementById('editCity').value,
                        postalCode: document.getElementById('editPostalCode').value,
                        country: document.getElementById('editCountry').value
                    },
                    phone: document.getElementById('editPhone').value
                };
                
                console.log("Datos actualizados del proveedor:", datosActualizados);
                
                await actualizarProveedor(supplierId, datosActualizados);
                
                $('#editSupplierModal').modal('hide');
                forzarCerrarModales();
                cargarProveedores();
                
            } catch (error) {
                console.error("Error en el proceso de actualización:", error);
                alert("Error al actualizar proveedor: " + error.message);
            }
        });
    }

    // Botón cancelar edición
    const btnCancelEdit = document.querySelector('#editSupplierModal .btn-cancel-edit');
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', function(e) {
            e.preventDefault();
            const salir = confirm("¿Desea dejar de editar el proveedor?\nLos cambios no guardados se perderán.");
            if (salir) {
                limpiarFormularioEdicion();
                forzarCerrarModales();
            }
        });
    }

    // Botón cancelar delete
    const btnCancelDelete = document.querySelector('#deleteSupplierModal .btn-cancel-delete');
    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', function(e) {
            e.preventDefault();
            const salir = confirm("¿Desea cancelar la eliminación del proveedor?");
            if (salir) {
                forzarCerrarModales();
            }
        });
    }
}

function inicializarFormularioEliminacion() {
    const deleteForm = document.querySelector('#deleteSupplierModal form');
    
    if (deleteForm) {
        deleteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const modal = document.getElementById('deleteSupplierModal');
                const modoEliminacion = modal.getAttribute('data-modo');
                
                if (modoEliminacion === 'masivo') {
                    // Eliminación masiva
                    const idsSeleccionados = modal.getAttribute('data-ids-seleccionados');
                    if (!idsSeleccionados) {
                        throw new Error("No hay proveedores seleccionados para eliminar");
                    }
                    
                    const ids = JSON.parse(idsSeleccionados);
                    await eliminarProveedoresMasivo(ids);
                    
                } else {
                    // Eliminación individual
                    const supplierId = modal.getAttribute('data-doc-id');
                    if (!supplierId) {
                        throw new Error("ID de proveedor no encontrado para eliminación");
                    }
                    
                    await eliminarProveedor(supplierId);
                }
                
                $('#deleteSupplierModal').modal('hide');
                cargarProveedores();
                
                // Limpiar checkboxes
                $('#selectAll').prop('checked', false);
                $('table tbody input[type="checkbox"]').prop('checked', false);
                
            } catch (error) {
                console.error("Error en el proceso de eliminación:", error);
                alert("Error al eliminar proveedor(es): " + error.message);
            }
        });
    }
}

function configurarEliminacionMasiva() {
    // Capturar el clic en el botón de borrar masivo
    const btnBorrarMasivo = document.querySelector('a[href="#deleteSupplierModal"].btn-danger');
    
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
                alert('Por favor selecciona al menos un proveedor para eliminar');
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