var timeoutID2;
var timeout2 = 500;

function setupDelete() {
	timeoutID2 = window.setTimeout(pollExistence(), timeout2)
}

function pollExistence() {
	var httpRequest = new XMLHttpRequest();
	
	if (!httpRequest) {
		alert('Giving up - cannot create XMLHttp instance');
		return false;
	}
	var id = document.getElementById('chat_id').value;
	var url = "/chatroom/" + id;
	console.log(url);
	httpRequest.onreadystatechange = function() { existenceHandler(httpRequest) };
	httpRequest.open("GET", url);	
	httpRequest.send();

}

function existenceHandler(httpRequest) {
	if (httpRequest.readyState === XMLHttpRequest.DONE) {
		if (httpRequest.status === 200) {
			console.log(httpRequest.status);
			timeoutID2 = window.setTimeout(pollExistence, timeout2);
		}else{
			console.log(httpRequest.status);
			alert("This room has been terminated!");
			window.location.href = "/";
		}
	}
}

window.addEventListener("load", setupDelete, true);