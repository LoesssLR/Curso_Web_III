// Esperar a que Firebase esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si Firebase está disponible
    if (typeof firebase === 'undefined') {
        console.error('Firebase no está cargado');
        return;
    }

    // Obtener referencia a Firestore
    const db = firebase.firestore();
    const productsContainer = document.getElementById('productsContainer');

    // Imágenes placeholder para productos (puedes cambiarlas por las tuyas)
    const productImages = [
        'https://m.media-amazon.com/images/I/41DXH11QLGL._SS400_.jpg', // Condimentos y especias (Gumbo Mix)
        'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&h=400&fit=crop', // Mermelada/Spread de frutas
        'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&h=400&fit=crop'  // Peras secas/frutas deshidratadas
    ];

    // Función para obtener el estado del stock
    function getStockStatus(unitsInStock, reorderLevel) {
        const stock = parseInt(unitsInStock) || 0;
        const minStock = parseInt(reorderLevel) || 0;

        if (stock === 0) {
            return { text: 'Agotado', class: 'out-of-stock' };
        } else if (stock <= minStock) {
            return { text: `Stock bajo: ${stock} unidades`, class: 'low-stock' };
        } else {
            return { text: `${stock} en stock`, class: '' };
        }
    }

    // Función para truncar texto
    function truncateText(text, maxLength) {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }

    // Función para crear una tarjeta de producto
    function createProductCard(product, index) {
        const stockStatus = getStockStatus(product.unitsInStock, product.reorderLevel);
        const imageUrl = productImages[index % productImages.length];
        
        return `
            <div class="col-md-4 mb-4">
                <div class="product-card">
                    <div class="product-image">
                        <img src="${imageUrl}" alt="${product.productName}">
                        ${product.unitsInStock > 50 ? '<span class="product-badge">Popular</span>' : ''}
                    </div>
                    <div class="product-content">
                        <div class="product-category">${product.categoryName || 'General'}</div>
                        <h4 class="product-title">${truncateText(product.productName, 30)}</h4>
                        <p class="product-description">
                            ${product.quantityPerUnit || 'Producto de calidad premium disponible en nuestra tienda'}
                        </p>
                        <div class="product-footer">
                            <div class="product-price">
                                $${parseFloat(product.unitPrice).toFixed(2)}
                                <span>/unidad</span>
                            </div>
                            <div class="product-stock ${stockStatus.class}">
                                ${stockStatus.text}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Cargar productos desde Firebase
    function loadProducts() {
        productsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">Cargando...</span>
                </div>
                <p class="mt-3">Cargando productos...</p>
            </div>
        `;

        // Obtener productos y categorías
        Promise.all([
            db.collection("products").orderBy('productId', 'asc').limit(3).get(),
            db.collection("categories").get()
        ]).then(([productsQuery, categoriesQuery]) => {
            // Crear mapa de categorías
            const categoriesMap = {};
            categoriesQuery.forEach(doc => {
                categoriesMap[doc.id] = doc.data().categoryName;
            });

            // Procesar productos
            let productsHTML = '';
            let index = 0;

            if (productsQuery.empty) {
                productsHTML = `
                    <div class="col-12 text-center py-5">
                        <div class="feature-icon">📦</div>
                        <h3>No hay productos disponibles</h3>
                        <p class="text-muted">Pronto agregaremos productos a nuestro catálogo</p>
                    </div>
                `;
            } else {
                productsQuery.forEach(doc => {
                    const productData = doc.data();
                    const product = {
                        id: doc.id,
                        productId: productData.productId || doc.id,
                        productName: productData.productName || 'Producto sin nombre',
                        categoryName: categoriesMap[productData.categoryId] || 'General',
                        quantityPerUnit: productData.quantityPerUnit,
                        unitPrice: productData.unitPrice || 0,
                        unitsInStock: productData.unitsInStock || 0,
                        reorderLevel: productData.reorderLevel || 0
                    };

                    productsHTML += createProductCard(product, index);
                    index++;
                });
            }

            productsContainer.innerHTML = productsHTML;

        }).catch(error => {
            console.error("Error al cargar productos:", error);
            productsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="feature-icon">⚠️</div>
                    <h3>Error al cargar productos</h3>
                    <p class="text-danger">Por favor, intenta recargar la página</p>
                </div>
            `;
        });
    }

    // Cargar productos cuando Firebase esté listo
    if (firebase.apps.length > 0) {
        loadProducts();
    } else {
        // Esperar a que Firebase se inicialice
        setTimeout(loadProducts, 1000);
    }

    // Event listener para el botón "Ver Más"
    const ctaButton = document.querySelector('.btn-cta');
    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            e.preventDefault();
             window.location.href = 'signUpUsers.html'; 
        });
    }
});