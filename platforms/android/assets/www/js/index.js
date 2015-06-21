$('#aaa').click(function () {
    $('#search').val("hola");
});

$('#btnGraph').click(function () {
    var db = window.openDatabase("Database", "1.0", "History", 20000);
    db.transaction(addItem, errorCB, successCB);

});
window.addEventListener('load', function() {
    document.body.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, false);
}, false);


/* --- DATABASE INTERACTIONS --- */

// Wait for device API libraries to load
document.addEventListener("deviceready", onDeviceReady, false);
// device APIs are available
function onDeviceReady() {
    var db = window.openDatabase("Database", "1.0", "History", 20000);
    db.transaction(createDB, errorCB, successCB);
    db.transaction(loadHistory, errorCB, successCB);
}
// Populate the database
function createDB(tx) {
    //tx.executeSql('DROP TABLE IF EXISTS HISTORY');
    tx.executeSql('CREATE TABLE IF NOT EXISTS HISTORY (ID INTEGER PRIMARY KEY ASC, STRUCTURE)');
}
function loadHistory(tx) {
    tx.executeSql ('SELECT * FROM HISTORY LIMIT 10', [], querySuccess, errorCB);
}
function addItem(tx) {
    var valSearch = $("#search").val();
    tx.executeSql('INSERT INTO HISTORY (STRUCTURE) VALUES ("'+valSearch+'")');
}

function dropDB(tx) {
    tx.executeSql('DROP TABLE IF EXISTS HISTORY');
}
// Transaction error callback
function errorCB(err) {
    alert("Error processing SQL: "+err.code);
}
// Transaction success callback
function successCB() {
    alert("success!");
}
function querySuccess(tx, results) {
    alert("devuelve filas =" + results.rows.length);
    var len = results.rows.length;
    for(var i = 0; i < len; i ++) {
        var listaActual = $("#unDiv").html();
        $(#historyList).html(listaActual + "<li><a id="+results.rows.item(i).STRUCTURE+" class='historyItem' href='#''>"+results.rows.item(i).STRUCTURE="</a></li>");
    }
    return false;
}