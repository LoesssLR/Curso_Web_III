Laboratorio 04 - Firebase
El clases pasadas, usted desarrolló una tarea en PHP para la manipulación de una base de datos llamada NorthWind, en dicho trabajo, se montaron los siguientes módulos:

Usuarios:
Registro de un nuevo usuario.
Autenticación del usuario.
Cerrar sesión del usuario.
Categorías:
Listar las categorías existentes
Insertar, modificar y borrar categorías existentes.
Listar los productos de una categoría específica.
La manipulación de la imagen por categoría.
Productos:
Listar los productos existentes
Insertar, modificar y borrar productos existentes.

Clientes:
Registrar, modificar y borrar (lógico) clientes
Crear cuenta de acceso al cliente en la tienda de northwind
Login del cliente
Podrá mostrar los datos de categorías y productos pero no podá modificarlos.
¿Qué se solicita?

Haga una trasformación de dicho proyecto a una propuesta para ser ejecutada en la plataforma de Google-Firebase, de forma que la aplicación final realice los mismos procesos que su propuesta en PHP cumplía hace un par se semanas atras.
Para que este proyecto funcione, debe realizar un proceso de migración de datos, el cual debe poder obtener la data original y trasladarla al Google-FireStore:
Debe poder trasladar todas las tablas originales
Solo para el caso de Orders, se solicitara que la factura sea un documento completo, en otras palabras que incluya los datos referenciados como parte de la colección (Order Details, Employee, Name and Conctact Name from Customers) así como los totales percividos por línea de compra, incluyendo el nombre del producto.
Se agrega a este trabajo los recursos necesarios para desarrollar la propuesta..


DEPENDENCIAS PARA LA MIGRACION: 
# 1. Ir a la raíz del proyecto
cd C:\Users\sr331\OneDrive\Escritorio\LAB-04-FIREBASE

# 2. Instalar dependencias UNA SOLA VEZ aquí
npm install firebase-admin mysql2 dotenv

# 3. Ejecuta migration.js desde cualquier carpeta
node public/js/migration.js

asegurarse de tener el .en con: 
# Database Configuration

# Firebase
el project id
FIREBASE y su key 
y su client email.

luego para ejecutar la migracion, hay que dirigirse a  cd public -> cd js -> node migration.js 



