<?php

function getRequestHeader($name) {
	return isset($_SERVER[$name]) ? $_SERVER[$name] : false;
}

function part($i) {
	global $dir, $filename;
	return $dir.$filename.".part".$i;
}

$dir = "files/";

// webservers may not allow php to edit files beyond a certain size (e.g. 64MiB)
// file_put_contents(..., file('php://input'), FILE_APPEND);
// may therefore fail with an Internal Server Error, even if the file transfer POST itself is chunked
// interestingly though, running the same APPEND from the command line, instead of through an apache invokation of the same php script, works!
// the solution employed here is just writing the chunks for a manual combine later

// false if not applicable
$maximumCombinableFileSize = false;
//$maximumCombinableFileSize = 64*1024*1024;

$totalUploadLimit = 1*1024*1024*1024;

$chunkSizeBytes = 1*1024*1024;

$uploadsToRunInParallel = 6;

if (!debug_backtrace()) { // is run directly, not included
	echo json_encode(array(
		'dir' => $dir,
		'maximumCombinableFileSize' => $maximumCombinableFileSize,
		'uploadsToRunInParallel' => $uploadsToRunInParallel,
		'chunkSizeBytes' => $chunkSizeBytes
	));
}
