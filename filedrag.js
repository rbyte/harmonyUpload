
console.assert(window.File && window.FileList && window.FileReader)

function Output(msg) {
	var m = document.getElementById("messages")
	m.innerHTML = msg + m.innerHTML
}

function FileDragHover(e) {
	e.stopPropagation()
	e.preventDefault()
	e.target.className = (e.type == "dragover" ? "hover" : "")
}

function FileSelectHandler(e) {
	// cancel event and hover styling
	FileDragHover(e)

	// fetch FileList object
	var files = e.target.files || e.dataTransfer.files

	// process all File objects
	for (var i = 0, f; f = files[i]; i++) {
		ParseFile(f)
		chunkedUpload(f)
		//UploadFile(f)
	}
}

function ParseFile(file) {
	Output(
		"<p>File information: <strong>" + file.name +
		"</strong> type: <strong>" + file.type +
		"</strong> size: <strong>" + file.size +
		"</strong> bytes</p>"
	)

	// display an image
	if (file.type.indexOf("image") == 0) {
		var reader = new FileReader()
		reader.onload = function(e) {
			Output(
				"<p><strong>" + file.name + ":</strong><br />" +
				'<img src="' + e.target.result + '" /></p>'
			)
		}
		reader.readAsDataURL(file)
	}

	// display text
	if (file.type.indexOf("text") == 0) {
		var reader = new FileReader()
		reader.onload = function(e) {
			Output(
				"<p><strong>" + file.name + ":</strong></p><pre>" +
				e.target.result.replace(/</g, "&lt;").replace(/>/g, "&gt;") +
				"</pre>"
			)
		}
		reader.readAsText(file)
	}
}

function UploadFile(file) {
	var xhr = new XMLHttpRequest()
	//  file.type == "image/jpeg" && file.size <= document.getElementById("MAX_FILE_SIZE").value
	// create progress bar
	var o = document.getElementById("progress")
	var progress = o.appendChild(document.createElement("p"))
	progress.appendChild(document.createTextNode("upload " + file.name))
	
	xhr.upload.addEventListener("progress", function(e) {
		var pc = parseInt(100 - (e.loaded / e.total * 100))
		progress.style.backgroundPosition = pc + "% 0"
	}, false)

	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			progress.className = (xhr.status == 200 ? "success" : "failure")
		}
		console.log(xhr.readyState, xhr.status, xhr.responseText, xhr.statusText)
	}

	xhr.open("POST", upload.action, true)
	// http://stackoverflow.com/questions/13851918/drag-and-drop-image-upload-not-working-on-server
	// since underscores are deprecated in later Apache releases
	//xhr.setRequestHeader("X_FILENAME", file.name)
	xhr.setRequestHeader("X-FILENAME", file.name)
	xhr.send(file)
}


// the PHP configuration of upload_max_filesize || post_max_size || memory_limit
// limits the size of the file it can receive in one send
function chunkedUpload(file, startAtBytes = 0, chunkSizeBytes = 1000000) {
	var xhr = new XMLHttpRequest()
	if (file.size < startAtBytes) // done
		return
	
	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			progress.className = (xhr.status == 200 ? "success" : "failure")
			console.log(xhr.readyState, xhr.status, xhr.responseText, xhr.statusText)
			// continue with next chunk
			chunkedUpload(file, startAtBytes + chunkSizeBytes, chunkSizeBytes)
		}
	}
	
	xhr.open("POST", upload.action)
	xhr.setRequestHeader("X-FILENAME", file.name)
	if (startAtBytes === 0)
		xhr.setRequestHeader("X-NEWFILE", "yes")
	console.log("size", file.size, startAtBytes, startAtBytes + chunkSizeBytes)
	// File inherits from Blob
	var chunk = file.slice(startAtBytes, startAtBytes + chunkSizeBytes)
	xhr.send(chunk)
}


function getFileList(callback) {
	var xhr = new XMLHttpRequest()
	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			console.assert(xhr.status == 200)
			var files = xhr.responseText.split("\n")
				.filter(e => e !== "")
			files = files.map(e => {
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



var fileselect = document.getElementById("fileselect")
var filedrag = document.getElementById("filedrag")
var submitbutton = document.getElementById("submitbutton")
var upload = document.getElementById("upload")
var xhr = new XMLHttpRequest()
console.assert(xhr.upload)

// file select
fileselect.addEventListener("change", FileSelectHandler, false)
// file drop
filedrag.addEventListener("dragover", FileDragHover, false)
filedrag.addEventListener("dragleave", FileDragHover, false)
filedrag.addEventListener("drop", FileSelectHandler, false)
filedrag.style.display = "block"

// remove submit button
submitbutton.style.display = "none"

getFileList(function(files) {
	console.log(files)
})
