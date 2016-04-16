
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
	for (var i = 0, f; f = files[i]; i++) {
		chunkedUpload(f)
	}
}

// the PHP configuration of upload_max_filesize || post_max_size || memory_limit
// limits the size of the file it can receive in one send
function chunkedUpload(file, chunkSizeBytes = 1000000, startAtBytes = 0) {
	var xhr = new XMLHttpRequest()
	if (file.size < startAtBytes) {
		console.log("done uploading ", file.name, file.size)
		progressP.className = "success"
		return
	}
	
	xhr.onreadystatechange = function(e) {
		if (xhr.readyState == 4) {
			console.log(xhr.readyState, xhr.status, xhr.responseText)
			// continue with next chunk
			
			setTimeout(function() {
				chunkedUpload(file, chunkSizeBytes, startAtBytes + chunkSizeBytes)
			}, 200)
			
		}
	}
	
	xhr.open("POST", "upload.php")
	xhr.setRequestHeader("X-FILENAME", file.name)
	xhr.setRequestHeader("Content-Type", "multipart\/form-data")
	if (startAtBytes === 0)
		xhr.setRequestHeader("X-NEWFILE", "yes")
	
	var pc = (1 - startAtBytes / file.size) * 100
	console.log(pc)
	progressP.style.backgroundPosition = pc + "% 0"
	
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
var fileList = document.getElementById("fileList")
var print = str => fileList.innerHTML += str

fileselect.addEventListener("change", filesSelected, false)
filedrag.addEventListener("drop", filesSelected, false)

filedrag.addEventListener("dragover", dragHover, false)
filedrag.addEventListener("dragleave", dragHover, false)
filedrag.style.display = "block"


var progressElem = document.getElementById("progress")
var progressP = progressElem.appendChild(document.createElement("p"))
progressP.appendChild(document.createTextNode("uploading"))


getFileList(function(files) {
	files.forEach(file => print("<li><a href='files/"+file.name+"'>"
		+ file.name + "</a> " + file.size +" Bytes</li>")
	)
})
