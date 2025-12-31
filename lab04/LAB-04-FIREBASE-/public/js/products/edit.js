var db = firebase.apps[0].firestore();

console.log("Script edit.js cargado");

// Solo agregar el event listener UNA VEZ cuando el documento está listo
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando edit.js");
    inicializarFormularioEdicion();
});

// Event listener para botones de editar (delegación de eventos)
// Este se ejecuta INMEDIATAMENTE al cargar el script, no espera DOMContentLoaded
document.addEventListener('click', function(e) {
    // Buscar si el clic fue en un botón edit o dentro de él
    const editBtn = e.target.closest('a.edit');
    
    if (editBtn) {
        e.preventDefault();
        e.stopPropagation();
        
        const productId = editBtn.getAttribute('data-id');
        console.log("Botón editar clickeado, ID:", productId);
        
        if (productId) {
            abrirModalEditar(productId);
        } else {
            console.error("No se encontró data-id en el botón edit");
        }
    }
});

// Función para cargar categorías en el select de edición
async function cargarCategoriasSelectEdicion() {
    const selectCategoria = document.getElementById('editCategory');
    
    try {
        const querySnapshot = await db.collection("categories").orderBy('categoryId', 'asc').get();
        
        // Limpiar opciones existentes excepto la primera (placeholder)
        selectCategoria.innerHTML = '<option value="">Seleccione una categoría</option>';
        
        querySnapshot.forEach(function(doc) {
            const categoria = doc.data();
            const option = document.createElement('option');
            option.value = doc.id; // ID del documento de Firestore
            option.textContent = `${categoria.categoryId} - ${categoria.categoryName}`;
            option.setAttribute('data-category-id', categoria.categoryId);
            selectCategoria.appendChild(option);
        });
        
        console.log("Categorías cargadas en modal de edición");
        return true;
        
    } catch (error) {
        console.error("Error cargando categorías: ", error);
        return false;
    }
}

// Función para cargar proveedores en el select de edición
async function cargarProveedoresSelectEdicion() {
    const selectProveedor = document.getElementById('editSupplier');
    
    try {
        const querySnapshot = await db.collection("suppliers").orderBy('supplierId', 'asc').get();
        
        // Limpiar opciones existentes excepto la primera (placeholder)
        selectProveedor.innerHTML = '<option value="">Seleccione un proveedor</option>';
        
        querySnapshot.forEach(function(doc) {
            const proveedor = doc.data();
            const option = document.createElement('option');
            option.value = doc.id; // ID del documento de Firestore
            option.textContent = `${proveedor.supplierId} - ${proveedor.companyName}`;
            option.setAttribute('data-supplier-id', proveedor.supplierId);
            selectProveedor.appendChild(option);
        });
        
        console.log("Proveedores cargados en modal de edición");
        return true;
        
    } catch (error) {
        console.error("Error cargando proveedores: ", error);
        return false;
    }
}

function forzarCerrarModales() {
    // Cerrar todos los modales de Bootstrap si alguno sigue abierto
    try {
        $('#editEmployeeModal').modal('hide');
        $('#deleteEmployeeModal').modal('hide');
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


// Función para inicializar el formulario de edición
function inicializarFormularioEdicion() {
    const editForm = document.querySelector('#editEmployeeModal form');

    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const productId = document.getElementById('editEmployeeModal').getAttribute('data-doc-id');
                if (!productId) {
                    throw new Error("ID de producto no encontrado para actualización");
                }
                
                const categoryDocId = document.getElementById('editCategory').value;
                const supplierDocId = document.getElementById('editSupplier').value;
                
                if (!categoryDocId) {
                    alert("Por favor selecciona una categoría");
                    return;
                }
                
                if (!supplierDocId) {
                    alert("Por favor selecciona un proveedor");
                    return;
                }
                
                const datosActualizados = {
                    categoryId: categoryDocId,
                    productName: document.getElementById('editProductName').value,
                    quantityPerUnit: document.getElementById('editQuantityPerUnit').value,
                    reorderLevel: parseInt(document.getElementById('editMinStock').value) || 0,
                    supplierId: supplierDocId,
                    unitPrice: parseFloat(document.getElementById('editUnitPrice').value) || 0,
                    unitsInStock: parseInt(document.getElementById('editUnitsInStock').value) || 0,
                    unitsOnOrder: parseInt(document.getElementById('editUnitsOnOrder').value) || 0
                };
                
                console.log("Datos actualizados del producto:", datosActualizados);
                
                await actualizarProducto(productId, datosActualizados);
                
                $('#editEmployeeModal').modal('hide');
                forzarCerrarModales();      // 👈 por si acaso se acumularon capas
                cargarProductos();
                
            } catch (error) {
                console.error("Error en el proceso de actualización:", error);
                alert("Error al actualizar producto: " + error.message);
            }
        });
    }

    // Botón cancelar edición con confirm
    const btnCancelEdit = document.querySelector('#editEmployeeModal .btn-cancel-edit');
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', function(e) {
            e.preventDefault();
            const salir = confirm("¿Desea dejar de editar el producto?\nLos cambios no guardados se perderán.");
            if (salir) {
                limpiarEdicion();
                forzarCerrarModales();
            }
        });
    }

    // (Opcional) también puedes enganchar aquí el cancelar del delete
    const btnCancelDelete = document.querySelector('#deleteEmployeeModal .btn-cancel-delete');
    if (btnCancelDelete) {
        btnCancelDelete.addEventListener('click', function(e) {
            e.preventDefault();
            const salir = confirm("¿Desea cancelar la eliminación del producto?");
            if (salir) {
                forzarCerrarModales();
            }
        });
    }
}

async function actualizarProducto(productId, datosActualizados) {
    return db.collection("products").doc(productId).update({
        categoryId: datosActualizados.categoryId,
        productName: datosActualizados.productName,
        quantityPerUnit: datosActualizados.quantityPerUnit,
        reorderLevel: datosActualizados.reorderLevel,
        supplierId: datosActualizados.supplierId,
        unitPrice: datosActualizados.unitPrice,
        unitsInStock: datosActualizados.unitsInStock,
        unitsOnOrder: datosActualizados.unitsOnOrder,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(function() {
        console.log("Producto actualizado con ID: ", productId);
        limpiarEdicion();
        alert("Producto actualizado exitosamente");
        return;
    }).catch(function(error) {
        console.error("Error actualizando producto: ", error);
        alert("Error al actualizar el producto");
        throw error;
    });
}

async function abrirModalEditar(productId) {
    console.log("Cargando producto para editar: ", productId);
    
    try {
        // Primero cargar los selectores
        await Promise.all([
            cargarCategoriasSelectEdicion(),
            cargarProveedoresSelectEdicion()
        ]);
        
        // Luego obtener los datos del producto
        const doc = await db.collection("products").doc(productId).get();
        
        if (doc.exists) {
            const producto = doc.data();
            console.log("Datos del producto cargados:", producto);
            
            // Llenar el formulario de edición
            document.getElementById('editProductId').value = producto.productId || '';
            document.getElementById('editProductName').value = producto.productName || '';
            
            // Seleccionar la categoría (ahora es el ID del documento de Firestore)
            document.getElementById('editCategory').value = producto.categoryId || '';
            
            document.getElementById('editQuantityPerUnit').value = producto.quantityPerUnit || '';
            document.getElementById('editMinStock').value = producto.reorderLevel || 0;
            
            // Seleccionar el proveedor (ahora es el ID del documento de Firestore)
            document.getElementById('editSupplier').value = producto.supplierId || '';
            
            document.getElementById('editUnitPrice').value = producto.unitPrice || 0;
            document.getElementById('editUnitsInStock').value = producto.unitsInStock || 0;
            document.getElementById('editUnitsOnOrder').value = producto.unitsOnOrder || 0;
            
            // Guardar el ID del documento de Firestore (no el productId)
            document.getElementById('editEmployeeModal').setAttribute('data-doc-id', productId);
            
            console.log("Formulario llenado, abriendo modal...");
            
            // AHORA SÍ mostrar el modal
            $('#editEmployeeModal').modal({
                backdrop: false,
                keyboard: true,
                show: true
            });
        } else {
            console.error("El documento no existe");
            alert("Producto no encontrado");
        }
    } catch (error) {
        console.error("Error cargando producto:", error);
        alert("Error al cargar el producto: " + error.message);
    }
}

function limpiarEdicion() {
    const form = document.querySelector('#editEmployeeModal form');
    if (form) {
        form.reset();
    }
    document.getElementById('editEmployeeModal').removeAttribute('data-doc-id');
}