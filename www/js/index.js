$('#aaa').click(function () {
    $('#search').val("hola");
});

$('#btnGraph').click(function () {
    var valStructure = $("#search").val();
    var db = window.openDatabase("Database", "1.0", "History", 20000);
    db.transaction(addItem, errorCB, successCB);
    onDeviceReady();
    getPMC(valStructure)
});
window.addEventListener('load', function() {
    document.body.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, false);
}, false);
/* --- BIOJS PMC Citation component  --- */
function getPMC(structure){
    // get the pub ID through the RCSB site
    structureURL = "http://www.rcsb.org/pdb/files/"+structure+"-noatom.xml"
    $.get(structureURL, function(data, status){
        xmlDoc = $.parseXML(data),
        $xml = $(xmlDoc),
        $pubId = $xml.find("pdbx_database_id_PubMed");

        pcmID = $pubId.text();

        publicationURL = "http://www.ncbi.nlm.nih.gov/pubmed/"+pcmID+"?report=xml&format=text"
        $.get(publicationURL, function(data, status){
            // convierto el html en xml
            prexmlPub = $.parseXML(data),
            $preXmlpub = $(prexmlPub),
            $xmlText = $preXmlpub.find("pre");
            // convierto el xml en objetos
            xmlPub = $.parseXML($xmlText.text()),
            $xmlpub = $(xmlPub),
            $title = $xmlpub.find("ArticleTitle");
            $abstract = $xmlpub.find("AbstractText");
            // consigo todos los autores del articulo
            $xmlpub.find("Author").each(function(){
                console.log($(this).find("LastName").text());
                console.log($(this).find("Initials").text());
            });

            //$pubAbstract = $xmlpub.find("Abstract");
            console.log("titulo: "+$title.text());
            console.log("abstract: "+$abstract.text());
            console.log("PMID: "+$pubId.text());
            console.log("Author: "+$author.text());
            //console.log("Resumen del articulo: "+$pubAbstract);

            
            
        });
    });
}

/* --- DATABASE INTERACTIONS --- */

// Wait for device API libraries to load
document.addEventListener("deviceready", onDeviceReady, false);
// device APIs are available
function onDeviceReady() {
    var db = window.openDatabase("Database", "1.0", "History", 2000000);
    db.transaction(createDB, errorCB, successCB);
    db.transaction(loadHistory, errorCB, successCB);
}
// Populate the database
function createDB(tx) {
    //tx.executeSql('DROP TABLE IF EXISTS HISTORY');
    tx.executeSql('CREATE TABLE IF NOT EXISTS HISTORY (ID INTEGER PRIMARY KEY ASC, STRUCTURE)');
}
function loadHistory(tx) {
    tx.executeSql ('SELECT * FROM HISTORY ORDER BY ID DESC LIMIT 10', [], querySuccess, errorCB);
}
function addItem(tx) {
    var valSearch = $("#search").val();
    tx.executeSql('INSERT INTO HISTORY (STRUCTURE) VALUES ("'+valSearch+'")');
    tx.executeSql ('SELECT * FROM HISTORY ORDER BY ID DESC LIMIT 10', [], querySuccess, errorCB);
}
function dropDB(tx) {
    tx.executeSql('DROP TABLE IF EXISTS HISTORY');
}
// Transaction error callback
function errorCB(err) {
   console.log("Error processing SQL: "+err.code);
}
// Transaction success callback
function successCB() {
    console.log("consulta a BD exitosa");
}
function querySuccess(tx, results) {
    var len = results.rows.length;
    $("#historyList").html('<li data-icon="delete"><a href="#" data-rel="close" class="ui-btn ui-btn-icon-right ui-icon-delete">Close menu</a></li>');
    for(var i = 0; i < len; i ++) {
        var listaActual = $("#historyList").html();
        $("#historyList").html(listaActual+"<li><a id='"+results.rows.item(i).STRUCTURE+"' class='ui-btn ui-btn-icon-right ui-icon-carat-r historyItem' href='#'>"+results.rows.item(i).STRUCTURE+"</a></li>");
    }
    return false;
}