require('dotenv').config({ path: '../../.env' });
const admin = require('firebase-admin');
const mysql = require('mysql2/promise');
const serviceAccount = require('../../service-account-key.json');


// Configuración de Firebase
// Preferir la clave local (service-account-key.json) si existe y tiene project_id;
// si no, intentar cargar desde variables de entorno (.env).
const credentialObject = (serviceAccount && typeof serviceAccount.project_id === 'string' && serviceAccount.project_id.length > 0)
  ? serviceAccount
  : {
    type: 'service_account',
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL
  };

if (!credentialObject || typeof credentialObject.project_id !== 'string' || credentialObject.project_id.length === 0) {
  console.error(' Firebase credential missing project_id. Define service-account-key.json with project_id or set FIREBASE_PROJECT_ID in .env');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(credentialObject)
});
const db = admin.firestore();

// Allow Firestore to ignore undefined properties (safer) and also
// provide a sanitizer to remove undefined values from objects before writing.
db.settings({ ignoreUndefinedProperties: true });

function sanitize(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj
      .map((v) => sanitize(v))
      .filter((v) => v !== undefined);
  }
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      if (v === null) {
        out[k] = null;
        continue;
      }
      if (Array.isArray(v)) {
        out[k] = sanitize(v);
        continue;
      }
      if (typeof v === 'object') {
        out[k] = sanitize(v);
        continue;
      }
      out[k] = v;
    }
    return out;
  }
  return obj;
}

// Connecting to MySQL - it should be configured -> .env
const mysqlConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
};




async function migrateSuppliers(mysqlConnection) {
  console.log(' Migrando proveedores...');
  
  try {
    const [suppliers] = await mysqlConnection.execute('SELECT * FROM suppliers');
    
    for (const supplier of suppliers) {
      const supplierData = {
        supplierId: supplier.SupplierID || supplier.supplier_id,
        companyName: supplier.CompanyName || supplier.company_name,
        contactName: supplier.ContactName || supplier.contact_name,
        contactTitle: supplier.ContactTitle || supplier.contact_title,
        address: {
          street: supplier.Address || supplier.address,
          city: supplier.City || supplier.city,
          region: supplier.Region || supplier.region,
          postalCode: supplier.PostalCode || supplier.postal_code,
          country: supplier.Country || supplier.country
        },
        phone: supplier.Phone || supplier.phone,
        homepage: supplier.HomePage || supplier.homepage,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Campos opcionales
      if (supplier.Fax) supplierData.fax = supplier.Fax;

      const docId = (supplier.SupplierID || supplier.supplier_id).toString();
      await db.collection('suppliers').doc(docId).set(sanitize(supplierData));
    }
    
    console.log(`${suppliers.length} proveedores migrados`);
  } catch (error) {
    console.log(' Error migrando proveedores:', error.message);
  }
} 

async function migrateData() {
  let mysqlConnection;
  
  try {
    console.log(' INICIANDO MIGRACIÓN COMPLETA...');
    
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('Conectado a MySQL');
    
    // 1. Migrate Customers
    await migrateCustomers(mysqlConnection);
    
    // 2. Migrate Employees
    await migrateEmployees(mysqlConnection);
    
    // 3. Migrate Products
    await migrateProducts(mysqlConnection);
    
    // 4. Migrate Categories (if exists)
    await migrateCategories(mysqlConnection);
    
    // 5. Migrate Orders with special structure
    await migrateOrders(mysqlConnection);
    // 6. Migrate Suppliers
     await migrateSuppliers(mysqlConnection);
    
    console.log(' MIGRACIÓN COMPLETADA EXITOSAMENTE');
    
  } catch (error) {
    console.error(' Error en la migración:', error);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log(' Conexión a MySQL cerrada');
    }
  }
}

async function migrateCustomers(mysqlConnection) {
  console.log('Migrando clientes...');
  
  try {
    const [customers] = await mysqlConnection.execute('SELECT * FROM customers');
    
    for (const customer of customers) {
      const customerData = {
        customerId: customer.CustomerID || customer.customer_id,
        companyName: customer.CompanyName || customer.company_name,
        contactName: customer.ContactName || customer.contact_name,
        contactTitle: customer.ContactTitle || customer.contact_title,
        address: {
          street: customer.Address || customer.address,
          city: customer.City || customer.city,
          region: customer.Region || customer.region,
          postalCode: customer.PostalCode || customer.postal_code,
          country: customer.Country || customer.country
        },
        phone: customer.Phone || customer.phone,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      // Add optional fields
      if (customer.Fax) customerData.fax = customer.Fax;

      const docId = customer.CustomerID || customer.customer_id;
  await db.collection('customers').doc(docId).set(sanitize(customerData));
    }
    
    console.log(` ${customers.length} clientes migrados`);
  } catch (error) {
    console.log(' Error migrando clientes:', error.message);
  }
}

async function migrateEmployees(mysqlConnection) {
  console.log(' Migrando empleados...');
  
  try {
    const [employees] = await mysqlConnection.execute('SELECT * FROM employees');
    
    for (const employee of employees) {
      const employeeData = {
        employeeId: employee.EmployeeID || employee.employee_id,
        firstName: employee.FirstName || employee.first_name,
        lastName: employee.LastName || employee.last_name,
        title: employee.Title || employee.title,
        birthDate: employee.BirthDate ? 
          admin.firestore.Timestamp.fromDate(new Date(employee.BirthDate)) : null,
        hireDate: employee.HireDate ? 
          admin.firestore.Timestamp.fromDate(new Date(employee.HireDate)) : null,
        address: {
          street: employee.Address || employee.address,
          city: employee.City || employee.city,
          region: employee.Region || employee.region,
          postalCode: employee.PostalCode || employee.postal_code,
          country: employee.Country || employee.country
        },
        homePhone: employee.HomePhone || employee.home_phone,
        extension: employee.Extension || employee.extension,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docId = (employee.EmployeeID || employee.employee_id).toString();
  await db.collection('employees').doc(docId).set(sanitize(employeeData));
    }
    
    console.log(`${employees.length} empleados migrados`);
  } catch (error) {
    console.log('Error migrando empleados:', error.message);
  }
}

async function migrateProducts(mysqlConnection) {
  console.log(' Migrando productos...');
  
  try {
    const [products] = await mysqlConnection.execute('SELECT * FROM products');
    
    for (const product of products) {
      const productData = {
        productId: product.ProductID || product.product_id,
        productName: product.ProductName || product.product_name,
        supplierId: product.SupplierID || product.supplier_id,
        categoryId: product.CategoryID || product.category_id,
        quantityPerUnit: product.QuantityPerUnit || product.quantity_per_unit,
        unitPrice: parseFloat(product.UnitPrice || product.unit_price || 0),
        unitsInStock: product.UnitsInStock || product.units_in_stock || 0,
        unitsOnOrder: product.UnitsOnOrder || product.units_on_order || 0,
        reorderLevel: product.ReorderLevel || product.reorder_level || 0,
        discontinued: product.Discontinued || product.discontinued || false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docId = (product.ProductID || product.product_id).toString();
  await db.collection('products').doc(docId).set(sanitize(productData));
    }
    
    console.log(` ${products.length} productos migrados`);
  } catch (error) {
    console.log(' Error migrando productos:', error.message);
  }
}

async function migrateCategories(mysqlConnection) {
  console.log(' Migrando categorías...');
  
  try {
    const [categories] = await mysqlConnection.execute('SELECT * FROM categories');
    
    for (const category of categories) {
      const categoryData = {
        categoryId: category.CategoryID || category.category_id,
        categoryName: category.CategoryName || category.category_name,
        description: category.Description || category.description,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const docId = (category.CategoryID || category.category_id).toString();
  await db.collection('categories').doc(docId).set(sanitize(categoryData));
    }
    
    console.log(` ${categories.length} categorías migradas`);
  } catch (error) {
    console.log('Error migrando categorías:', error.message);
  }
}

async function migrateOrders(mysqlConnection) {
  console.log('Migrando órdenes...');
  
  try {
    // Obtaining all orders with their relations
    const [orders] = await mysqlConnection.execute(`
      SELECT 
        o.OrderID,
        o.CustomerID,
        o.EmployeeID,
        o.OrderDate,
        o.RequiredDate,
        o.ShippedDate,
        o.ShipVia,
        o.Freight,
        o.ShipName,
        o.ShipAddress,
        o.ShipCity,
        o.ShipRegion,
        o.ShipPostalCode,
        o.ShipCountry,
        c.CompanyName as CustomerCompanyName,
        c.ContactName as CustomerContactName,
        c.ContactTitle as CustomerContactTitle,
        c.Phone as CustomerPhone,
        e.FirstName as EmployeeFirstName,
        e.LastName as EmployeeLastName,
        e.Title as EmployeeTitle
      FROM orders o
      LEFT JOIN customers c ON o.CustomerID = c.CustomerID
      LEFT JOIN employees e ON o.EmployeeID = e.EmployeeID
      ORDER BY o.OrderID ASC
      LIMIT 50
    `);
    
    console.log(`Encontradas ${orders.length} órdenes para migrar`);

    for (const order of orders) {
      // Obtaining order details
      const [orderDetails] = await mysqlConnection.execute(`
        SELECT 
          od.*,
          p.ProductName,
          c.CategoryName
        FROM order_details od
        LEFT JOIN products p ON od.ProductID = p.ProductID
        LEFT JOIN categories c ON p.CategoryID = c.CategoryID
        WHERE od.OrderID = ?
      `, [order.OrderID]);
      
      // Calculating totals and preparing order items
      const orderItems = [];
      let subtotal = 0;
      
      for (const detail of orderDetails) {
        const lineTotal = (detail.UnitPrice || detail.unit_price) * 
                         (detail.Quantity || detail.quantity) * 
                         (1 - (detail.Discount || detail.discount || 0));
        subtotal += lineTotal;
        
        orderItems.push({
          productId: (detail.ProductID || detail.product_id).toString(),
          productName: detail.ProductName || detail.product_name,
          unitPrice: parseFloat(detail.UnitPrice || detail.unit_price || 0),
          quantity: detail.Quantity || detail.quantity,
          discount: parseFloat(detail.Discount || detail.discount || 0),
          lineTotal: parseFloat(lineTotal.toFixed(2)),
          category: detail.CategoryName || detail.category_name
        });
      }
      
      const total = subtotal + parseFloat(order.Freight || order.freight || 0);
      
      // Creating order document in Firestore
      const orderDoc = {
        orderId: order.OrderID || order.order_id,
        customerId: order.CustomerID || order.customer_id,
        employeeId: (order.EmployeeID || order.employee_id).toString(),
        orderDate: admin.firestore.Timestamp.fromDate(new Date(order.OrderDate || order.order_date)),
        requiredDate: order.RequiredDate ? 
          admin.firestore.Timestamp.fromDate(new Date(order.RequiredDate)) : null,
        shippedDate: order.ShippedDate ? 
          admin.firestore.Timestamp.fromDate(new Date(order.ShippedDate)) : null,
        shipVia: order.ShipVia || order.ship_via,
        freight: parseFloat(order.Freight || order.freight || 0),
        shipName: order.ShipName || order.ship_name,
        shipAddress: {
          street: order.ShipAddress || order.ship_address,
          city: order.ShipCity || order.ship_city,
          region: order.ShipRegion || order.ship_region,
          postalCode: order.ShipPostalCode || order.ship_postal_code,
          country: order.ShipCountry || order.ship_country
        },
        customerInfo: {
          companyName: order.CustomerCompanyName,
          contactName: order.CustomerContactName,
          contactTitle: order.CustomerContactTitle,
          phone: order.CustomerPhone
        },
        employeeInfo: {
          firstName: order.EmployeeFirstName,
          lastName: order.EmployeeLastName,
          title: order.EmployeeTitle
        },
        orderItems: orderItems,
        totals: {
          subtotal: parseFloat(subtotal.toFixed(2)),
          freight: parseFloat(order.Freight || order.freight || 0),
          total: parseFloat(total.toFixed(2))
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: order.ShippedDate ? 'shipped' : 'pending'
      };
      
      const docId = (order.OrderID || order.order_id).toString();
  await db.collection('orders').doc(docId).set(sanitize(orderDoc));
      console.log(`Orden ${docId} migrada con ${orderItems.length} items`);
    }
    
    console.log(` ${orders.length} órdenes migradas exitosamente`);
  } catch (error) {
    console.log(' Error migrando órdenes:', error.message);
  }
}

// Executing the migration
migrateData();