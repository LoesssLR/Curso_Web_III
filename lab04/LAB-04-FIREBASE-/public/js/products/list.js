var db = firebase.apps[0].firestore();
const tabla = document.getElementById('bodyTbProducts');
const paginationElement = document.getElementById('pagination');
const showingCountElement = document.getElementById('showingCount');
const totalCountElement = document.getElementById('totalCount');

// Variables globales para la paginación
let currentPage = 1;
const productsPerPage = 20;
let totalProducts = 0;
let allProducts = [];

function cargarProductos() {
    db.collection("products").orderBy('productId', 'asc').get().then(function(query){
        allProducts = [];
        totalProducts = query.size;
        totalCountElement.textContent = totalProducts;
        
        // Primero cargar todos los proveedores en un mapa
        var proveedoresMap = {};
        db.collection("suppliers").get().then(function(suppliersQuery) {
            suppliersQuery.forEach(function(supplierDoc) {
                proveedoresMap[supplierDoc.id] = supplierDoc.data().companyName;
            });
            
            // Segundo cargar todas las categorias en un mapa
            var categoriasMap = {};
            db.collection("categories").get().then(function(categoriesQuery) {
                categoriesQuery.forEach(function(categoryDoc) {
                    categoriasMap[categoryDoc.id] = categoryDoc.data().categoryName;
                });
                
                // Almacenar todos los productos con la información completa
                query.forEach(function(doc){
                    const producto = doc.data();
                    const nombreProveedor = proveedoresMap[producto.supplierId] || 'N/A';
                    const nombreCategoria = categoriasMap[producto.categoryId] || 'N/A';
                    
                    allProducts.push({
                        id: doc.id,
                        productId: producto.productId || doc.id,
                        productName: producto.productName || 'N/A',
                        categoryName: nombreCategoria,
                        quantityPerUnit: producto.quantityPerUnit || 'N/A',
                        reorderLevel: producto.reorderLevel || '0',
                        supplierName: nombreProveedor,
                        unitPrice: producto.unitPrice ? producto.unitPrice.toFixed(2) : '0.00',
                        unitsInStock: producto.unitsInStock || '0',
                        unitsOnOrder: producto.unitsOnOrder || '0'
                    });
                });
                
                // Generar paginación y mostrar primera página
                generarPaginacion();
                mostrarPagina(currentPage);
                
            }); // Cierre de categories
        }); // Cierre de suppliers
        
    }).catch(function(error){
        console.error("Error cargando productos: ", error);
        tabla.innerHTML = '<tr><td colspan="11" class="text-center">Error cargando productos</td></tr>';
    });
}

function mostrarPagina(page) {
    currentPage = page;
    const startIndex = (page - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productosPagina = allProducts.slice(startIndex, endIndex);
    
    let salida = "";
    let contador = startIndex + 1;
    
    productosPagina.forEach(function(producto) {
        salida += '<tr>';
        salida += '<td><span class="custom-checkbox"><input type="checkbox" id="checkbox' + contador + '" name="options[]" value="' + producto.id + '"><label for="checkbox' + contador + '"></label></span></td>';
        salida += '<td>' + producto.productId + '</td>';
        salida += '<td>' + producto.productName + '</td>';
        salida += '<td>' + producto.categoryName + '</td>';
        salida += '<td>' + producto.quantityPerUnit + '</td>';
        salida += '<td>' + producto.reorderLevel + '</td>';
        salida += '<td>' + producto.supplierName + '</td>';
        salida += '<td>$' + producto.unitPrice + '</td>';
        salida += '<td>' + producto.unitsInStock + '</td>';
        salida += '<td>' + producto.unitsOnOrder + '</td>';
        salida += '<td>';
        salida += '<a href="#editEmployeeModal" class="edit" data-toggle="modal" data-id="' + producto.id + '"><i class="material-icons" data-toggle="tooltip" title="Edit">&#xE254;</i></a>';
        salida += '<a href="#deleteEmployeeModal" class="delete" data-toggle="modal" data-id="' + producto.id + '"><i class="material-icons" data-toggle="tooltip" title="Delete">&#xE872;</i></a>';
        salida += '</td>';
        salida += '</tr>';
        
        contador++;
    });
    
    tabla.innerHTML = salida;
    
    // Actualizar contador de registros mostrados
    const showingStart = startIndex + 1;
    const showingEnd = Math.min(endIndex, totalProducts);
    showingCountElement.textContent = showingEnd - showingStart + 1;
    
    // Reactivar tooltips después de cargar la tabla
    $('[data-toggle="tooltip"]').tooltip();
    
    // Actualizar estado de la paginación
    actualizarEstadoPaginacion();
}

function generarPaginacion() {
    const totalPages = Math.ceil(totalProducts / productsPerPage);
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
    // Esta función se puede expandir para manejar estados adicionales si es necesario
}

// Cargar productos cuando la página esté lista
document.addEventListener('DOMContentLoaded', function() {
    cargarProductos();
});

// El resto de tu código jQuery se mantiene igual
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