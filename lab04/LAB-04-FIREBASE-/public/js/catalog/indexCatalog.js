
document.addEventListener('DOMContentLoaded', function() {


    const db = firebase.firestore();
    const auth = firebase.auth();

    const productsContainer = document.getElementById('productsContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const supplierFilter = document.getElementById('supplierFilter');
    const applyFilters = document.getElementById('applyFilters');
    const clearFilters = document.getElementById('clearFilters');
    const userWelcome = document.getElementById('userWelcome');
    const userAvatar = document.getElementById('userAvatar');

    let products = [];
    let categories = new Set();
    let suppliers = new Set();

    // Verificar autenticación
    auth.onAuthStateChanged((user) => {
        if (user) {
            userWelcome.textContent = `Bienvenido, ${user.displayName || user.email.split('@')[0]}`;
            userAvatar.textContent = (user.displayName || user.email[0]).toUpperCase();
            loadProducts();
        } else {
            window.location.href = 'login.html';
        }
    });

    // Cargar productos desde Firestore - VERSIÓN CORREGIDA
    async function loadProducts() {
        try {
            loadingState.style.display = 'flex';
            productsContainer.innerHTML = '';
            emptyState.style.display = 'none';

            
            const productsSnapshot = await db.collection('products').get();
           
            
            products = [];
            categories.clear();
            suppliers.clear();

            // Cargar datos adicionales
            const categoriesSnapshot = await db.collection('categories').get();
            const suppliersSnapshot = await db.collection('suppliers').get();

         

            // Crear mapas buscando por categoryId y supplierId en los datos
            const categoriesMap = new Map();
            const suppliersMap = new Map();

            // Mapear categorías - BUSCAR POR categoryId EN LOS DATOS
            categoriesSnapshot.forEach(doc => {
                const categoryData = doc.data();
                
                
                // Buscar el ID numérico en los datos
                const categoryId = categoryData.categoryId || categoryData.id;
                const categoryName = categoryData.categoryName || 
                                   categoryData.name || 
                                   categoryData.nombre || 
                                   'Sin categoría';
                
                if (categoryId) {
                    categoriesMap.set(categoryId.toString(), categoryName);
                }
                // También mapear por ID del documento por si acaso xd
                categoriesMap.set(doc.id, categoryName);
            });

            // Mapear proveedores - BUSCAR POR supplierId EN LOS DATOS
            suppliersSnapshot.forEach(doc => {
                const supplierData = doc.data();
                
                
                // Buscar el ID numérico en los datos
                const supplierId = supplierData.supplierId || supplierData.id;
                const supplierName = supplierData.companyName || 
                                   supplierData.name || 
                                   supplierData.nombre || 
                                   supplierData.supplierName ||
                                   'Sin proveedor';
                
                if (supplierId) {
                    suppliersMap.set(supplierId.toString(), supplierName);
                }
                // También mapear por ID del documento por si acaso xd
                suppliersMap.set(doc.id, supplierName);
            });

          

            // Procesar productos
            let processedCount = 0;
            let missingCategoryCount = 0;
            let missingSupplierCount = 0;

            productsSnapshot.forEach(doc => {
                const producto = doc.data();
               

                // Obtener IDs de categoría y proveedor
                const categoryId = (producto.categoryId || producto.categoryID || producto.categoriaId || '').toString();
                const supplierId = (producto.supplierId || producto.supplierID || producto.proveedorId || '').toString();

                console.log(`   → Category ID: "${categoryId}"`);
                console.log(`   → Supplier ID: "${supplierId}"`);

                // Buscar en el mapa - probar diferentes formatos
                let nombreCategoria = 'Sin categoría';
                let nombreProveedor = 'Sin proveedor';

                // Buscar categoría
                if (categoryId && categoriesMap.has(categoryId)) {
                    nombreCategoria = categoriesMap.get(categoryId);
                } else if (categoryId) {
                    // Intentar buscar sin espacios o con diferentes formatos
                    const cleanCategoryId = categoryId.trim();
                    if (categoriesMap.has(cleanCategoryId)) {
                        nombreCategoria = categoriesMap.get(cleanCategoryId);
                    } else {
                        missingCategoryCount++;
                        console.warn(`Categoría no encontrada para ID: "${categoryId}" en producto: ${producto.productName}`);
                    }
                }

                // Buscar proveedor
                if (supplierId && suppliersMap.has(supplierId)) {
                    nombreProveedor = suppliersMap.get(supplierId);
                } else if (supplierId) {
                    // Intentar buscar sin espacios o con diferentes formatos
                    const cleanSupplierId = supplierId.trim();
                    if (suppliersMap.has(cleanSupplierId)) {
                        nombreProveedor = suppliersMap.get(cleanSupplierId);
                    } else {
                        missingSupplierCount++;
                        console.warn(`Proveedor no encontrado para ID: "${supplierId}" en producto: ${producto.productName}`);
                    }
                }

                const productData = {
                    id: doc.id,
                    productId: producto.productId || doc.id,
                    productName: producto.productName || producto.name || 'Producto sin nombre',
                    categoryName: nombreCategoria,
                    categoryId: categoryId,
                    supplierId: supplierId,
                    quantityPerUnit: producto.quantityPerUnit || 'N/A',
                    reorderLevel: producto.reorderLevel || 0,
                    supplierName: nombreProveedor,
                    unitPrice: producto.unitPrice ? parseFloat(producto.unitPrice).toFixed(2) : '0.00',
                    unitsInStock: producto.unitsInStock || 0,
                    unitsOnOrder: producto.unitsOnOrder || 0,
                    discontinued: producto.discontinued || false
                };

                products.push(productData);
                categories.add(nombreCategoria);
                suppliers.add(nombreProveedor);
            });

         

            // Actualizar filtros
            updateFilters();
            
            // Mostrar productos
            displayProducts(products);

        } catch (error) {
            showError('Error al cargar los productos: ' + error.message);
        } finally {
            loadingState.style.display = 'none';
        }
    }

    // Función alternativa si la anterior no funciona
    async function loadProductsAlternative() {
        try {
            
            
            // Cargar todo sin relaciones primero
            const [productsSnapshot, categoriesSnapshot, suppliersSnapshot] = await Promise.all([
                db.collection('products').get(),
                db.collection('categories').get(),
                db.collection('suppliers').get()
            ]);

      
            
         

            // Procesar sin relaciones complejas
            products = [];
            categories.clear();
            suppliers.clear();

            productsSnapshot.forEach(doc => {
                const producto = doc.data();
                const productData = {
                    id: doc.id,
                    productName: producto.productName || 'Producto sin nombre',
                    categoryName: `Categoría ${producto.categoryId || 'N/A'}`,
                    supplierName: `Proveedor ${producto.supplierId || 'N/A'}`,
                    unitPrice: producto.unitPrice ? parseFloat(producto.unitPrice).toFixed(2) : '0.00',
                    unitsInStock: producto.unitsInStock || 0,
                    unitsOnOrder: producto.unitsOnOrder || 0,
                    quantityPerUnit: producto.quantityPerUnit || 'N/A',
                    discontinued: producto.discontinued || false
                };

                products.push(productData);
                categories.add(productData.categoryName);
                suppliers.add(productData.supplierName);
            });

            updateFilters();
            displayProducts(products);

        } catch (error) {
         
            showError('Error al cargar los productos');
        }
    }

    // Actualizar opciones de filtros
    function updateFilters() {
        // Limpiar filtros
        categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
        supplierFilter.innerHTML = '<option value="">Todos los proveedores</option>';

        

        // Agregar categorías
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        // Agregar proveedores
        suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier;
            option.textContent = supplier;
            supplierFilter.appendChild(option);
        });
    }

    // Mostrar productos en el grid
    function displayProducts(productsToShow) {
        productsContainer.innerHTML = '';

        

        if (productsToShow.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        productsToShow.forEach(product => {
            const productCard = createProductCard(product);
            productsContainer.appendChild(productCard);
        });
    }

    // Crear tarjeta de producto
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';

        // Determinar estado del stock
        const stockStatus = getStockStatus(product.unitsInStock, product.reorderLevel);
        const stockClass = `stock-${stockStatus.level}`;

        card.innerHTML = `
            <div class="product-image">
                <i class="fas fa-laptop"></i>
                ${product.discontinued ? '<div class="product-badge" style="background: var(--danger-color); color: white;">Descontinuado</div>' : ''}
                ${stockStatus.level === 'low' ? '<div class="product-badge" style="background: var(--danger-color); color: white;">Stock Bajo</div>' : ''}
            </div>
            <div class="product-content">
                <div class="product-category">${product.categoryName}</div>
                <h3 class="product-name">${product.productName}</h3>
                <div class="product-supplier">Proveedor: ${product.supplierName}</div>
                <div class="product-price">₡${product.unitPrice}</div>
                
                <div class="product-stock">
                    <div class="stock-info">
                        <span class="stock-label">En Stock</span>
                        <span class="stock-value ${stockClass}">${product.unitsInStock} unidades</span>
                    </div>
                    <div class="stock-info">
                        <span class="stock-label">En Pedido</span>
                        <span class="stock-value">${product.unitsOnOrder} unidades</span>
                    </div>
                </div>

                <div class="product-details">
                    <small class="text-muted">Cantidad por unidad: ${product.quantityPerUnit}</small>
                </div>

                <div class="product-actions mt-3">
                    <button class="btn-add-cart" ${product.discontinued || product.unitsInStock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        ${product.discontinued ? 'No Disponible' : (product.unitsInStock === 0 ? 'Agotado' : 'Agregar al Carrito')}
                    </button>
                    <button class="btn-favorite">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
            </div>
        `;

        return card;
    }

    // Determinar estado del stock
    function getStockStatus(unitsInStock, reorderLevel) {
        if (unitsInStock === 0) {
            return { level: 'low', text: 'Agotado' };
        } else if (unitsInStock <= reorderLevel) {
            return { level: 'low', text: 'Stock Bajo' };
        } else if (unitsInStock <= reorderLevel * 2) {
            return { level: 'medium', text: 'Stock Medio' };
        } else {
            return { level: 'high', text: 'En Stock' };
        }
    }

    // Filtrar productos
    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedSupplier = supplierFilter.value;

        const filteredProducts = products.filter(product => {
            const matchesSearch = product.productName.toLowerCase().includes(searchTerm) ||
                                 product.categoryName.toLowerCase().includes(searchTerm) ||
                                 product.supplierName.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !selectedCategory || product.categoryName === selectedCategory;
            const matchesSupplier = !selectedSupplier || product.supplierName === selectedSupplier;

            return matchesSearch && matchesCategory && matchesSupplier;
        });

    
        displayProducts(filteredProducts);
    }

    // Event Listeners
    applyFilters.addEventListener('click', filterProducts);
    clearFilters.addEventListener('click', () => {
        searchInput.value = '';
        categoryFilter.value = '';
        supplierFilter.value = '';
      
        displayProducts(products);
    });

    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
    supplierFilter.addEventListener('change', filterProducts);

    // Mostrar error
    function showError(message) {
        productsContainer.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle"></i> ${message}
                </div>
                <div class="mt-3">
                    <button class="btn btn-primary mr-2" onclick="location.reload()">
                        <i class="fas fa-redo"></i> Reintentar
                    </button>
                    <button class="btn btn-secondary" onclick="loadProductsAlternative()">
                        <i class="fas fa-cog"></i> Método Alternativo
                    </button>
                </div>
            </div>
        `;
    }

    // Hacer la función accesible globalmente para debugging
    window.loadProductsAlternative = loadProductsAlternative;
});