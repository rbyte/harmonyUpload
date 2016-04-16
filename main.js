
console.assert(window.File && window.FileList && window.FileReader)

function dragHover(e) {
	// cancel event and hover styling
	e.stopPropagation()
	e.preventDefault()
	e.target.className = (e.type == "dragover" ? "hover" : "")
}

function filesSelected(e) {
	dragHover(e)
	var files = e.target.files || e.dataTransfer.files
	console.log("uploading these files: ", files)
	for (var i = 0, file; file = files[i]; i++) {
		prependToFileList(file, true)
		chunkedUpload(file)
	}
}

function checkUploadSuccess(file) {
	getFileList(function(files) {
		if (files.find(f => f.name === file.name && f.size === file.size)) {
			file.progressBar.className = "done"
		} else {
			file.progressBar.className = "failure"
		}
	})
}

// the PHP configuration of upload_max_filesize || post_max_size || memory_limit limits the size of the file it can receive in one send
function chunkedUpload(file, chunkSizeBytes = 1000000, startAtBytes = 0) {
	var xhr = new XMLHttpRequest()
	if (file.size < startAtBytes) {
		console.log("done uploading ", file.name, file.size)
		file.progressBar.value = 1
		checkUploadSuccess(file)
		return
	}
	
	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			if (xhr.status !== 200) {
				file.progressBar.className = "failure"
				console.log("error:", xhr.readyState, xhr.status, xhr.responseText)
			} else {
				// continue with next chunk
				//setTimeout(function() {
				chunkedUpload(file, chunkSizeBytes, startAtBytes + chunkSizeBytes)
				//}, 200)
			}
		}
	}
	
	xhr.open("POST", "upload.php")
	xhr.setRequestHeader("X-FILENAME", file.name)
	xhr.setRequestHeader("Content-Type", "multipart\/form-data")
	if (startAtBytes === 0)
		xhr.setRequestHeader("X-NEWFILE", "yes")
	// directories can be dropped. do not know how to distingush them from empty files
	file.progressBar.value = file.size === 0 ? 0 : startAtBytes / file.size
	// File inherits from Blob
	var chunk = file.slice(startAtBytes, startAtBytes + chunkSizeBytes)
	xhr.send(chunk)
}

function getFileList(callback) {
	var xhr = new XMLHttpRequest()
	console.assert(xhr.upload)
	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			console.assert(xhr.status == 200)
			// filename;filesize\n...
			// bla.txt;213\nSecond.jpg;21234\n
			var files = xhr.responseText
				.split("\n")
				.filter(e => e !== "")
				.map(e => {
					var x = e.split(";")
					console.assert(x.length === 2)
					var size = Number(x[1])
					console.assert(!isNaN(size))
					return {name: x[0], size: size}
				})
			callback(files)
		}
	}
	xhr.open("GET", "listFiles.php")
	xhr.send()
}

var prependToFileList = function(file, withProgress = false) {
	var filesizeKiB = (file.size/1024).toFixed(0)
	// prepend
	var tr = fileList.insertBefore(document.createElement("tr"), fileList.firstChild)
	tr.innerHTML = "<td><a href='files/"+file.name+"'>"+file.name+"</a></td><td>"+ filesizeKiB +" KiB</td>"
	// if the progress bar is "string-build" like above, getElementById apparently returns a wrong reference, so we need to manually create it
	if (withProgress) {
		var td = tr.appendChild(document.createElement("td"))
		file.progressBar = td.appendChild(document.createElement("progress"))
	}
}

var fileselect = document.getElementById("fileselect")
var filedrag = document.getElementById("filedrag")
var fileList = document.getElementById("fileList")

fileselect.addEventListener("change", filesSelected, false)
filedrag.addEventListener("drop", filesSelected, false)

filedrag.addEventListener("dragover", dragHover, false)
filedrag.addEventListener("dragleave", dragHover, false)


function printFileList(files) {
	files.reverse().forEach(file => {
		prependToFileList(file)
	})
}

getFileList(function(files) {
	printFileList(files)
})
