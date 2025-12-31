<?php
    require_once('conexion.inc');
    session_start();

    if (!isset($_SESSION["autenticado"]) || $_SESSION["autenticado"] != "SI") {
        header("Location:../login.php");
        exit();
    }

    $productID = $_GET['cod'];
    $categoryID = $_GET['categ'];

    // verify if there are order details associated with this product
    $checkSql = "SELECT COUNT(*) as total FROM order_details WHERE ProductID = " . $productID;
    $checkResult = mysqli_query($conex, $checkSql) or die(mysqli_error($conex));
    $row = mysqli_fetch_assoc($checkResult);

    if ($row['total'] > 0) {
        // if there are dependencies, don't delete the product, its the best practice
        mysqli_close($conex);
        echo "<script>
                alert('No se puede eliminar el producto porque tiene " . $row['total'] . " orden(es) de venta asociada(s) en la tabla order_details.');
                window.location.href = '../lstproductos.php?cod=" . $categoryID . "';
              </script>";
        exit();
    }

    // if there are no dependencies, proceed with deletion
    $auxSql = "DELETE FROM products WHERE ProductID = " . $productID;
    $regis = mysqli_query($conex, $auxSql) or die(mysqli_error($conex));

    mysqli_close($conex);
    
    header("Location: ../lstproductos.php?cod=" . $categoryID);
    exit();
?>
