<?php
    require_once('codes/conexion.inc');
    session_start();

    if (!isset($_SESSION["autenticado"]) || $_SESSION["autenticado"] != "SI") {
        header("Location:login.php");
        exit();
    }

    $productID = $_GET['cod'];
    $categoryID = $_GET['categ'];

    if((isset($_POST["OC_Modi"])) && ($_POST["OC_Modi"] == "formita")) {
        $auxSql = sprintf("update products set ProductName = '%s', CategoryID = %d, SupplierID = %d, QuantityPerUnit = '%s', UnitPrice = %f, UnitsInStock = %d, UnitsOnOrder = %d, ReorderLevel = %d, Discontinued = %d where ProductID = %d",
            $_POST['txtNombre'],
            $_POST['txtCategoria'],
            $_POST['txtProveedor'],
            $_POST['txtCantidad'],
            $_POST['txtPrecio'],
            $_POST['txtStock'],
            $_POST['txtOrden'],
            $_POST['txtReorden'],
            $_POST['txtDescontinuado'],
            $_POST['ocCodigo']);

        $Regis = mysqli_query($conex,$auxSql) or die(mysqli_error($conex));
        header("Location: lstproductos.php?cod=" . $_POST['txtCategoria']);
        exit;
    }

    // Obtener datos del producto
    $auxSql = "SELECT * FROM products WHERE ProductID = " . $productID;
    $regis = mysqli_query($conex, $auxSql) or die(mysqli_error($conex));
    $product = mysqli_fetch_assoc($regis);

    // Obtener lista de proveedores
    $sqlSuppliers = "SELECT SupplierID, CompanyName FROM suppliers ORDER BY CompanyName";
    $suppliers = mysqli_query($conex, $sqlSuppliers) or die(mysqli_error($conex));

    // Obtener lista de categorías
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
    <title>Modify Product</title>
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
                <h4 class="card-title">Modificar Producto</h4>
            </div>
            <div class="card-body">
                <form method="post" name="formita" action="<?php echo $_SERVER['PHP_SELF'] . '?cod=' . $productID . '&categ=' . $categoryID; ?>">
                    <table class="table table-bordered">
                        <tr>
                            <td><strong>Código</strong></td>
                            <td><input type="text" name="txtCodigo" size="5" value="<?php echo $product['ProductID']; ?>" readonly class="form-control-plaintext"></td>
                        </tr>
                        <tr>
                            <td><strong>Nombre del Producto</strong></td>
                            <td><input type="text" name="txtNombre" size="40" maxlength="40" value="<?php echo $product['ProductName']; ?>" required></td>
                        </tr>
                        <tr>
                            <td><strong>Categoría</strong></td>
                            <td>
                                <select name="txtCategoria" class="form-select" required>
                                    <?php
                                        while($cat = mysqli_fetch_assoc($categories)){
                                            $selected = ($cat['CategoryID'] == $product['CategoryID']) ? 'selected' : '';
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
                                    <?php
                                        while($sup = mysqli_fetch_assoc($suppliers)){
                                            $selected = ($sup['SupplierID'] == $product['SupplierID']) ? 'selected' : '';
                                            echo "<option value='".$sup['SupplierID']."' $selected>".$sup['CompanyName']."</option>";
                                        }
                                    ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Cantidad por Unidad</strong></td>
                            <td><input type="text" name="txtCantidad" size="20" maxlength="20" value="<?php echo $product['QuantityPerUnit']; ?>"></td>
                        </tr>
                        <tr>
                            <td><strong>Precio Unitario</strong></td>
                            <td><input type="number" name="txtPrecio" step="0.01" min="0" value="<?php echo $product['UnitPrice']; ?>" required></td>
                        </tr>
                        <tr>
                            <td><strong>Unidades en Stock</strong></td>
                            <td><input type="number" name="txtStock" min="0" value="<?php echo $product['UnitsInStock']; ?>" required></td>
                        </tr>
                        <tr>
                            <td><strong>Unidades en Orden</strong></td>
                            <td><input type="number" name="txtOrden" min="0" value="<?php echo $product['UnitsOnOrder']; ?>" required></td>
                        </tr>
                        <tr>
                            <td><strong>Nivel de Reorden</strong></td>
                            <td><input type="number" name="txtReorden" min="0" value="<?php echo $product['ReorderLevel']; ?>" required></td>
                        </tr>
                        <tr>
                            <td><strong>Descontinuado</strong></td>
                            <td>
                                <select name="txtDescontinuado" class="form-select" required>
                                    <option value="0" <?php echo ($product['Discontinued'] == 0) ? 'selected' : ''; ?>>No</option>
                                    <option value="1" <?php echo ($product['Discontinued'] == 1) ? 'selected' : ''; ?>>Sí</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2">
                                <input type="submit" value="Actualizar" class="btn btn-primary">
                                <a href="lstproductos.php?cod=<?php echo $categoryID; ?>" class="btn btn-secondary">Cancelar</a>
                            </td>
                        </tr>
                    </table>
                    <input type="hidden" name="OC_Modi" value="formita">
                    <input type="hidden" name="ocCodigo" value="<?php echo $product['ProductID']; ?>">
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
    if(isset($regis)){
        mysqli_free_result($regis);
    }
    if(isset($suppliers)){
        mysqli_free_result($suppliers);
    }
    if(isset($categories)){
        mysqli_free_result($categories);
    }
    mysqli_close($conex);
?>
