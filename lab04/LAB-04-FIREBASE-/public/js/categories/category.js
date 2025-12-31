// ============================================
// CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES
// ============================================
var db = firebase.apps[0].firestore();
var storage = firebase.apps[0].storage();
const tabla = document.getElementById('bodyTbCategories');
const paginationElement = document.getElementById('pagination');
const showingCountElement = document.getElementById('showingCount');
const totalCountElement = document.getElementById('totalCount');

// Variables globales para la paginación
let currentPage = 1;
const categoriesPerPage = 20;
let totalCategories = 0;
let allCategories = [];

console.log("Script categories.js cargado");

// ============================================
// FUNCIONES DE LISTADO Y PAGINACIÓN
// ============================================

function cargarCategorias() {
    db.collection("categories").orderBy('categoryId', 'asc').get().then(function(query){
        allCategories = [];
        totalCategories = query.size;
        totalCountElement.textContent = totalCategories;
        
        // Almacenar todas las categorías
        query.forEach(function(doc){
            const categoria = doc.data();
            
            allCategories.push({
                id: doc.id,
                categoryId: categoria.categoryId || doc.id,
                categoryName: categoria.categoryName || 'N/A',
                description: categoria.description || '',
                pictureUrl: categoria.pictureUrl || ''
            });
        });
        
        // Generar paginación y mostrar primera página
        generarPaginacion();
        mostrarPagina(currentPage);
        
    }).catch(function(error){
        console.error("Error cargando categorías: ", error);
        tabla.innerHTML = '<tr><td colspan="6" class="text-center">Error cargando categorías</td></tr>';
    });
}

function mostrarPagina(page) {
    currentPage = page;
    const startIndex = (page - 1) * categoriesPerPage;
    const endIndex = startIndex + categoriesPerPage;
    const categoriasPagina = allCategories.slice(startIndex, endIndex);
    
    let salida = "";
    let contador = startIndex + 1;
    
    categoriasPagina.forEach(function(categoria) {
        const imagenHtml = categoria.pictureUrl 
            ? `<img src="${categoria.pictureUrl}" alt="${categoria.categoryName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px;">`
            : '<span class="text-muted">Sin imagen</span>';
        
        salida += '<tr>';
        salida += '<td><span class="custom-checkbox"><input type="checkbox" id="checkbox' + contador + '" name="options[]" value="' + categoria.id + '"><label for="checkbox' + contador + '"></label></span></td>';
        salida += '<td>' + categoria.categoryId + '</td>';
        salida += '<td>' + categoria.categoryName + '</td>';
        salida += '<td>' + (categoria.description || '<em class="text-muted">Sin descripción</em>') + '</td>';
        salida += '<td>' + imagenHtml + '</td>';
        salida += '<td>';
        salida += '<a href="#editCategoryModal" class="edit" data-toggle="modal" data-id="' + categoria.id + '"><i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a>';
        salida += '<a href="#deleteCategoryModal" class="delete" data-toggle="modal" data-id="' + categoria.id + '"><i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i></a>';
        salida += '</td>';
        salida += '</tr>';
        
        contador++;
    });
    
    tabla.innerHTML = salida;
    
    // Actualizar contador de registros mostrados
    const showingStart = startIndex + 1;
    const showingEnd = Math.min(endIndex, totalCategories);
    showingCountElement.textContent = showingEnd - showingStart + 1;
    
    // Reactivar tooltips después de cargar la tabla
    $('[data-toggle="tooltip"]').tooltip();
    
    // Actualizar estado de la paginación
    actualizarEstadoPaginacion();
}

function generarPaginacion() {
    const totalPages = Math.ceil(totalCategories / categoriesPerPage);
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
// FUNCIONES DE FIREBASE STORAGE
// ============================================

async function subirImagen(file, categoryId) {
    if (!file) return null;
    
    try {
        const safeName = file.name.replace(/\s+/g, '_');
        const fileName = `categories/${categoryId}_${Date.now()}_${safeName}`;
        const storageRef = storage.ref(fileName);
        
        await storageRef.put(file);
        const downloadURL = await storageRef.getDownloadURL();
        
        console.log("Imagen subida exitosamente:", downloadURL);
        return downloadURL;
        
    } catch (error) {
        console.error("Error subiendo imagen:", error);
        throw new Error("Error al subir la imagen: " + error.message);
    }
}

// ============================================
// FUNCIONES DE AGREGAR
// ============================================

function obtenerUltimoId() {
    return db.collection("categories")
        .orderBy('categoryId', 'desc')
        .limit(1)
        .get()
        .then(function(query) {
            if (!query.empty) {
                const ultimaCategoria = query.docs[0].data();
                return ultimaCategoria.categoryId || 0;
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
    const nuevoCategoryId = ultimoId + 1;
    
    const file = document.getElementById('addPicture').files[0];
    let pictureUrl = '';
    
    if (file) {
        pictureUrl = await subirImagen(file, nuevoCategoryId);
    }
    
    return {
        categoryId: nuevoCategoryId,
        categoryName: document.getElementById('addCategoryName').value,
        description: document.getElementById('addDescription').value,
        pictureUrl: pictureUrl
    };
}

function agregarCategoria(categoryData) {
    return db.collection("categories")
        .add({
            categoryId: categoryData.categoryId,
            categoryName: categoryData.categoryName,
            description: categoryData.description,
            pictureUrl: categoryData.pictureUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() 
        })
        .then(function (docRef) {
            console.log("Categoría agregada con ID: " + docRef.id);
            alert("Categoría agregada exitosamente");
            limpiarFormularioAgregar();
            return docRef;
        })
        .catch(function (error) {
            console.error("Error al agregar categoría:", error);
            throw error;
        });
}

function limpiarFormularioAgregar() {
    document.getElementById('addCategoryName').value = '';
    document.getElementById('addDescription').value = '';
    document.getElementById('addPicture').value = '';
}

// ============================================
// FUNCIONES DE EDITAR
// ============================================

function forzarCerrarModales() {
    // Cerrar todos los modales de Bootstrap si alguno sigue abierto
    try {
        $('#editCategoryModal').modal('hide');
        $('#deleteCategoryModal').modal('hide');
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

async function actualizarCategoria(categoryId, datosActualizados) {
    return db.collection("categories").doc(categoryId).update({
        categoryName: datosActualizados.categoryName,
        description: datosActualizados.description,
        pictureUrl: datosActualizados.pictureUrl,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function() {
        console.log("Categoría actualizada con ID: ", categoryId);
        limpiarFormularioEdicion();
        alert("Categoría actualizada exitosamente");
        return;
    }).catch(function(error) {
        console.error("Error actualizando categoría: ", error);
        alert("Error al actualizar la categoría");
        throw error;
    });
}

async function abrirModalEditar(categoryId) {
    console.log("Cargando categoría para editar: ", categoryId);
    
    try {
        // Obtener los datos de la categoría
        const doc = await db.collection("categories").doc(categoryId).get();
        
        if (doc.exists) {
            const categoria = doc.data();
            console.log("Datos de la categoría cargados:", categoria);
            
            // Llenar el formulario de edición
            document.getElementById('editCategoryId').value = categoria.categoryId || '';
            document.getElementById('editCategoryName').value = categoria.categoryName || '';
            document.getElementById('editDescription').value = categoria.description || '';
            
            // Mostrar imagen actual
            const previewContainer = document.getElementById('currentImagePreview');
            if (categoria.pictureUrl) {
                previewContainer.innerHTML = `
                    <img src="${categoria.pictureUrl}" 
                         alt="${categoria.categoryName}" 
                         style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 5px; border: 1px solid #ddd;">
                `;
            } else {
                previewContainer.innerHTML = '<span class="text-muted">Sin imagen actual</span>';
            }
            
            // Limpiar input de archivo
            document.getElementById('editPicture').value = '';
            
            // Guardar el ID del documento y la URL de la imagen actual
            const modal = document.getElementById('editCategoryModal');
            modal.setAttribute('data-doc-id', categoryId);
            modal.setAttribute('data-current-picture-url', categoria.pictureUrl || '');
            
            console.log("Formulario llenado, abriendo modal...");
            
            // Mostrar el modal
            $('#editCategoryModal').modal({
                backdrop: false,
                keyboard: true,
                show: true
            });
        } else {
            console.error("El documento no existe");
            alert("Categoría no encontrada");
        }
    } catch (error) {
        console.error("Error cargando categoría:", error);
        alert("Error al cargar la categoría: " + error.message);
    }
}

function limpiarFormularioEdicion() {
    const form = document.querySelector('#editCategoryModal form');
    if (form) {
        form.reset();
    }
    const modal = document.getElementById('editCategoryModal');
    modal.removeAttribute('data-doc-id');
    modal.removeAttribute('data-current-picture-url');
    document.getElementById('currentImagePreview').innerHTML = '';
}

// ============================================
// FUNCIONES DE ELIMINAR
// ============================================

async function eliminarCategoria(categoryId) {
    return db.collection("categories").doc(categoryId).delete()
    .then(function() {
        console.log("Categoría eliminada con ID: ", categoryId);
        alert("Categoría eliminada exitosamente");
        // Limpiar el modal
        const modal = document.getElementById('deleteCategoryModal');
        modal.removeAttribute('data-doc-id');
        modal.removeAttribute('data-modo');
        return;
    })
    .catch(function(error) {
        console.error("Error eliminando categoría: ", error);
        alert("Error al eliminar la categoría");
        throw error;
    });
}

async function eliminarCategoriasMasivo(categoryIds) {
    console.log("Eliminando categorías en masa:", categoryIds);
    
    // Crear un batch para eliminar múltiples documentos
    const batch = db.batch();
    
    categoryIds.forEach(id => {
        const docRef = db.collection("categories").doc(id);
        batch.delete(docRef);
    });
    
    return batch.commit()
    .then(function() {
        console.log(`${categoryIds.length} categoría(s) eliminada(s) exitosamente`);
        alert(`${categoryIds.length} categoría(s) eliminada(s) exitosamente`);
        
        // Limpiar el modal
        const modal = document.getElementById('deleteCategoryModal');
        modal.removeAttribute('data-ids-seleccionados');
        modal.removeAttribute('data-modo');
        return;
    })
    .catch(function(error) {
        console.error("Error eliminando categorías en masa: ", error);
        alert("Error al eliminar las categorías");
        throw error;
    });
}

function abrirModalEliminarIndividual(categoryId) {
    console.log("Preparando eliminación de categoría: ", categoryId);
    
    const modal = document.getElementById('deleteCategoryModal');
    
    // Guardar el ID y modo
    modal.setAttribute('data-doc-id', categoryId);
    modal.setAttribute('data-modo', 'individual');
    
    // Actualizar el mensaje del modal
    const modalBody = modal.querySelector('.modal-body p:first-of-type');
    if (modalBody) {
        modalBody.textContent = '¿Estás seguro de que deseas eliminar esta categoría?';
    }
    
    console.log("Abriendo modal de eliminación individual...");
    
    // Mostrar el modal
    $('#deleteCategoryModal').modal('show');
}

function abrirModalEliminarMasivo(idsSeleccionados) {
    console.log("Preparando eliminación masiva de categorías: ", idsSeleccionados);
    
    const modal = document.getElementById('deleteCategoryModal');
    
    // Guardar los IDs y modo
    modal.setAttribute('data-ids-seleccionados', JSON.stringify(idsSeleccionados));
    modal.setAttribute('data-modo', 'masivo');
    
    // Actualizar el mensaje del modal
    const modalBody = modal.querySelector('.modal-body p:first-of-type');
    if (modalBody) {
        const cantidad = idsSeleccionados.length;
        modalBody.textContent = cantidad === 1 
            ? '¿Estás seguro de que deseas eliminar esta categoría?' 
            : `¿Estás seguro de que deseas eliminar ${cantidad} categorías?`;
    }
    
    console.log("Abriendo modal de eliminación masiva...");
    
    // Mostrar el modal
    $('#deleteCategoryModal').modal('show');
}

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando categories.js");
    
    // Cargar categorías al iniciar
    cargarCategorias();
    
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
        
        const categoryId = editBtn.getAttribute('data-id');
        console.log("Botón editar clickeado, ID:", categoryId);
        
        if (categoryId) {
            abrirModalEditar(categoryId);
        }
    }
    
    // Buscar si el clic fue en un botón delete individual
    const deleteBtn = e.target.closest('a.delete');
    if (deleteBtn && !deleteBtn.classList.contains('btn-danger')) {
        e.preventDefault();
        e.stopPropagation();
        
        const categoryId = deleteBtn.getAttribute('data-id');
        console.log("Botón eliminar clickeado, ID:", categoryId);
        
        if (categoryId) {
            abrirModalEliminarIndividual(categoryId);
        }
    }
});

function inicializarFormularioAgregar() {
    const addForm = document.querySelector('#addCategoryModal form');
    
    if (addForm) {
        addForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const categoryName = document.getElementById('addCategoryName').value.trim();
                
                if (!categoryName) {
                    alert("Por favor ingresa el nombre de la categoría");
                    return;
                }
                
                const categoryData = await obtenerDatosFormularioAgregar();
                console.log("Datos de la categoría:", categoryData);
                
                await agregarCategoria(categoryData);
                
                $('#addCategoryModal').modal('hide');
                cargarCategorias();
                
            } catch (error) {
                console.error("Error en el proceso:", error);
                alert("Error al agregar categoría: " + error.message);
            }
        });
    }
}

function inicializarFormularioEdicion() {
    const editForm = document.querySelector('#editCategoryModal form');

    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const modal = document.getElementById('editCategoryModal');
                const categoryId = modal.getAttribute('data-doc-id');
                
                if (!categoryId) {
                    throw new Error("ID de categoría no encontrado para actualización");
                }
                
                const categoryName = document.getElementById('editCategoryName').value.trim();
                
                if (!categoryName) {
                    alert("Por favor ingresa el nombre de la categoría");
                    return;
                }
                
                const description = document.getElementById('editDescription').value;
                const file = document.getElementById('editPicture').files[0];
                
                // Si hay archivo nuevo, subir; sino usar la URL actual
                let pictureUrl = modal.getAttribute('data-current-picture-url') || '';
                
                if (file) {
                    const doc = await db.collection("categories").doc(categoryId).get();
                    const catId = doc.data().categoryId;
                    pictureUrl = await subirImagen(file, catId);
                }
                
                const datosActualizados = {
                    categoryName: categoryName,
                    description: description,
                    pictureUrl: pictureUrl
                };
                
                console.log("Datos actualizados de la categoría:", datosActualizados);
                
                await actualizarCategoria(categoryId, datosActualizados);
                
                $('#editCategoryModal').modal('hide');
                forzarCerrarModales();
                cargarCategorias();
                
            } catch (error) {
                console.error("Error en el proceso de actualización:", error);
                alert("Error al actualizar categoría: " + error.message);
            }
        });
    }

    // Botón cancelar edición
    const btnCancelEdit = document.querySelector('#editCategoryModal .btn-cancel-edit');
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', function(e) {
            e.preventDefault();
            const salir = confirm("¿Desea dejar de editar la categoría?\nLos cambios no guardados se perderán.");
            if (salir) {
                limpiarFormularioEdicion();
                forzarCerrarModales();
            }
        });
    }

    // Botón cancelar delete
    const btnCancelDelete = document.querySelector('#deleteCategoryModal .btn-cancel-delete');
    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', function(e) {
            e.preventDefault();
            const salir = confirm("¿Desea cancelar la eliminación de la categoría?");
            if (salir) {
                forzarCerrarModales();
            }
        });
    }
}

function inicializarFormularioEliminacion() {
    const deleteForm = document.querySelector('#deleteCategoryModal form');
    
    if (deleteForm) {
        deleteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const modal = document.getElementById('deleteCategoryModal');
                const modoEliminacion = modal.getAttribute('data-modo');
                
                if (modoEliminacion === 'masivo') {
                    // Eliminación masiva
                    const idsSeleccionados = modal.getAttribute('data-ids-seleccionados');
                    if (!idsSeleccionados) {
                        throw new Error("No hay categorías seleccionadas para eliminar");
                    }
                    
                    const ids = JSON.parse(idsSeleccionados);
                    await eliminarCategoriasMasivo(ids);
                    
                } else {
                    // Eliminación individual
                    const categoryId = modal.getAttribute('data-doc-id');
                    if (!categoryId) {
                        throw new Error("ID de categoría no encontrado para eliminación");
                    }
                    
                    await eliminarCategoria(categoryId);
                }
                
                $('#deleteCategoryModal').modal('hide');
                cargarCategorias();
                
                // Limpiar checkboxes
                $('#selectAll').prop('checked', false);
                $('table tbody input[type="checkbox"]').prop('checked', false);
                
            } catch (error) {
                console.error("Error en el proceso de eliminación:", error);
                alert("Error al eliminar categoría(s): " + error.message);
            }
        });
    }
}

function configurarEliminacionMasiva() {
    // Capturar el clic en el botón de borrar masivo
    const btnBorrarMasivo = document.querySelector('a[href="#deleteCategoryModal"].btn-danger');
    
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
                alert('Por favor selecciona al menos una categoría para eliminar');
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