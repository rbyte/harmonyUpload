<?php
// webservers may not allow php to edit files beyond a certain size (e.g. 64MiB)
// file_put_contents(..., file('php://input'), FILE_APPEND);
// may therefore fail with an Internal Server Error, even if the file transfer POST itself is chunked
// interestingly though, running the same APPEND from the command line, instead of through an apache invokation of the same php script, works!
// however, "bypassing" does not work either: exec(): Unable to fork [php exec.php]), for some unknown reason (perhaps endless recursion?!)
// the solution employed here is writing the chunks directly onto the disk with php and then using a bash script to combine the chunks together

assert(isset($_SERVER['HTTP_X_FILENAME']));
$filename = $_SERVER['HTTP_X_FILENAME'];
assert(isset($_SERVER['HTTP_X_CHUNKINDEX']));
$lastChunkIndex = $_SERVER['HTTP_X_CHUNKINDEX'];

$dir = "files/";

// overwrite destination file so we can reliably watch for its creation
exec('[ -f "'.$dir.$filename.'" ] && rm -f "'.$dir.$filename.'"');

if ($lastChunkIndex == "0") {
	// speed up
	exec('mv "'.$dir.$filename.'.part0" "'.$dir.$filename.'"');
	echo "combined (0)!";
} else {
	$cmd = "sh combineParts.sh '".$dir.$filename."' '".$lastChunkIndex."'";
	echo $cmd."\n";
	// circumvent size restrictions by relying on an execute watcher
	// one .execute script may contain multiple snippets
	exec('echo "'.$cmd.'" >> .execute')."\n";
	// does not work because is still subject to restriction
	// echo exec($cmd)."\n";
	
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

