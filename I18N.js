/**
 * Utilities relacionadas con el multiidioma
 * @return
 */
function I18n() {
}

// El valor correcto de esta variable lo establece el PHP
I18n.currLang = null;
// Lo mismo. Esto es un array con todas las traducciones
I18n.translations = new Array();

/**
 * Cambiamos el idioma actual
 */
I18n.changeLang = function(lang) {
	// Refresca la página, cambiando el idioma
	// ¿Por qué refrescamos la página y no usamos JS? Se podría hacer, pero:
	// - Complica el código
	// - Nos obliga a cargar todos los contenidos en todos los idioma (problemas
	//   si hay muchos idiomas)
	// - El cambio lo hacemos en JS y tenemos que comunicarlo al servidor (para
	//   que al navegar se mantenga el nuevo idioma) y eso lía el código.
	// Lo más sencillo: refrescar la página (no es tan cool pero.....)
	// Deseleccionamos el idioma antiguo
	if ( I18n.currLang!=null ) {
		YAHOO.util.Dom.replaceClass(YAHOO.util.Dom.get("selLang_" + I18n.currLang), "lang_activo", "lang_inactivo");
	}

	// Refrescamos la página
	window.top.location.href = Util.add2Url(window.top.location.href, "lang", lang);
}

/* Activa el elemento correspondiente al idioma actual. 
 * Sólo lo marca visualmente, no envía nada al servidor 
 */
I18n.selectActiveLang = function() {
	if ( I18n.currLang!=null ) {
		YAHOO.util.Dom.replaceClass(YAHOO.util.Dom.get("selLang_" + I18n.currLang), "lang_inactivo", "lang_activo");
		var newLang=null;
		switch(I18n.currLang)
		{
		case "es":
		  newLang="es";
		  break;
		case "ca":
		  newLang="cat";
		  break;
		default:
		  newLang="ca";
		}		
	}
}

/**
 * Pedimos al servidor todas las traducciones del idioma actual 
 * @return
 */
I18n.loadData = function(pCallback, pParams) {
	var callback = pCallback;
	var params = pParams;
	
	YAHOO.util.Connect.asyncRequest("POST", "./data/i18n-" + I18n.currLang + ".txt",
			{ 
				success: function(o) { 
					var data = YAHOO.lang.JSON.parse(o.responseText);
					var cadenas = data;
					for(var key in cadenas ) {
						I18n.translations[key.toLowerCase()] = cadenas[key];
					}
					if ( data.lang ) {
						I18n.currLang = data.lang;
						I18n.selectActiveLang();
					}
					
					if ( callback ) {
						callback(params);	
					}
				},
				failure: function(o) { alert("Error : " + o); /*Util.defaultErrorHandler(o);*/ }
			});
	
	
}
I18n.translatePage = function() {
	// --------------------------------
	// Paso 1 : Buscamos todos los HTMLElement susceptibles
	//          de ser traducidos
	// --------------------------------
	
	// mapEle es un Map, donde key es el string a traducir y el valor es un array 
	// con todos los HTMLElement con ese string
	var mapEle = [];
	// allTerms es un array con todos los términos a traducir
	var allTerms = "";
	YAHOO.util.Dom.getElementsByClassName("i18n", null, null, function(ele) {
            	var text=ele.id;
		if ( !text||text.length==0 ) {
                	text=ele.innerHTML.toLowerCase();
                }
		ele.innerHTML="";
                if ( text ) {
			if ( text.indexOf(",")!=-1 ) {
				throw "No se puede traducir el término '" + text + "' porque contiene una , (carácter no válido)";
			}
			// Nos vamos a guardar este HTMLElement, asociado a este texto
			var lista = mapEle[text];
			// Nuevo término
			if ( !lista ) {
				lista = new Array();
				mapEle[text] = lista;
				if ( allTerms.length!=0 ) {
					allTerms += ",";
				}
				allTerms += text; 
			}
			lista.push(ele);
		}
	});
	
	// Traducimos todos los términos
	for ( var key in mapEle ) {
		var listaEle = mapEle[key];
		for(var ind=0; ind<listaEle.length; ++ind ) {
			var ele = listaEle[ind];
			ele.innerHTML = key.translate();
			YAHOO.util.Dom.setStyle(ele, "visibility", "visible");
		}  
	}
}

I18n.translateStr = function(str) {
	var translation = I18n.translations[str.toLowerCase()];
	return translation ? translation : "[" + str + "]";
}

// Extendemos String
String.prototype.translate = function() {
	return I18n.translateStr(this);
}

String.prototype.startsWith = function(str){
    return (this.indexOf(str) === 0);
}


// MAIN
I18n.currLang = Util.getRequestParameter("lang", "ca");
I18n.loadData(function(){
	// Esto lo ejecutamos sólo cuando ya se haya cargado todo el HTML
	YAHOO.util.Event.onDOMReady(function(){
	    // Marcamos el idioma activo
	    I18n.selectActiveLang();
	    // Traducimos la página
	    I18n.translatePage();
	});	
});
