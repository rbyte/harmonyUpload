<?php
//include 'config.php';
include 'listFiles.php';

$filename = getRequestHeader('HTTP_X_FILENAME');
$i = getRequestHeader('HTTP_X_CHUNKINDEX');

function hasFreeSpaceLeft() {
	global $dir, $chunkSizeBytes, $totalUploadLimit;
	return disk_free_space($dir) > $chunkSizeBytes && totalSpaceUsed() + $chunkSizeBytes < $totalUploadLimit;
}

if (!hasFreeSpaceLeft())
	exit("no free space left!");

file_put_contents(part($i), file('php://input'))
	or exit("error writing ".part($i));
