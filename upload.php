<?php

$filename = (isset($_SERVER['HTTP_X_FILENAME']) ? $_SERVER['HTTP_X_FILENAME'] : false);

//assert($filename);

$flag = (isset($_SERVER['HTTP_X_NEWFILE'])) ? 0 : FILE_APPEND;
$bytesWritten = file_put_contents("files/".$filename, file('php://input'), $flag);

if ($bytesWritten === false) {
	echo "error writing ".$filename.".";
} else {
	echo "wrote ".$bytesWritten." Bytes to ".$filename.".";
}


echo "\nphp script done.";
