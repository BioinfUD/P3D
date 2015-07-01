$('#aaa').click(function () {
    $('#search').val("hola");
});
$('#btnGraph').click(function () {
    //capturo el valor ingresado
    var valStructure = $("#search").val();
    //limpio el contenido de los resultados
    $("#dsspMain").empty();
    $("seqMain").empty();
    $("pubTitle").empty();
    $("pubAbstract").empty();
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
        loadGraphics(valStructure);
        getPMC(valStructure);
        getDSSP(valStructure, 1);
    }
});
 /*--- GET THE INFO FOR THE STRUCTURE  --- */
 function loadGraphics(structureID) {
    //viewer.clear();
    pdbURL = "http://www.rcsb.org/pdb/files/"+structureID+".pdb";
    pv.io.fetchPdb(pdbURL, function(structure) {
      viewer.cartoon('protein', structure, { color : color.ssSuccession() });
      var ligands = structure.select({ rnames : ['SAH', 'RVP'] });
      viewer.ballsAndSticks('ligands', ligands);
      viewer.centerOn(structure);
    });
}

function getSeq (structure, sequence) {
    sequence = sequence.replace("\n","").replace("\n","").replace("\n","").replace("\n","").replace("\n","");
    var Seq = require("biojs-vis-sequence");
    var mySequence = new Seq({
      sequence : sequence,
      target : 'seqMain',
      format : 'CODATA',
      columns : {
        size : 18,
        spacedEach : 6
      },
      formatOptions : {
        title:false,
        footer:false
      },
      id : structure
    });
    console.log('se cargo la secuencia');
}
function toLetters(num) {
    "use strict";
    var mod = num % 26,
        pow = num / 26 | 0,
        out = mod ? String.fromCharCode(64 + mod) : (--pow, 'Z');
    return pow ? toLetters(pow) + out : out;
}
function getDSSP(structure, num){
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
        $seq = $xml.find("pdbx_seq_one_letter_code_can");
        console.log("la secuencia es: "+$seq.text());
        getSeq(structure,$seq.text());
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
    //evito el scroll en ciertas aginas
    touchMove = function(event) {
        event.preventDefault();
    }
    //configuro y ejemplifico el pv.Viewer
    viewer = pv.Viewer(document.getElementById('graph'), { 
        width : 600, height: 600, antialias : true, 
        outline : true, quality : 'medium', style : 'hemilight',
        background : '#fff', animateTime: 500, doubleClick : null
    });
    window.addEventListener('resize', function() {
        viewer.fitParent();
    });
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

function points() {
  viewer.clear();
  var go = viewer.points('structure', structure, {
                         color: color.byResidueProp('num'),
                         showRelated : '1' });
  go.setSelection(structure.select({ rnumRange : [15,20] }));
}

function lines() {
  viewer.clear();
  var go = viewer.lines('structure', structure, {
              color: color.byResidueProp('num'),
              showRelated : '1' });
  go.setSelection(structure.select({ rnumRange : [15,20] }));
}

function cartoon() {
  viewer.clear();
  var go = viewer.cartoon('structure', structure, {
      color : color.ssSuccession(), showRelated : '1',
  });
  go.setSelection(structure.select({ rnumRange : [15,20] }));
  
  var rotation = viewpoint.principalAxes(go);
  viewer.setRotation(rotation)
}

function lineTrace() {
  viewer.clear();
  var go = viewer.lineTrace('structure', structure, { showRelated : '1' });
  go.setSelection(structure.select({ rnumRange : [15,20] }));
}

function spheres() {
  viewer.clear();
  var go = viewer.spheres('structure', structure, { showRelated : '1' });
  go.setSelection(structure.select({ rnumRange : [15,20] }));
}

function sline() {
  viewer.clear();
  var go = viewer.sline('structure', structure,
          { color : color.uniform('red'), showRelated : '1'});
  go.setSelection(structure.select({ rnumRange : [15,20] }));
}

function tube() {
  viewer.clear();
  var go = viewer.tube('structure', structure);
  viewer.lines('structure.ca', structure.select({aname :'CA'}),
            { color: color.uniform('blue'), lineWidth : 1,
              showRelated : '1' });
  go.setSelection(structure.select({ rnumRange : [15,20] }));
}

function trace() {
  viewer.clear();
  var go = viewer.trace('structure', structure, { showRelated : '1' });
  go.setSelection(structure.select({ rnumRange : [15,20] }));

}
function ballsAndSticks() {
  viewer.clear();
  var go = viewer.ballsAndSticks('structure', structure, { showRelated : '1' });
  go.setSelection(structure.select({ rnumRange : [15,20] }));
}