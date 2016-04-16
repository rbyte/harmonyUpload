<?php
$dir = 'files/';

foreach (scandir($dir) as $id => $file) {
	if (!is_dir($dir.$file)) {
		echo $file.";".filesize($dir.$file)."\n";
	}
}
