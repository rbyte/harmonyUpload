<?php

$filename = "uploads/Drawing Dynamic Visualizations.mp4";

$bytesWritten = file_put_contents($filename, "more", FILE_APPEND);

if ($bytesWritten === false) {
	echo "error writing ".$filename.".";
} else {
	echo "wrote ".$bytesWritten." Bytes to ".$filename.".";
}

echo "\nphp script done.";
