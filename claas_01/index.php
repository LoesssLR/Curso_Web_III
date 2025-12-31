<!DOCTYPE html>
<html lang="en">
	<head>
		<?php
			//invoca cabecera de la página
			include_once('segmentos/encabe.inc');
		?> // se guardan todos los links que tiene la carpeta de segmentos, para ahorarr
        <title>Demostración de PHP</title>
	</head>
	<body class="container">
		<header class="row">
			<?php
				//invoca menu de la página
				include_once('segmentos/menu.inc');
			?> // muestra todas las opciones del menu, pero desde el INC que es un archivo que no se ve
		</header>
		<main class="row">
			<h2><?php echo 'Lectura de un archivo '; ?></h2>

			<?php
				//declara variable de carga
				$archi = file_get_contents('textos/intro.txt'); // lee el archivo en la carpeta textos
				// tambien se puede usar para APIS	

				//primera letra en mayúscula
				$archi = ucfirst($archi);

				//convierte enter en br
				$archi = nl2br($archi);
				// los lenguajes no interpretan los espacios en blanco, por lo que se convierte un enter en un br

				//imprime contenido
				echo '<h4>Introducción a PHP</h4><br>';

                echo $archi;
				// basicamente todo el contenido del archivo se guarda en la variable $archi y luego se imprime
			?>
		</main>
		<footer class="row pie">
			<?php
				//llama al pie de página
				include_once('segmentos/pie.inc');
			?> // muestra el pie de pagina que esta en el INC, lo que nos permite nos escribir eso individualmente en cada pagina
		</footer>
	</body>
</html>

// se necesita un servidor de apache o nginx
// se necesita tener instalado php

// las variables empiezan con $, no requiere tipo, no es necesario declararlas
// no es necesario el punto y coma al final de cada linea, pero es buena practica poner








