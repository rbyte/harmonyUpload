<?php
include 'config.php';

$filename = getRequestHeader('HTTP_X_FILENAME');
$chunkIndex = getRequestHeader('HTTP_X_CHUNKINDEX');

$bytesWritten = file_put_contents($dir.$filename.".part".$chunkIndex, file('php://input'));

if ($bytesWritten === false) {
	echo "error writing ".$filename.".";
} else {
	echo "wrote ".$bytesWritten." Bytes to ".$filename.".";
}
