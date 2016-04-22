<?php
include 'config.php';

$files = [];
foreach (scandir($dir) as $id => $filename) {
	// exclude directories and hidden files (like .htaccess and .keep)
	if (!is_dir($dir.$filename) && $filename[0] !== '.') {
		// append
		$files[] = array('name' => $filename, 'size' => filesize($dir.$filename));
	}
}
echo json_encode($files);
