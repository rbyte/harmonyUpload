<?php
// webservers may not allow php to edit files beyond a certain size (e.g. 64MiB)
// file_put_contents(..., file('php://input'), FILE_APPEND);
// may therefore fail with an Internal Server Error, even if the file transfer POST itself is chunked
// interestingly though, running the same APPEND from the command line, instead of through an apache invokation of the same php script, works!
// however, "bypassing" does not work either: exec(): Unable to fork [php exec.php]), for some unknown reason (perhaps endless recursion?!)
// the solution employed here is writing the chunks directly onto the disk with php and then using a bash script to combine the chunks together

function getRequestHeader($name) {
	assert(isset($_SERVER[$name]));
	return $_SERVER[$name];
}

$filename = getRequestHeader('HTTP_X_FILENAME');
$lastChunkIndex = getRequestHeader('HTTP_X_CHUNKINDEX');
$fileSize = getRequestHeader('HTTP_X_FILESIZE');

$dir = "files/";
$cmd = "sh combineParts.sh '".$dir.$filename."' '".$lastChunkIndex."'";
echo $cmd."\n";

if ($fileSize < 64000000) {
	// subject to size restriction
	echo exec($cmd)."\n";
} else {
	// circumvent size restrictions by relying on an execute watcher
	// overwrite destination file so we can reliably watch for its creation
	echo exec('[ -f "'.$dir.$filename.'" ] && rm -f "'.$dir.$filename.'"');
	
	// one .execute script may contain multiple snippets
	echo exec('echo "'.$cmd.'" >> .execute')."\n";
	// wait until watcher is done
	$timeout = 120;
	$now = 0;
	while ($now++ < $timeout) {
		if (file_exists($dir.$filename)) {
			echo "combined!";
			break;
		}
		sleep(1);
	}
}
