<?php
    // parametros de conexion
    $servidor  = "127.0.0.1:3307";
    $basedatos = "NorthWind";
    $usuario   = "root";
    $contra    = "Utn123**";         

    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    // proceso para conectar con el servidor
    if(!$conex = mysqli_connect($servidor, $usuario, $contra, $basedatos)){
        echo "<h3><font color='red'>Error: No se puede conectar al servidor de MySQL.</font></h3><hr>";
        echo "<strong>Numero........:</strong> " . mysqli_connect_errno() . "<br>";
        echo "<strong>Descripcion...:</strong> " . mysqli_connect_error() . "<br>";
        exit;
    }

    mysqli_set_charset($conex, "utf8");
?>
