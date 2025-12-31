<?php
    require_once('codes/conexion.inc');

    session_start();

    if (!isset($_SESSION["autenticado"]) || $_SESSION["autenticado"] != "SI") {
        header("Location:login.php");
        exit();
    }

    // join to to get category name along with products
    $AuxSql = "SELECT p.ProductID, p.ProductName, p.UnitPrice, p.UnitsInStock, 
                      c.CategoryName, s.CompanyName as SupplierName
               FROM products p
               INNER JOIN categories c ON p.CategoryID = c.CategoryID
               LEFT JOIN suppliers s ON p.SupplierID = s.SupplierID
               WHERE p.CategoryID = ".$_GET['cod'];

    $Regis = mysqli_query($conex,$AuxSql) or die(mysqli_error($conex));
    $NunFilas = mysqli_num_rows($Regis);
?>	

<!doctype html>
<html lang="en">
<head>
    <?php
        include_once ('sections/head.inc');
    ?>
    <meta http-equiv="refresh" content="180;url=codes/salir.php">
    <title>NorthWind Products</title>
    <script>
        function insproduct(categ) {
            location.href = "insproduct.php?categ=" + categ;
        }
    </script>
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
                <h4 class="card-title">Lista de Productos por Categoría</h4>
            </div>
            <div class="card-body">
                <?php
                    if($NunFilas > 0){
                        echo '<img src="codes/imagen.php?cod='.$_GET['cod'].'" width="25%"><br><br>';
                        echo '<table class="table table-striped">';
                        echo "<thead>";
                        echo "<tr>";
                        echo "<td><strong>Código</strong></td> 
                              <td><strong>Producto</strong></td> 
                              <td><strong>Categoría</strong></td>
                              <td><strong>Proveedor</strong></td>
                              <td><strong>Precio</strong></td>
                              <td><strong>Stock</strong></td>
                              <td colspan='2' align='center'><strong>Acciones</strong></td>";
                        echo "</tr>";
                        echo "</thead><tbody>";
                        while($Tupla = mysqli_fetch_assoc($Regis)){
                            echo "<tr>";
                            echo "<td>".$Tupla['ProductID']."</td>";
                            echo "<td>".$Tupla['ProductName']."</td>";
                            echo "<td>".$Tupla['CategoryName']."</td>";
                            echo "<td>".$Tupla['SupplierName']."</td>";
                            echo "<td>$".number_format($Tupla['UnitPrice'], 2)."</td>";
                            echo "<td>".$Tupla['UnitsInStock']."</td>";
                            echo "<td align='center'><a href='modproduct.php?cod=".$Tupla['ProductID']."&categ=".$_GET['cod']."'>Editar</a></td>";
                            echo "<td align='center'><a href='codes/borproduct.php?cod=".$Tupla['ProductID']."&categ=".$_GET['cod']."' onclick='return confirm(\"¿Está seguro de eliminar este producto?\")'>Borrar</a></td>";
                            echo "</tr>";
                        }
                        echo "</tbody></table>";
                    }else{
                        echo "<h3>No hay productos en esta categoría</h3>";
                    }
                ?>
                <button type="button" class="btn btn-sm btn-primary" onClick="insproduct(<?php echo $_GET['cod']; ?>)">Agregar Producto</button>
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
    if(isset($Regis)){
        mysqli_free_result($Regis);
    }
    mysqli_close($conex);
?>