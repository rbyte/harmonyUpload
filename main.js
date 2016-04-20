/*
* matthias.graf@mgrf.de
* GNU GPL v3
* 2016
*/

(function() { // not indented

function dragHover(e) {
	// cancel event and hover styling
	e.stopPropagation()
	e.preventDefault()
	upload.className = (e.type == "dragover" ? "dragover" : "")
	//e.target.className = (e.type == "dragover" ? "dragover" : "")
}

var Q = {
	queue: [],
	i: 0
}
Q.push = (e) => Q.queue.push(e)
// TODO why does this not work?!
//Q.push = Q.queue.push
Q.startNext = () => Q.i < Q.queue.length ? chunkedUpload(Q.queue[Q.i++]) : false
Q.start = (inParallel = 4) => new Array(inParallel).fill(true).forEach(() => Q.startNext())

function filesSelected(e) {
	dragHover(e)
	var files = e.target.files || e.dataTransfer.files
	console.log("uploading these files: ", files)
	for (var i = 0, file; file = files[i]; i++) {
		prependToFileList(file, true)
		Q.push(file)
	}
	Q.start()
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

function combineChunks(file, lastChunkIndex, callback) {
	var xhr = new XMLHttpRequest()
	xhr.addEventListener("error", e => onerror(xhr, file))
	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			if (xhr.status !== 200) {
				onerror(xhr, file)
			} else {
				callback(file)
				Q.startNext()
			}
		}
	}
	xhr.open("GET", "combineParts.php")
	xhr.setRequestHeader("X-FILENAME", file.name)
	xhr.setRequestHeader("X-FILESIZE", file.size)
	xhr.setRequestHeader("X-CHUNKINDEX", lastChunkIndex)
	xhr.send()
}
	
var onerror = function(xhr, file) {
	if (file) {
		file.progressBar.className = "failure"
		Q.startNext()
	}
	console.log("error:", xhr.readyState, xhr.status, xhr.responseText, xhr.responseURL)
}

// the PHP configuration of upload_max_filesize || post_max_size || memory_limit limits the size of the file it can receive in one send
function chunkedUpload(file, chunkSizeBytes = 1000000, chunkIndex = 0) {
	var startAtBytes = chunkIndex * chunkSizeBytes
	if (file.size < startAtBytes) {
		console.log("done uploading ", file.name, file.size)
		file.progressBar.value = 1
		combineChunks(file, chunkIndex-1, checkUploadSuccess)
		return
	}
	
	var xhr = new XMLHttpRequest()
	xhr.addEventListener("error", e => onerror(xhr, file))
	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			if (xhr.status !== 200) {
				onerror(xhr, file)
				Q.startNext()
			} else {
				console.log(xhr.readyState, xhr.status, xhr.responseText, chunkIndex)
				// continue with next chunk
				chunkedUpload(file, chunkSizeBytes, chunkIndex+1)
			}
		}
	}
	
	xhr.open("POST", "upload.php")
	xhr.setRequestHeader("X-FILENAME", file.name)
	xhr.setRequestHeader("Content-Type", "multipart\/form-data")
	xhr.setRequestHeader("X-CHUNKINDEX", chunkIndex)
	
	// directories can be dropped. do not know how to distingush them from empty files
	file.progressBar.value = file.size === 0 ? 0 : startAtBytes / file.size
	// File inherits from Blob
	var chunk = file.slice(startAtBytes, startAtBytes + chunkSizeBytes)
	xhr.send(chunk)
}

function getFileList(callback) {
	var xhr = new XMLHttpRequest()
	console.assert(xhr.upload)
	xhr.addEventListener("error", e => onerror(xhr))
	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			if (xhr.status !== 200) {
				onerror(xhr)
			} else {
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
	}
	xhr.open("GET", "listFiles.php")
	xhr.send()
}

function printFileList(files) {
	files.reverse().forEach(file => {
		prependToFileList(file)
	})
}

var prependToFileList = function(file, withProgress = false) {
	var filesizeKiB = (file.size/1024).toFixed(0)
	// prepend
	var tr = fileTableBody.insertBefore(document.createElement("tr"), fileTableBody.firstChild)
	tr.innerHTML = "<td><a href='files/"+file.name+"'>"+file.name+"</a></td><td>"+ filesizeKiB +" KiB</td>"
	// if the progress bar is "string-build" like above, getElementById apparently returns a wrong reference, so we need to manually create it
	if (withProgress) {
		var td = tr.appendChild(document.createElement("td"))
		file.progressBar = td.appendChild(document.createElement("progress"))
	}
}

var upload
var fileTable
var fileTableBody

function init() {
	console.assert(window.File && window.FileList && window.FileReader)
	
	upload = document.getElementById("upload")
	fileTable = document.getElementById("fileTable")
	fileTableBody = fileTable.appendChild(document.createElement("tbody"))
	var fileselect = document.getElementById("fileselect")
	
	getFileList(function(files) {
		printFileList(files)
	})
	
	fileselect.addEventListener("change", filesSelected, false)
	
	upload.addEventListener("drop", filesSelected, false)
	upload.addEventListener("dragover", dragHover, false)
	upload.addEventListener("dragleave", dragHover, false)
}

init()
	
})()
