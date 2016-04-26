<?php
//include 'config.php';
include 'listFiles.php';

$filename = getRequestHeader('HTTP_X_FILENAME');
$i = getRequestHeader('HTTP_X_CHUNKINDEX');

function hasFreeSpaceLeft() {
	global $dir, $chunkSizeBytes, $totalUploadLimit;
	// disk_free_space(): Value too large for defined data type
	$result = @disk_free_space($dir);
	$result = $result ? $result > $chunkSizeBytes : true;
	return $result && totalSpaceUsed() + $chunkSizeBytes < $totalUploadLimit;
}

if (!hasFreeSpaceLeft())
	exit("no free space left!");

file_put_contents(part($i), file('php://input'))
	or exit("error writing ".part($i));
