<?php
include 'config.php';

$filename = getRequestHeader('HTTP_X_FILENAME');
$i = getRequestHeader('HTTP_X_CHUNKINDEX');

file_put_contents(part($i), file('php://input'))
	or exit("error writing ".part($i));
