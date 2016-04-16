<?php

$filename = (isset($_SERVER['HTTP_X_FILENAME']) ? $_SERVER['HTTP_X_FILENAME'] : false);

if ($filename) {
	echo "AJAX.";
	$flag = (isset($_SERVER['HTTP_X_NEWFILE'])) ? 0 : FILE_APPEND;
	$bytesWritten = file_put_contents("uploads/".$filename, file('php://input'), $flag);
	
	if ($bytesWritten === false) {
		echo "error writing ".$filename.".";
	} else {
		echo "wrote ".$bytesWritten." Bytes to ".$filename.".";
	}
} else {
	echo "Submit.";
	$files = $_FILES['fileselect'];
	foreach ($files['error'] as $id => $err) {
		if ($err == UPLOAD_ERR_OK) {
			$fn = $files['name'][$id];
			move_uploaded_file(
				$files['tmp_name'][$id],
				'uploads/' . $fn
			);
			echo "$fn uploaded.";
		}
	}
}

echo "\nphp script done.";
