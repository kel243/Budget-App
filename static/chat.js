var timeoutID;
var timeout = 1000;

function setup() {
  document.getElementById("btn").addEventListener("click", makePost, true);
  timeoutID = window.setTimeout(makePoll(), timeout);
}

function makePost() {
  var httpRequest = new XMLHttpRequest();

  if (!httpRequest) {
    alert("Giving up - cannot create XMLHttp instance");
    return false;
  }

  httpRequest.onreadystatechange = function() {
    postHandler(
      httpRequest,
      document.getElementById("author").value,
      document.getElementById("text").value
    );
  };

  httpRequest.open("POST", "/new_message");
  httpRequest.setRequestHeader(
    "Content-Type",
    "application/x-www-form-urlencoded"
  );

  var data =
    "author=" +
    document.getElementById("author").value +
    "&chatname=" +
    document.getElementById("chatname").value +
    "&text=" +
    document.getElementById("text").value;
  console.log(data);
  httpRequest.send(data);
}

function postHandler(httpRequest, author, text) {
  if (httpRequest.readyState === XMLHttpRequest.DONE) {
    if (httpRequest.status === 200) {
      var msgDiv = document.getElementById("msgs");
      temp = document.createElement("div");
      temp.innerHTML =
        '<li id="user"><p><span class="author">' + author + ":</span> " + text;
      msgDiv.appendChild(temp);
      clearInput();
      var empty = document.getElementById("empty");
      if (empty != null) empty.parentNode.removeChild(empty);
    } else {
      console.log("Error");
    }
  }
}

function makePoll() {
  var httpRequest = new XMLHttpRequest();

  if (!httpRequest) {
    alert("Giving up - cannot create XMLHttp instance");
    return false;
  }

  httpRequest.onreadystatechange = function() {
    pollHandler(httpRequest);
  };
  httpRequest.open("POST", "/msgs");
  httpRequest.setRequestHeader(
    "Content-Type",
    "application/x-www-form-urlencoded"
  );

  var data = "chatname=" + document.getElementById("chatname").value;

  httpRequest.send(data);
}

function pollHandler(httpRequest) {
  if (httpRequest.readyState === XMLHttpRequest.DONE) {
    if (httpRequest.status === 200 && httpRequest.responseText != "null") {
      var msgs = JSON.parse(httpRequest.responseText);
      var ul = document.getElementById("msgs");
      var author = document.getElementById("author").value;
      console.log(msgs);
      for (var i = 0; i < msgs.length; i++) {
        if (msgs[i].text !== undefined) {
          var li = document.createElement("div");
          if (author != msgs[i].author) {
            li.innerHTML =
              '<li id="other"><p><span class="author">' +
              msgs[i].author +
              ":</span>" +
              msgs[i].text;
          }
          ul.appendChild(li);
        }
      }

      timeoutID = window.setTimeout(makePoll, timeout);
    } else {
      timeoutID = window.setTimeout(makePoll, timeout);
    }
  }
}

function clearInput() {
  document.getElementById("text").value = "";
}

window.addEventListener("load", setup, true);
