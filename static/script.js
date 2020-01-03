var timeoutID;
var timeout = 1000;
var cats;
var purchases;

function setup() {
	document.getElementById("addCat").addEventListener("click", addCategory, true);
	document.getElementById("addPurchase").addEventListener("click", addPurchase, true);

	pollCat();
	pollPurch();
}

function makeRequest(method, target, retCode, action, data) {
	var httpRequest = new XMLHttpRequest();

	if (!httpRequest) {
		alert('Cannot create an XMLHTTP instance');
		return false;
	}
	httpRequest.onreadystatechange = makeHandler(httpRequest, retCode, action);
	httpRequest.open(method, target);
	
	if (data){
		httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		httpRequest.send(data);
	}
	else {
		httpRequest.send();
	}
}

function makeHandler(httpRequest, retCode, action) {
	function handler() {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			if (httpRequest.status === retCode) {
				action(httpRequest.responseText);
			} else {
				alert("There was a problem with the request.");
			}
		}
	}
	return handler;
}

function addCategory() {
	var newCat = document.getElementById("newCat").value
	var limit = document.getElementById("limit").value
	// Check for missing arguments and clear form if argument is missing
	if(newCat == ""){
		alert("Category name missing!");
		return false;
	}
	if(limit == ""){
		alert("Budget limit missing!");
		return false;
	}
	var data;
	data = "name=" + newCat + "&limit=" + limit;
	window.clearTimeout(timeoutID);
	makeRequest("POST", "/categories", 201, pollCat, data);
	clearCatForm();
}

function addPurchase() {
	var newPurchase = document.getElementById("newPurchase").value
	var cost = document.getElementById("cost").value
	var cat = document.getElementById("cat").value
	var date = document.getElementById("date").value
	// Check for missing arguments and clear form if argument is missing
	if(newPurchase == ""){
		alert("Purchase name missing!");
		return false;
	}
	if(cost == ""){
		alert("Purchase cost missing!");
		return false;
	}
	if(date == ""){
		alert("Purchase date missing!");
		return false;
	}
	
	var data;
	data = "name=" + newPurchase + "&cost=" + cost + "&cat=" + cat + "&date=" + date;
	window.clearTimeout(timeoutID);
	makeRequest("POST", "/purchases", 201, pollPurch, data);
	clearPurchForm();
}

function pollCat() {
	makeRequest("GET", "/categories", 200, repopulateCat);
}

function pollPurch() {
	makeRequest("GET", "/purchases", 200, repopulatePurch);
}

function deleteCat(taskID) {
	makeRequest("DELETE", "/categories/" + taskID, 204, pollCat);
	// Poll purchases to update purchases that lost their category 
	pollPurch();
}

function deletePurch(taskID) {
	makeRequest("DELETE", "/purchases/" + taskID, 204, pollPurch);
}

function addCell(row, text) {
	var newCell = row.insertCell();
	var newText = document.createTextNode(text);
	newCell.appendChild(newText);
}

function addRemainingCell(row, text) {
	var newCell = row.insertCell();
	newCell.className = 'remaining';
	var newText = document.createTextNode(text);
	newCell.appendChild(newText);
}

function repopulateCat(responseText) {
	cats = JSON.parse(responseText);
	cats = JSON.parse(cats);
	console.log(cats);
	var select = document.getElementById("cat");
	var table = document.getElementById("catTable");
	var newRow, newCell, delButton;

	document.getElementById("cat").innerHTML = "";

	while (table.rows.length > 0) {
		table.deleteRow(0);
	}

	// Create title row
	newRow = table.insertRow();
	newRow.className = 'titles';
	addCell(newRow, "Category");
	addCell(newRow, "Limit");
	addCell(newRow, "Remaining");
	
	// Add a blank select option for non-categorized purchases
	var noCat  = document.createElement("option");
	noCat.value = "";
	select.appendChild(noCat);

	for (i in cats) {
		//Populate the category select options
		var option = document.createElement("option");
		option.value = cats[i].name;
		option.appendChild(document.createTextNode(cats[i].name));
		select.appendChild(option);

		// Create cells for category name and budget limit
		newRow = table.insertRow();
		newRow.className = 'cats';
		addCell(newRow, cats[i]["name"]);
		addCell(newRow, '$'+cats[i]["limit"]);
		addRemainingCell(newRow, "");
		
		// Create cell for delete button	
		newCell = newRow.insertCell();
		delButton = document.createElement("input");
		delButton.type = "button";
		delButton.id = "deleteCat";
		delButton.value = "Delete " + cats[i].name;
		(function(_i){ delButton.addEventListener("click", function() { deleteCat(cats[_i].cat_id); }); })(i);
		newCell.appendChild(delButton);
	}
	calculate();
	
}

function repopulatePurch(responseText) {
	purchases = JSON.parse(responseText);
	purchases = JSON.parse(purchases);
	console.log(purchases);
	var table = document.getElementById("purchaseTable");
	var newRow, newCell, delButton;

	while (table.rows.length > 0) {
		table.deleteRow(0);
	}

	// Create title row
	newRow = table.insertRow();
	newRow.className = 'titles';
	addCell(newRow, "Item");
	addCell(newRow, "Cost");
	addCell(newRow, "Category");
	addCell(newRow, "Date");
	for (i in purchases) {
		// Create cells for purchase name, cost, category, and date
		newRow = table.insertRow();
		newRow.className = 'purchases';
		addCell(newRow, purchases[i]["name"]);
		addCell(newRow, '$'+purchases[i]["cost"]);
		addCell(newRow, purchases[i]["cat"]);
		addCell(newRow, purchases[i]["date"]);
		
		// Create cell for delete button
		newCell = newRow.insertCell();
		delButton = document.createElement("input");
		delButton.type = "button";
		delButton.id = "deletePurch";
		delButton.value = "Delete " + purchases[i].name;
		(function(_i){ delButton.addEventListener("click", function() { deletePurch(purchases[_i].purchase_id); }); })(i);
		newCell.appendChild(delButton);
	}
	calculate();
	
}

function calculate() {
	if (typeof cats === undefined) {
		return;
	}
	if (typeof purchases === undefined) {
		return;
	}
	var i = 0;
	var catNames = [];
	cats.forEach(function(e) {
		e.remaining = e.limit;
		purchases.map(x => e.remaining = x.cat === e.name ? e.remaining -= x.cost : e.remaining);
		// Formatting the remaining budget output based on if its negative or positive
		if(e.remaining > 0){
			document.querySelectorAll(".remaining")[i++].innerHTML='$'+e.remaining;
		}else{
			negativeRem = e.remaining * -1;
			document.querySelectorAll(".remaining")[i++].innerHTML='-$'+negativeRem;

		}
		catNames.push(e.name);
	});
	var spent = 0;
	// Calculations for non-categorized spending
	purchases.map(x => spent = catNames.indexOf(x.cat) === -1 ? spent += x.cost : spent);
	document.getElementById("noCat").innerHTML="Uncategorized Expenditures: $" + spent;
}

function clearCatForm(){
	document.getElementById("newCat").value = "";
	document.getElementById("limit").value = "";
}

function clearPurchForm(){
	document.getElementById("newPurchase").value = "";
	document.getElementById("cost").value = "";
	document.getElementById("cat").value = "";
	document.getElementById("date").value = "";
}

window.addEventListener("load", setup, true);