<?php
$dir = 'files/';

foreach (scandir($dir) as $id => $file) {
	// exclude directories and hidden files (like .htaccess and .keep)
	if (!is_dir($dir.$file) && $file[0] !== '.') {
		echo $file.";".filesize($dir.$file)."\n";
	}
}
