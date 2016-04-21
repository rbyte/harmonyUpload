<?php
include 'config.php';

$filename = getRequestHeader('HTTP_X_FILENAME');
$lastChunkIndex = getRequestHeader('HTTP_X_CHUNKINDEX');
$fileSize = getRequestHeader('HTTP_X_FILESIZE');

$cmd = "sh combineParts.sh '".$dir.$filename."' '".$lastChunkIndex."'";
echo $cmd."\n";

if (!$maximumCombinableFileSize || $fileSize < $maximumCombinableFileSize) {
	echo exec($cmd)."\n";
} else {
	// script may contain multiple snippets
	exec('echo "'.$cmd.'" >> .execute');
	echo "delayed combining. run: sh .execute";
}
