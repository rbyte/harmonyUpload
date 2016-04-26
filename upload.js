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
		var unique = detectChunkedFiles(files)
		var found = unique.find(
			f => f.name === file.name
			&& f.size === file.size
		)// || isNotCombinable(file)
		file.progressBar.className = found ? "done" : "failure"
	})
}

function combineChunks(file, lastChunkIndex) {
	function fn(xhr) {
		console.log("combine:", xhr.readyState, xhr.status, xhr.responseText)
		checkUploadSuccess(file)
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
function chunkedUpload(file, chunkIndex = 0) {
	var startAtBytes = chunkIndex * config.chunkSizeBytes
	if (file.size < startAtBytes) {
		console.log("done uploading ", file.name, file.size)
		file.progressBar.value = 1
		combineChunks(file, chunkIndex-1)
		return
	}
	
	var xhr = new XMLHttpRequest()
	xhr.addEventListener("error", e => onerror(xhr, file))
	// fine grained progress
	xhr.upload.onprogress = function(e) {
		if (file.size !== 0) {
			file.progressBar.value = config.chunkSizeBytes / file.size * e.loaded / e.total + startAtBytes / file.size
		}
	}
	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			if (xhr.status !== 200) {
				onerror(xhr, file)
				Q.startNext()
			} else {
				//console.log(xhr.readyState, xhr.status, xhr.responseText, chunkIndex)
				// continue with next chunk
				chunkedUpload(file, chunkIndex+1)
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
	var chunk = file.slice(startAtBytes, startAtBytes + config.chunkSizeBytes)
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

function detectChunkedFiles(files) {
	var uniqueFiles = new Set()
	files.forEach(f => {
		var isChunk = f.name.match(/^(.*)\.part\d+$/)
		if (isChunk)
			f.name = isChunk[1] // base name
		f.isChunked = isChunk ? true : false
		uniqueFiles.add(f.name)
	})
	uniqueFiles = Array.from(uniqueFiles).map(f => ({
		name: f,
		size: 0,
		isChunked: files.find(e => e.name === f).isChunked
	}))
	// sum up size
	uniqueFiles.forEach(f => f.size = files
		.filter(e => e.name === f.name)
		.map(e => e.size)
		.reduce((a, b) => a+b, 0)
	)
	return uniqueFiles
}

function printFileList(files) {
	var unique = detectChunkedFiles(files)
	unique.reverse().forEach(file => {
		prependToFileList(file)
	})
}

// 12345 => "12 345"
// 1234567890 => "1 234 567 890"
function toStringInColumnsOf3(number) {
	var split = number.toFixed(0).split("")
	for (var i=split.length-3; i>0; i-=3)
		split.splice(i, 0, " ")
	return split.join("")
}

// maximumCombinableFileSize may be false
var isNotCombinable = (file) => config.maximumCombinableFileSize && file.size > config.maximumCombinableFileSize

var prependToFileList = function(file, withProgress = false) {
	if (file.isChunked === undefined)
		file.isChunked = isNotCombinable(file)
	
	// prepend
	var tr = fileTableBody.insertBefore(document.createElement("tr"), fileTableBody.firstChild)
	// template literal
	tr.innerHTML = `<td>${file.isChunked
			? `${file.name} <i>chunked</i>`
			: `<a href='${config.dir}${file.name}'>${file.name}</a>`}
		</td><td>${toStringInColumnsOf3(file.size/1024)} KiB</td>`;
	
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
			try {
				// [{name: ..., size: ...}, ...]
				printFileList(JSON.parse(xhr.responseText))
			} catch(e) {
				onerror(xhr)
			}
		})
		
		fileselect.addEventListener("change", filesSelected, false)
		
		upload.addEventListener("drop", filesSelected, false)
		upload.addEventListener("dragover", dragHover, false)
		upload.addEventListener("dragleave", dragHover, false)
	})
}

init()
	
})()
