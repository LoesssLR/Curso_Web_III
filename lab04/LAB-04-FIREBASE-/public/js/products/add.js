var db = firebase.apps[0].firestore();

// Cargar categorías y proveedores cuando se abre el modal
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos cuando se abre el modal de agregar
    $('#addEmployeeModal').on('show.bs.modal', function() {
        cargarCategoriasSelect();
        cargarProveedoresSelect();
    });
});

// Función para cargar categorías en el select
async function cargarCategoriasSelect() {
    const selectCategoria = document.getElementById('addCategory');
    
    try {
        const querySnapshot = await db.collection("categories").orderBy('categoryId', 'asc').get();
        
        // Limpiar opciones existentes excepto la primera (placeholder)
        selectCategoria.innerHTML = '<option value="">Seleccione una categoría</option>';
        
        querySnapshot.forEach(function(doc) {
            const categoria = doc.data();
            const option = document.createElement('option');
            option.value = doc.id; // Usar el ID del documento de Firestore
            option.textContent = `${categoria.categoryId} - ${categoria.categoryName}`;
            option.setAttribute('data-category-id', categoria.categoryId);
            selectCategoria.appendChild(option);
        });
        
        console.log("Categorías cargadas exitosamente");
        
    } catch (error) {
        console.error("Error cargando categorías: ", error);
        alert("Error al cargar las categorías");
    }
}

// Función para cargar proveedores en el select
async function cargarProveedoresSelect() {
    const selectProveedor = document.getElementById('addSupplier');
    
    try {
        const querySnapshot = await db.collection("suppliers").orderBy('supplierId', 'asc').get();
        
        // Limpiar opciones existentes excepto la primera (placeholder)
        selectProveedor.innerHTML = '<option value="">Seleccione un proveedor</option>';
        
        querySnapshot.forEach(function(doc) {
            const proveedor = doc.data();
            const option = document.createElement('option');
            option.value = doc.id; // Usar el ID del documento de Firestore
            option.textContent = `${proveedor.supplierId} - ${proveedor.companyName}`;
            option.setAttribute('data-supplier-id', proveedor.supplierId);
            selectProveedor.appendChild(option);
        });
        
        console.log("Proveedores cargados exitosamente");
        
    } catch (error) {
        console.error("Error cargando proveedores: ", error);
        alert("Error al cargar los proveedores");
    }
}

// Capturar cuando se hace submit del formulario
document.querySelector('#addEmployeeModal form').addEventListener('submit', async function(e) {
    e.preventDefault(); // Prevenir el envío del formulario
    
    try {
        // Obtener datos del formulario
        const productData = await obtenerDatosFormulario();
        console.log("Datos del producto:", productData);
        
        // Validar que se hayan seleccionado categoría y proveedor
        if (!productData.categoryId) {
            alert("Por favor selecciona una categoría");
            return;
        }
        
        if (!productData.supplierId) {
            alert("Por favor selecciona un proveedor");
            return;
        }
        
        // Agregar producto
        await agregarProducto(productData);
        
        // Cerrar modal y recargar tabla
        $('#addEmployeeModal').modal('hide');
        cargarProductos();
        
    } catch (error) {
        console.error("Error en el proceso:", error);
        alert("Error al agregar producto: " + error.message);
    }
});

// Función reutilizable para obtener los datos
async function obtenerDatosFormulario() {
    const ultimoId = await obtenerUltimoId();
    
    // Obtener el ID del documento seleccionado (no el categoryId/supplierId numérico)
    const categoryDocId = document.getElementById('addCategory').value;
    const supplierDocId = document.getElementById('addSupplier').value;
    
    return {
        productId: ultimoId + 1,
        productName: document.getElementById('addProductName').value,
        categoryId: categoryDocId, // ID del documento de Firestore
        quantityPerUnit: document.getElementById('addQuantityPerUnit').value,
        reorderLevel: parseInt(document.getElementById('addMinStock').value) || 0, 
        supplierId: supplierDocId, // ID del documento de Firestore
        unitPrice: parseFloat(document.getElementById('addUnitPrice').value) || 0,
        unitsInStock: parseInt(document.getElementById('addUnitsInStock').value) || 0,
        unitsOnOrder: parseInt(document.getElementById('addUnitsOnOrder').value) || 0
    };
}

function obtenerUltimoId() {
    return db.collection("products")
        .orderBy('productId', 'desc')
        .limit(1)
        .get()
        .then(function(query) {
            if (!query.empty) {
                const ultimoProducto = query.docs[0].data();
                return ultimoProducto.productId || 0;
            } else {
                return 0;
            }
        })
        .catch(function(error) {
            console.error("Error obteniendo último ID: ", error);
            return 0;
        });
}

function agregarProducto(productData) {
    return db.collection("products")
        .add({
            categoryId: productData.categoryId,
            productId: productData.productId,
            productName: productData.productName,
            quantityPerUnit: productData.quantityPerUnit,
            reorderLevel: productData.reorderLevel,
            supplierId: productData.supplierId,
            unitPrice: productData.unitPrice,
            unitsInStock: productData.unitsInStock,
            unitsOnOrder: productData.unitsOnOrder,
            createdAt: firebase.firestore.FieldValue.serverTimestamp() 
        })
        .then(function (docRef) {
            console.log("Producto agregado con ID: " + docRef.id);
            alert("Producto agregado exitosamente");
            limpiar();
            return docRef;
        })
        .catch(function (error) {
            console.error("Error al agregar producto:", error);
            throw error;
        });
}

// Función para limpiar el formulario
function limpiar() {
    document.getElementById('addProductName').value = '';
    document.getElementById('addCategory').value = '';
    document.getElementById('addQuantityPerUnit').value = '';
    document.getElementById('addMinStock').value = '';
    document.getElementById('addSupplier').value = '';
    document.getElementById('addUnitPrice').value = '';
    document.getElementById('addUnitsInStock').value = '';
    document.getElementById('addUnitsOnOrder').value = '';
}