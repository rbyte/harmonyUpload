/*
* matthias.graf@mgrf.de
* GNU GPL v3
* 2016
*/

(function() { // not indented
	
var config
var upload
var fileTable
var fileTableBody
var fileselect
	
var Q = {
	queue: [],
	i: 0
}
Q.push = (e) => Q.queue.push(e)
// does not work, because queue.push uses "this" internally, which is here Q, instead of queue!
//Q.push = Q.queue.push
Q.startNext = () => Q.i < Q.queue.length ? chunkedUpload(Q.queue[Q.i++]) : false
Q.start = () => new Array(config.uploadsToRunInParallel).fill(true).forEach(() => Q.startNext())
	
function dragHover(e) {
	// cancel event and hover styling
	e.stopPropagation()
	e.preventDefault()
	upload.className = (e.type == "dragover" ? "dragover" : "")
	//e.target.className = (e.type == "dragover" ? "dragover" : "")
}

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
	XHR("listFiles.php", function(xhr) {
		var files = JSON.parse(xhr.responseText)
		var found = files.find(
			f => f.name === file.name
			&& f.size === file.size
		)
		file.progressBar.className = found ? "done" : "failure"
	})
}

function combineChunks(file, lastChunkIndex, callback) {
	function fn(xhr) {
		console.log("combine:", xhr.readyState, xhr.status, xhr.responseText)
		callback(file)
		Q.startNext()
	}
	XHR("combineParts.php", fn, {
		"X-FILENAME": file.name,
		"X-FILESIZE": file.size,
		"X-CHUNKINDEX": lastChunkIndex
	})
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
	// fine grained progress
	xhr.upload.onprogress = function(e) {
		if (file.size !== 0) {
			file.progressBar.value = chunkSizeBytes / file.size * e.loaded / e.total + startAtBytes / file.size
		}
	}
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
	
function XHR(phpFileToGet, callback, requestHeaders = {}) {
	var xhr = new XMLHttpRequest()
	console.assert(xhr.upload)
	xhr.addEventListener("error", e => onerror(xhr))
	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			if (xhr.status !== 200) {
				onerror(xhr)
			} else {
				callback(xhr)
			}
		}
	}
	xhr.open("GET", phpFileToGet)
	Object.keys(requestHeaders).forEach(key => {
		xhr.setRequestHeader(key, requestHeaders[key])
	})
	xhr.send()
}
	

function printFileList(files) {
	files.reverse().forEach(file => {
		prependToFileList(file)
	})
}

var prependToFileList = function(file, withProgress = false) {
	var filesizeKiB = (file.size/1024).toFixed(0)
	var willNotBeCombined = file.size > config.maximumCombinableFileSize
	// prepend
	var tr = fileTableBody.insertBefore(document.createElement("tr"), fileTableBody.firstChild)
	tr.innerHTML = "<td><a href='"+config.dir+file.name+"'>"+file.name+(willNotBeCombined ? " (chunked)" : "")+"</a></td><td>"+ filesizeKiB +" KiB</td>"
	// if the progress bar is "string-build" like above, getElementById apparently returns a wrong reference, so we need to manually create it
	if (withProgress) {
		var td = tr.appendChild(document.createElement("td"))
		file.progressBar = td.appendChild(document.createElement("progress"))
	}
}


function init() {
	console.assert(window.File && window.FileList && window.FileReader)
	
	upload = document.getElementById("upload")
	fileTable = document.getElementById("fileTable")
	fileTableBody = fileTable.appendChild(document.createElement("tbody"))
	fileselect = document.getElementById("fileselect")
		
	XHR("config.php", function(xhr) {
		config = JSON.parse(xhr.responseText)
		
		XHR("listFiles.php", function(xhr) {
			// [{name: ..., size: ...}, ...]
			printFileList(JSON.parse(xhr.responseText))
		})
		
		fileselect.addEventListener("change", filesSelected, false)
		
		upload.addEventListener("drop", filesSelected, false)
		upload.addEventListener("dragover", dragHover, false)
		upload.addEventListener("dragleave", dragHover, false)
	})
}

init()
	
})()
