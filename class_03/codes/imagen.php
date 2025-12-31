<?php
    require_once('conexion.inc');

    // Start session environment
    session_start();

    // Open session variable to validate if user is authenticated
    if ($_SESSION["autenticado"] != "SI") {
        header("Location: ../login.php");
        exit(); // end of php script
    }

    // Retrieve category data image to convert a real image
    $AuxSql = sprintf("Select Imagen, Mime from categories where CategoryID = %s", $_GET['cod']);
    $Regis = mysqli_query($conex, $AuxSql) or die(mysqli_error($conex));

    $tupla = mysqli_fetch_assoc($Regis);
    header("Content-Type: ".$tupla['Mime']);
    echo $tupla['Imagen'];
?>


















