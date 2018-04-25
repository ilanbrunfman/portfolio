/* mainApp.js */
var data = (localStorage.getItem('scheduleList1')) ? JSON.parse(localStorage.getItem('scheduleList1')):{
    LIST: []
};
// Remove and complete icons in SVG format
var removeSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 22 22" style="enable-background:new 0 0 22 22;" xml:space="preserve"><rect class="noFill" width="22" height="22"/><g><g><path class="fill" d="M16.1,3.6h-1.9V3.3c0-1.3-1-2.3-2.3-2.3h-1.7C8.9,1,7.8,2,7.8,3.3v0.2H5.9c-1.3,0-2.3,1-2.3,2.3v1.3c0,0.5,0.4,0.9,0.9,1v10.5c0,1.3,1,2.3,2.3,2.3h8.5c1.3,0,2.3-1,2.3-2.3V8.2c0.5-0.1,0.9-0.5,0.9-1V5.9C18.4,4.6,17.4,3.6,16.1,3.6z M9.1,3.3c0-0.6,0.5-1.1,1.1-1.1h1.7c0.6,0,1.1,0.5,1.1,1.1v0.2H9.1V3.3z M16.3,18.7c0,0.6-0.5,1.1-1.1,1.1H6.7c-0.6,0-1.1-0.5-1.1-1.1V8.2h10.6V18.7z M17.2,7H4.8V5.9c0-0.6,0.5-1.1,1.1-1.1h10.2c0.6,0,1.1,0.5,1.1,1.1V7z"/></g><g><g><path class="fill" d="M11,18c-0.4,0-0.6-0.3-0.6-0.6v-6.8c0-0.4,0.3-0.6,0.6-0.6s0.6,0.3,0.6,0.6v6.8C11.6,17.7,11.4,18,11,18z"/></g><g><path class="fill" d="M8,18c-0.4,0-0.6-0.3-0.6-0.6v-6.8c0-0.4,0.3-0.6,0.6-0.6c0.4,0,0.6,0.3,0.6,0.6v6.8C8.7,17.7,8.4,18,8,18z"/></g><g><path class="fill" d="M14,18c-0.4,0-0.6-0.3-0.6-0.6v-6.8c0-0.4,0.3-0.6,0.6-0.6c0.4,0,0.6,0.3,0.6,0.6v6.8C14.6,17.7,14.3,18,14,18z"/></g></g></g></svg>';
// var completeSVG = '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 22 22" style="enable-background:new 0 0 22 22;" xml:space="preserve"><rect y="0" class="noFill" width="22" height="22"/><g><path class="fill" d="M9.7,14.4L9.7,14.4c-0.2,0-0.4-0.1-0.5-0.2l-2.7-2.7c-0.3-0.3-0.3-0.8,0-1.1s0.8-0.3,1.1,0l2.1,2.1l4.8-4.8c0.3-0.3,0.8-0.3,1.1,0s0.3,0.8,0,1.1l-5.3,5.3C10.1,14.3,9.9,14.4,9.7,14.4z"/></g></svg>';

var dateArray = ["1/17", "1/22", "1/24", "1/29", "1/31", "2/5", "2/7", "2/12", "2/14" ,"2/19", "2/21", "2/26", "2/28", "3/5", "3/7", "3/12", "3/14", "3/19", "3/21", "3/26", "3/28", "4/2", "4/4", "4/9", "4/11", "4/16", "4/18", "4/23", "4/25", "4/30", "5/2", "5/4", "5/6", "5/11", "5/13", "5/15" ];
var array = 0;

// console.log(dateArray);
console.log(data);
renderScheduleList();

// User clicked on the add button
// If there is any text inside the item field, add that text  to the todo List
document.getElementById('add').addEventListener('click', function(){
    var value = document.getElementById('item').value;
    console.log("Add button has been clicked");
    if (value){      
        addItem(value);
    } 
});

function renderScheduleList() {
    if(!data.LIST.length) return;

    for (var i = 0; i < data.LIST.length; i++) {
        var value = data.LIST[i];
        addItemToDOM(value);
    }
}
function dataObjectUpdated() {
    localStorage.setItem('scheduleList1', JSON.stringify(data));
}
// add item to DOM
function addItem (value) {
    addItemToDOM(value);// console.log(value);
    document.getElementById('item').value = '';// reset the value   
    data.LIST.push(value);
    dataObjectUpdated();
    refreshArray();
}
// SELECT #schedule li .info
var inputText = document.getElementById('item'),
items = document.querySelectorAll( "#schedule li .info"),
tab = [], 
index;

// edit button
// get the selected li .info index using array
for(var i = 0; i < items.length; i++){
    tab.push(items[i].innerHTML);
}
    
// to select any list li by click on it
// get li index onclick
for(var i =0; i < items.length; i++){
    items[i].onclick = function (){
        index = tab.indexOf(this.innerHTML);
        console.log(this.innerText + " INDEX =  " + index);
        //set the selected li value into input tetxt
        inputText.value = this.innerText;
    };
}

function refreshArray(){
    // clear array
    tab.length = 0;
    items = document.querySelectorAll("#schedule li .info");
    item = tab.indexOf(index);
    //fill array
    for(var i = 0; i < items.length; i++){
        tab.push(items[i].innerHTML);
    }
    // console.log(item);
}

// User clicked on the cancel button
document.getElementById('cancel').addEventListener('click', function(){
    var value = document.getElementById('item').value;
    console.log('Cancel button has been clicked')
    if (value){      
        cancelItem(value);
    } 
});
// cancel item function
function cancelItem(value){
    inputText.value = "Canceled: " + value;
    items[index].innerText = inputText.value;
    /*    array.splice(start index, the number of cut from the starting point to remove, any items you want to add);    */
    data.LIST.splice(data.LIST.indexOf(value), 1, "Canceled: " +value, value);
    addItemToDOM(value);
    
    dataObjectUpdated();
    refreshArray();
    console.log(data);
    console.log(items[index].innerText + " INDEX =  " + data.LIST.indexOf(value));
    // document.getElementById('item').value = '';// reset the value
}

// User clicked on the edit button
document.getElementById('edit').addEventListener('click', function(){
    var value = document.getElementById('item').value;
    console.log('Edit button has been clicked')
    if (value){      
        editItem(value);
    } 
});
// edit item function
function editItem(value){
    inputText.value = value;
    items[index].innerText = inputText.value;    
    /*array.splice(start index, the number of cut from the starting point to remove, any items you want to add);*/
    data.LIST.splice(index, 1, value);
    dataObjectUpdated();
    refreshArray();
    console.log(data); // show data's array
    console.log(value + " INDEX =  " + index); // to see the update and the location when start to cut and past
}

// User clicked on the remove button
// If there is any text inside the item field, add that text  to the todo List
document.getElementById('remove').addEventListener('click', function(){
    var value = document.getElementById('item').value;
    console.log('Remove button clicked')
    if (value){      
        removeItem(value);
    } 
});

function removeItem(value){  
    // var inputText = document.getElementById('schedule').value;
    data.LIST.splice(data.LIST.indexOf(value),1);
    dataObjectUpdated();    

    if(items.length>0){          
        // items[index].parentNode.removeChild(items[index]);             
    } 
    console.log(items[index]); 
    console.log(data);
    refreshArray();
}

// here we are going to create all the html elemnts
// Adds a new item to the schdule list 
function addItemToDOM(html){
    var list = document.getElementById('schedule');
    var item = document.createElement('li');
    // item.innerHTML = html;
  
    list.appendChild(item);

    //info
    var info = document.createElement('div');
    info.classList.add('info');
    info.innerHTML = html;

    item.appendChild(info);

    //dateDiv
    var dateDiv = document.createElement('div');
    dateDiv.classList.add('dateDiv');
    item.appendChild(dateDiv);

    var date = document.createElement('p');
    date.classList.add('date');
    date.innerHTML = dateArray[array++];
    
    dateDiv.appendChild(date);
  
    //list.insertBefore(item, list.childNodes[0]); // insert <li> before the first child of <ul>
}

//target.insertBefore(item, target.childNodes[0]);