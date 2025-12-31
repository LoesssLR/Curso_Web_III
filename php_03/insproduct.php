<?php
    require_once('codes/conexion.inc');
    session_start();

    if (!isset($_SESSION["autenticado"]) || $_SESSION["autenticado"] != "SI") {
        header("Location:login.php");
        exit();
    }

    $categoryID = $_GET['categ'];

    if ((isset($_POST["OC_insertar"])) && ($_POST["OC_insertar"] == "formita")) {
        $auxSql = sprintf("insert into products(ProductName, CategoryID, SupplierID, QuantityPerUnit, UnitPrice, UnitsInStock, UnitsOnOrder, ReorderLevel, Discontinued) values('%s', %d, %d, '%s', %f, %d, %d, %d, %d)",
            $_POST['txtNombre'],
            $_POST['txtCategoria'],
            $_POST['txtProveedor'],
            $_POST['txtCantidad'],
            $_POST['txtPrecio'],
            $_POST['txtStock'],
            $_POST['txtOrden'],
            $_POST['txtReorden'],
            $_POST['txtDescontinuado']);

        $Regis = mysqli_query($conex,$auxSql) or die(mysqli_error($conex));
        header("Location: lstproductos.php?cod=" . $_POST['txtCategoria']);
        exit;
    }

    // get list of suppliers
    $sqlSuppliers = "SELECT SupplierID, CompanyName FROM suppliers ORDER BY CompanyName";
    $suppliers = mysqli_query($conex, $sqlSuppliers) or die(mysqli_error($conex));

    // get list of categories
    $sqlCategories = "SELECT CategoryID, CategoryName FROM categories ORDER BY CategoryName";
    $categories = mysqli_query($conex, $sqlCategories) or die(mysqli_error($conex));
?>	

<!doctype html>
<html lang="en">
<head>
    <?php
        include_once ('sections/head.inc');
    ?>
    <meta http-equiv="refresh" content="180;url=codes/salir.php">
    <title>Create Product</title>
</head>
<body class="container-fluid">
    <header class="row">
        <?php
            include_once ('sections/header.inc');
        ?>
    </header>
    
    <main class="row contenido">
        <div class="card tarjeta">
            <div class="card-header">
                <h4 class="card-title">Insertar Producto</h4>
            </div>
            <div class="card-body">
                <form method="post" name="formita" action="<?php echo $_SERVER['PHP_SELF'] . '?categ=' . $categoryID; ?>">
                    <table class="table table-bordered">
                        <tr>
                            <td><strong>Nombre del Producto</strong></td>
                            <td><input type="text" name="txtNombre" size="40" maxlength="40" required></td>
                        </tr>
                        <tr>
                            <td><strong>Categoría</strong></td>
                            <td>
                                <select name="txtCategoria" class="form-select" required>
                                    <?php
                                        while($cat = mysqli_fetch_assoc($categories)){
                                            $selected = ($cat['CategoryID'] == $categoryID) ? 'selected' : '';
                                            echo "<option value='".$cat['CategoryID']."' $selected>".$cat['CategoryName']."</option>";
                                        }
                                    ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Proveedor</strong></td>
                            <td>
                                <select name="txtProveedor" class="form-select" required>
                                    <option value="">Seleccione un proveedor</option>
                                    <?php
                                        while($sup = mysqli_fetch_assoc($suppliers)){
                                            echo "<option value='".$sup['SupplierID']."'>".$sup['CompanyName']."</option>";
                                        }
                                    ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Cantidad por Unidad</strong></td>
                            <td><input type="text" name="txtCantidad" size="20" maxlength="20" value=""></td>
                        </tr>
                        <tr>
                            <td><strong>Precio Unitario</strong></td>
                            <td><input type="number" name="txtPrecio" step="0.01" min="0" value="0" required></td>
                        </tr>
                        <tr>
                            <td><strong>Unidades en Stock</strong></td>
                            <td><input type="number" name="txtStock" min="0" value="0" required></td>
                        </tr>
                        <tr>
                            <td><strong>Unidades en Orden</strong></td>
                            <td><input type="number" name="txtOrden" min="0" value="0" required></td>
                        </tr>
                        <tr>
                            <td><strong>Nivel de Reorden</strong></td>
                            <td><input type="number" name="txtReorden" min="0" value="0" required></td>
                        </tr>
                        <tr>
                            <td><strong>Descontinuado</strong></td>
                            <td>
                                <select name="txtDescontinuado" class="form-select" required>
                                    <option value="0">No</option>
                                    <option value="1">Sí</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <input type="submit" value="Aceptar" class="btn btn-primary">
                                <a href="lstproductos.php?cod=<?php echo $categoryID; ?>" class="btn btn-secondary">Cancelar</a>
                            </td>
                        </tr>
                    </table>
                    <input type="hidden" name="OC_insertar" value="formita">
                </form>
            </div>
        </div>	
    </main>
    
    <footer class="row pie">
        <?php
            include_once ('sections/foot.inc');
        ?>
    </footer>
</body>
</html>

<?php
    if(isset($suppliers)){
        mysqli_free_result($suppliers);
    }
    if(isset($categories)){
        mysqli_free_result($categories);
    }
    mysqli_close($conex);
?>
