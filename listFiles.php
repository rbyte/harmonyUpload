<?php
include 'config.php';

$files = [];
foreach (scandir($dir) as $id => $file) {
	// exclude directories and hidden files (like .htaccess and .keep)
	if (!is_dir($dir.$file) && $file[0] !== '.') {
		// append
		$files[] = array('name' => $file, 'size' => filesize($dir.$file));
	}
}
echo json_encode($files);
