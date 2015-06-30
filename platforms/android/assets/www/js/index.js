$('#aaa').click(function () {
    $('#search').val("hola");
});
$(document).bind('mobileinit', function(){ 
       $.mobile.metaViewportContent = 'width=device-width, minimum-scale=1'; 
});
$('#btnGraph').click(function () {
    //capturo el valor ingresado
    var valStructure = $("#search").val();
    //si no se ingresa nada, no lo deja continuar
    if(valStructure == ""){
        console.log("ALERTA: no se introdujo texto");
        setTimeout(function(){
            console.log("ACCION: mostrando loader");
          $.mobile.loading( 'show', {
                theme: "b", 
                text: "Textbox is empty",
                textVisible: true, 
                textonly: true
            });
        }, 1);
        setTimeout(function(){
            console.log("ACCION: ocultando loader");
            $.mobile.loading('hide');
        }, 2000);
    }else{
        setTimeout(function () {
            $(':mobile-pagecontainer').pagecontainer('change', '#viewer', {
                transition: 'fade',
                changeHash: true,
                reverse: true,
                showLoadMsg: false
            });
        }, 1000);
        var db = window.openDatabase("Database", "1.0", "History", 20000);
        db.transaction(addItem, errorCB, successCB);
        onDeviceReady(); // esto se debe comentar
        getPMC(valStructure);
        getDSSP(valStructure, 1);
    }
});
 /*--- GET THE INFO FOR THE STRUCTURE  --- */
function toLetters(num) {
    "use strict";
    var mod = num % 26,
        pow = num / 26 | 0,
        out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
    return pow ? toLetters(pow) + out : out;
}
function getDSSP(structure, num){
    $( "#dsspMain" ).empty();
    chain = toLetters(num);
    dsspURL ="http://www.rcsb.org/pdb/explore/remediatedChain.do?structureId="+structure+"&chainId="+chain;
    var img = new Image();
    $(img).load(function(){
        console.log('intentando obtener la siguiente imagen: '+dsspURL);
        $('#dsspMain').append($(this));
    }).attr({
        src: dsspURL,
        id: "dsspIMG"
    }).error(function(){
        console.log('no se pudo obtener la imagen, intentando de nuevo con otra "CHAIN"');
        getDSSP(structure, ++num);
    });  
}

function getPMC(structure){
    // get the pub ID through the RCSB site
    structureURL = "http://www.rcsb.org/pdb/files/"+structure+"-noatom.xml"
    $.get(structureURL, function(data, status){
        xmlDoc = $.parseXML(data),
        $xml = $(xmlDoc),
        $pubId = $xml.find("pdbx_database_id_PubMed");
        pcmID = $pubId.text();
        if(pcmID == ""){
            console.log("No hay un ID PubMed");
            /*
            Falta: 
            1. poner un mensaje diciendo que no hay
            un ID de PubMed
            */
        }else{
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
                $('#pubTitle').text($title.text());
                var shortAbstract = jQuery.trim($abstract.text()).substring(0, 600).trim(this) + "...";
                $('#pubAbstract').text(shortAbstract);
            })
            .done(function() {
                console.log("SI se pudo conseguir la publicacion");
            })
            .fail(function() {
                console.log("NO se pudo conseguir la publicacion");
            });
        }
    })
    .done(function() {
        console.log("SI se pudo conseguir la estructura");
    })
    .fail(function() {
        console.log("NO se pudo conseguir la estructura");
    });
}

/* --- DATABASE INTERACTIONS --- */

// Wait for device API libraries to load
document.addEventListener("deviceready", onDeviceReady, false);
// device APIs are available
function onDeviceReady() {
    touchMove = function(event) {
        event.preventDefault();
    }
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