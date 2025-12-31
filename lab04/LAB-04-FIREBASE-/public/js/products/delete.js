var db = firebase.apps[0].firestore();

console.log("Script delete.js cargado");

document.addEventListener('DOMContentLoaded', function() {
    inicializarFormularioEliminacion();
    agregarEventListeners();
    configurarEliminacionMasiva();
});

// Inicializar el formulario de eliminación
function inicializarFormularioEliminacion() {
    const deleteForm = document.querySelector('#deleteEmployeeModal form');
    
    if (deleteForm) {
        deleteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const modal = document.getElementById('deleteEmployeeModal');
                const modoEliminacion = modal.getAttribute('data-modo');
                
                if (modoEliminacion === 'masivo') {
                    // Eliminación masiva
                    const idsSeleccionados = modal.getAttribute('data-ids-seleccionados');
                    if (!idsSeleccionados) {
                        throw new Error("No hay productos seleccionados para eliminar");
                    }
                    
                    const ids = JSON.parse(idsSeleccionados);
                    await eliminarProductosMasivo(ids);
                    
                } else {
                    // Eliminación individual
                    const productId = modal.getAttribute('data-doc-id');
                    if (!productId) {
                        throw new Error("ID de producto no encontrado para eliminación");
                    }
                    
                    await eliminarProducto(productId);
                }
                
                $('#deleteEmployeeModal').modal('hide');
                cargarProductos();
                
                // Limpiar checkboxes
                $('#selectAll').prop('checked', false);
                $('table tbody input[type="checkbox"]').prop('checked', false);
                
            } catch (error) {
                console.error("Error en el proceso de eliminación:", error);
                alert("Error al eliminar producto(s): " + error.message);
            }
        });
    }
}

// Función para eliminar producto individual
async function eliminarProducto(productId) {
    return db.collection("products").doc(productId).delete()
    .then(function() {
        console.log("Producto eliminado con ID: ", productId);
        alert("Producto eliminado exitosamente");
        // Limpiar el modal
        const modal = document.getElementById('deleteEmployeeModal');
        modal.removeAttribute('data-doc-id');
        modal.removeAttribute('data-modo');
        return;
    })
    .catch(function(error) {
        console.error("Error eliminando producto: ", error);
        alert("Error al eliminar el producto");
        throw error;
    });
}

// Función para eliminar múltiples productos
async function eliminarProductosMasivo(productIds) {
    console.log("Eliminando productos en masa:", productIds);
    
    // Crear un batch para eliminar múltiples documentos
    const batch = db.batch();
    
    productIds.forEach(id => {
        const docRef = db.collection("products").doc(id);
        batch.delete(docRef);
    });
    
    return batch.commit()
    .then(function() {
        console.log(`${productIds.length} producto(s) eliminado(s) exitosamente`);
        alert(`${productIds.length} producto(s) eliminado(s) exitosamente`);
        
        // Limpiar el modal
        const modal = document.getElementById('deleteEmployeeModal');
        modal.removeAttribute('data-ids-seleccionados');
        modal.removeAttribute('data-modo');
        return;
    })
    .catch(function(error) {
        console.error("Error eliminando productos en masa: ", error);
        alert("Error al eliminar los productos");
        throw error;
    });
}

// Agregar event listeners usando delegación de eventos
function agregarEventListeners() {
    // Usar delegación de eventos en el documento para capturar clics en botones delete individuales
    document.addEventListener('click', function(e) {
        // Buscar si el clic fue en un botón delete o dentro de él
        const deleteBtn = e.target.closest('a.delete');
        
        if (deleteBtn && !deleteBtn.classList.contains('btn-danger')) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = deleteBtn.getAttribute('data-id');
            console.log("Botón eliminar clickeado, ID:", productId);
            
            if (productId) {
                abrirModalEliminarIndividual(productId);
            } else {
                console.error("No se encontró data-id en el botón delete");
            }
        }
    });
}

// Función para abrir modal de eliminar individual
function abrirModalEliminarIndividual(productId) {
    console.log("Preparando eliminación de producto: ", productId);
    
    const modal = document.getElementById('deleteEmployeeModal');
    
    // Guardar el ID y modo
    modal.setAttribute('data-doc-id', productId);
    modal.setAttribute('data-modo', 'individual');
    
    // Actualizar el mensaje del modal
    const modalBody = modal.querySelector('.modal-body p:first-of-type');
    if (modalBody) {
        modalBody.textContent = '¿Estás seguro de que deseas eliminar este producto?';
    }
    
    console.log("Abriendo modal de eliminación individual...");
    
    // Mostrar el modal
    $('#deleteEmployeeModal').modal('show');
}

// Configurar eliminación masiva
function configurarEliminacionMasiva() {
    // Capturar el clic en el botón de borrar masivo
    const btnBorrarMasivo = document.querySelector('a[href="#deleteEmployeeModal"].btn-danger');
    
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
                alert('Por favor selecciona al menos un producto para eliminar');
                return;
            }
            
            abrirModalEliminarMasivo(idsSeleccionados);
        });
    }
}

// Función para abrir modal de eliminar masivo
function abrirModalEliminarMasivo(idsSeleccionados) {
    console.log("Preparando eliminación masiva de productos: ", idsSeleccionados);
    
    const modal = document.getElementById('deleteEmployeeModal');
    
    // Guardar los IDs y modo
    modal.setAttribute('data-ids-seleccionados', JSON.stringify(idsSeleccionados));
    modal.setAttribute('data-modo', 'masivo');
    
    // Actualizar el mensaje del modal
    const modalBody = modal.querySelector('.modal-body p:first-of-type');
    if (modalBody) {
        const cantidad = idsSeleccionados.length;
        modalBody.textContent = cantidad === 1 
            ? '¿Estás seguro de que deseas eliminar este producto?' 
            : `¿Estás seguro de que deseas eliminar ${cantidad} productos?`;
    }
    
    console.log("Abriendo modal de eliminación masiva...");
    
    // Mostrar el modal
    $('#deleteEmployeeModal').modal('show');
}