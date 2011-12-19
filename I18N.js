/**
 * Class for translating a page, using file with the translation accessible 
 * via AJAX.
 *
 * HOW TO USE IT:
 * 
 * NOTE : Why all the methods are static?
 * @return
 */

// =============================================================================
// Class : I18N
// =============================================================================
function I18N() {
}

// ---------------------------------------------------- Configuration Parameters
/**
 * The values of all these parameters must be set before the Public Methods 
 * (basically I18N.translatePage()) are called.
 */

// The current lang. This value is set by the HTML page that calls this JS
// A typical scenario is that this variable is set by the server code (PHP, Java...) 
I18N.currLang = null;

I18N.defLang = null;


// If the language comes as URL parameter, the name of the URL parameter
I18N.langUrlParameterName = "lang";

// If true, the keys of the strings to be translated are stored in case insensitive
// mode. So, if we get form de server something like "Greeting" => "Muy buenas"
// and we ask tor the translation of "greeting", if it is case insensitive I'll
// get "Muy buenas", otherwise null or a default value.
I18N.keysCaseInsensitive = true;

// Class that identifies the HTMLElements to be translated
I18N.i18nClass = "i18n";

// Function used to get the value of a key when its translation is not defined 
I18N.funcValue4NotTranslated = function(pKey) {
  return "[" + pKey + "]";
};

// Funtion returning the name of the file with the translations
I18N.funcGetFile = function() {
  // By default, the name of the file is the name of the page without 
  // the extension + "-lang.txt"
  var sPath = window.location.pathname;
  var sPage = sPath.substring(sPath.lastIndexOf('/') + 1);
  var sPageWithoutExt = sPage.substring(0,sPage.lastIndexOf('.'));

  return sPageWithoutExt + "_" + I18N.currLang + ".txt";
};

/**
 * Function called to select a language
 */
I18N.funcSelectLang = function(ele) {
		YAHOO.util.Dom.addClass(ele, "active_lang");
}

/**
 * Function called to deselect a language
 */
I18N.funcDeselectLang = function(ele) {
		YAHOO.util.Dom.removeClass(ele, "active_lang");
}

// ------------------------------------------------------------ Class Parameters
// Map key:value with all the translations in the current language
I18N.translations = new Array();

// Selectors
I18N.selectors = new Array();

// -------------------------------------------------------------- Public Methods
I18N.setCurrLangUrlParameter = function (parameterName, defLang) {
  I18N.langUrlParameterName = parameterName;
  I18N.defLang = defLang;

  // Get the language form the URL
	var queryString = window.top.location.search.substring(1);
	var lang = defLang;
	
	var parameterName = parameterName + "=";
	if ( queryString.length > 0 ) {
		// Find the beginning of the string
		var begin = queryString.indexOf ( parameterName );
		// If the parameter name is not found, skip it, otherwise return the value
		if ( begin != -1 ) {
			// Add the length (integer) to the beginning
			begin += parameterName.length;
			// Multiple parameters are separated by the "&" sign
			var end = queryString.indexOf ( "&" , begin );
			if ( end == -1 ) {
				end = queryString.length;
			}
			// Return the string
			lang = unescape ( queryString.substring ( begin, end ) );
		}
	}

  I18N.currLang = lang;
}

/**
 * We get all the translations from the current language. This method is usually
 * called from translatePage() (Step 1: get the translations. Step 2: put the
 * translations in de page) but it could be called independently. For example
 * if we want to get the translations of the messages shown by JS (using the 
 * method "string".translate()).
 * Once we get the translations, we stored in the map I18N.translations 
 *
 * Params:
 * @param pCallback (Optional) Callback function, called once we get the translations.
 * @param pParams   If pCallback us defined, params that will be passed back to the 
 *                  function.
 * @return VOID
 */
I18N.loadData = function(pCallback, pParams) {
	var callback = pCallback;
	var params = pParams;
	
	YAHOO.util.Connect.asyncRequest("POST", I18N.funcGetFile(),
			{ 
				success: function(o) { 
					var data = YAHOO.lang.JSON.parse(o.responseText);
					//var cadenas = data;
					for(var key in data ) {
						I18N.translations[I18N.keysCaseInsensitive ? key.toLowerCase() : key] = data[key];
					}
          /*
					if ( data.lang ) {
						I18N.currLang = data.lang;
						I18N.selectActiveLang();
					}
					*/
					if ( callback ) {
						callback(params);	
					}
				},
				failure: function(o) { alert("Error : " + o); }
			});
}

/**
 * Translate the page using the translations we already have.
 */
I18N.translatePage = function() {
	// --------------------------------
	// Step 1: Get all the HTML elements that need a translation
	// --------------------------------	
	// mapEle es un Map, where the key es el string to be translated and the value 
  // is an array with all the HTMLElements with that string
	var mapEle = [];

	YAHOO.util.Dom.getElementsByClassName(I18N.i18nClass, null, null, function(ele) {
    var text=ele.id;
		if ( !text||text.length==0 ) {
      text=I18N.keysCaseInsensitive ? ele.innerHTML.toLowerCase() : ele.innerHTML;
    }
		ele.innerHTML="";
    if ( text ) {
      /*
			if ( text.indexOf(",")!=-1 ) {
				throw "No se puede traducir el término '" + text + "' porque contiene una , (carácter no válido)";
			}
      */
			// Nos vamos a guardar este HTMLElement, asociado a este texto
			var lista = mapEle[text];
			// Nuevo término
			if ( !lista ) {
				lista = new Array();
				mapEle[text] = lista;
			}
			lista.push(ele);
		}
	});
	
	// --------------------------------
	// Step 2: Translate all the HTML elements
	// --------------------------------	
	for ( var key in mapEle ) {
		var listaEle = mapEle[key];
		for(var ind=0; ind<listaEle.length; ++ind ) {
			var ele = listaEle[ind];
			ele.innerHTML = I18N.translateStr(key);
			YAHOO.util.Dom.setStyle(ele, "visibility", "visible");
		}  
	}
}

/**
 * Get the translations and translate the page (utility function).
 */
I18N.loadAndTranslate = function() {
  I18N.loadData(function(){
	  // Esto lo ejecutamos sólo cuando ya se haya cargado todo el HTML
	  YAHOO.util.Event.onDOMReady(function(){
	      // Marcamos el idioma activo
	      I18N.funcSelectLang(I18N.selectors[I18N.currLang]);
	      // Traducimos la página
	      I18N.translatePage();
	  });	
  });
}

/**
 * Set the language selectors for the page, the elements that we have to click
 * in order to change the language.
 */ 
I18N.setLangSelectors = function(lista) {
  // Loop over all the selectors
  for(var ind=0; ind<lista.length; ++ind) {
    var ele = YAHOO.util.Dom.get(lista[ind][0]);
    var lang = lista[ind][1];

    I18N.selectors[lang] = ele;
    YAHOO.util.Event.addListener(ele, "click", function(evt, pLang) {
      I18N.changeLang(pLang);
    }, lang);
  }
  if ( I18N.currLang!=null ) {
    I18N.funcSelectLang(I18N.selectors[I18N.currLang]);
  }
}


/**
 * Change the current language. 
 */
I18N.changeLang = function(lang) {
	// Refresca la página, cambiando el idioma
	// ¿Por qué refrescamos la página y no usamos JS? Se podría hacer, pero:
	// - Complica el código
	// - Nos obliga a cargar todos los contenidos en todos los idioma (problemas
	//   si hay muchos idiomas)
	// - El cambio lo hacemos en JS y tenemos que comunicarlo al servidor (para
	//   que al navegar se mantenga el nuevo idioma) y eso lía el código.
	// Lo más sencillo: refrescar la página (no es tan cool pero.....)
	// Deseleccionamos el idioma antiguo
  /*
	if ( I18N.currLang!=null ) {
    I18N.funcDeselectLang(I18N.selectors[I18N.currLang]);
	}
  */
	// Refrescamos la página
  var newUrl;

  if ( I18N.langUrlParameterName!=null ) {
    // Add lang=es to the URL.
    var url = window.top.location.href;
    if ( url.indexOf("?")==-1 ) {
      newUrl = url + "?" + I18N.langUrlParameterName + "=" + lang;
    // Parámetros adicionales	
	  } else {
	    var startPos = url.indexOf(I18N.langUrlParameterName+"=");
			
		  // Este parámetro no existe, lo añadimos		
		  if ( startPos==-1 ) {
			  newUrl = url + "&" + I18N.langUrlParameterName + "=" + lang;
		  // Existe, tenemos que cambiar el valor	
		  } else {
			  // Ponemos el nuevo valor
			  newUrl = url.substring(0, startPos) + I18N.langUrlParameterName + "=" + lang;

			  // Vamos a ver si el parámetro no estaba al final de la cadena, 
			  // con lo que nos queda un troz de url por añadir
			  var endPos = url.indexOf("&", startPos+(I18N.langUrlParameterName+"=").length);
			  if ( endPos!=-1 ) {
				  newUrl += url.substring(endPos);
			  }
		  }
    }
  } else {
    newUrl = window.top.location.href;   
  }

	window.top.location.href = newUrl;
}


/**
 * Translate a string.
 *
 * @param str
 * @return The string with the translation of a default value if the translation
 *         was not found
 */
I18N.translateStr = function(str) {
	var translation = I18N.translations[I18N.keysCaseInsensitive ? str.toLowerCase() : str];

  return translation ? translation : I18N.funcValue4NotTranslated(str);
}
