<?php

assert(isset($_SERVER['HTTP_X_FILENAME']));
$filename = $_SERVER['HTTP_X_FILENAME'];
assert(isset($_SERVER['HTTP_X_CHUNKINDEX']));
$chunkIndex = $_SERVER['HTTP_X_CHUNKINDEX'];

$dir = "files/";

//$flag = (isset($_SERVER['HTTP_X_NEWFILE'])) ? 0 : FILE_APPEND;

$bytesWritten = file_put_contents($dir.$filename.".part".$chunkIndex, file('php://input'));

if ($bytesWritten === false) {
	echo "error writing ".$filename.".";
} else {
	echo "wrote ".$bytesWritten." Bytes to ".$filename.".";
}
