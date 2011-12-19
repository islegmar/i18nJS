/**
 * Class for translating a page, using file with the translation accessible 
 * via AJAX.
 * @return
 */
function I18N() {
  // The current lang. 
  // Its value can be set by the user (fex. set by server code) or obtained 
  // as parameter from the URL or.... see obtainCurrLang() for more info
  this.currLang = null;

  // Default language to be used
  this.defLang = null;

  // If the language comes as URL parameter, the name of the URL parameter
  this.langUrlParameterName = "lang";

  // If true, the keys of the strings to be translated are stored in case insensitive
  // mode. So, if we get form de server something like "Greeting" => "Muy buenas"
  // and we ask tor the translation of "greeting", if it is case insensitive I'll
  // get "Muy buenas", otherwise null or a default value.
  this.keysCaseInsensitive = true;

  // Class that identifies the HTMLElements to be translated
  this.i18nClass = "i18n";
  
  // Folder containing the files with the translations
  this.dataDir = "./i18n/";

  // Map key:value with all the translations in the current language
  this.translations = new Array();

  // Selectors
  this.selectors = new Array();
  
  // Map  where the key es el string to be translated and the value 
  // is an array with all the HTMLElements with that string
  this.mapEle = null; 

  // If true, all the translations are kept ina single file. If false, each
  // page has its own file
  this.singleTranslationsFile = true;
  
  // Name of the cookie for keeping the language. If null, no cookie is used
  this.cookieName = "i18n_lang";
}

// --------------------------------------------------------------------- Setters
I18N.prototype.setCurrLang = function(currLang) {
  this.currLang = currLang;
}

I18N.prototype.setDefLang = function(defLang) {
  this.defLang = defLang;
}

I18N.prototype.setLangUrlParameterName = function(langUrlParameterName) {
  this.langUrlParameterName = langUrlParameterName;
}

I18N.prototype.setKeysCaseInsensitive = function(keysCaseInsensitive) {
  this.keysCaseInsensitive = keysCaseInsensitive;
}

I18N.prototype.setI18nClass = function(i18nClass) {
  this.i18nClass = i18nClass;
}

I18N.prototype.setDataDir = function(dataDir) {
  this.dataDir = dataDir;
}

I18N.prototype.setCurrLangUrlParameter = function (parameterName) {
  this.langUrlParameterName = parameterName;
}

I18N.prototype.setSingleTranslationsFile = function (singleTranslationsFile) {
  this.singleTranslationsFile = singleTranslationsFile;
}


// ----------------------------------------------------- Configuration Functions

// Function used to get the value of a key when its translation is not defined 
I18N.prototype.funcValue4NotTranslated = function(pKey) {
  return "[" + pKey + "]";
};

// Funtion returning the name of the file with the translations
I18N.prototype.funcGetFile = function() {
  // A single file with all the translations
  if ( this.singleTranslationsFile ) {
    return this.dataDir + "i18n_" + this.currLang + ".txt";    
  // Every page has its own file  
  } else {
    // By default, the name of the file is the name of the page without 
    // the extension + "-lang.txt"
    var sPath = window.location.pathname;
    var sPage = sPath.substring(sPath.lastIndexOf('/') + 1);
    var sPageWithoutExt = sPage.substring(0,sPage.lastIndexOf('.'));
  
    return this.dataDir + sPageWithoutExt + "_" + this.currLang + ".txt";    
  }

};

/**
 * Function called to select a language form the language selector
 */
I18N.prototype.funcSelectLang = function(ele) {
    YAHOO.util.Dom.addClass(ele, "active_lang");
}

/**
 * Function called to deselect a language from the langauage selector
 */
I18N.prototype.funcDeselectLang = function(ele) {
    YAHOO.util.Dom.removeClass(ele, "active_lang");
}

// ----------------------------------------------------------- Protected Methods
// Usually t6hise methods shouldn't be called by the user and they are used
// internally

/**
 * Compute the currLang value. 
 * This method is called internally by any function that uses 'this.currLang'.
 * The order (more priority to less) is:
 * - Value set by the user (calling setCurrLang())
 * - Obtained form the url (if langUrlParameterName!=null)
 * - TODO: Cookies
 * - TODO: HTTP Headers
 * - defLang
 */
I18N.prototype.obtainCurrLang = function() {
  // 1.- Lang set by the user
  var lang = this.currLang;
  
  // 2.- URL parameter
  if ( lang==null && this.langUrlParameterName!=null ) {
    var queryString = window.top.location.search.substring(1);
    var parameterName = this.langUrlParameterName + "=";
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
        // Get the value
        lang = unescape ( queryString.substring ( begin, end ) );
      }
    }
  }
  
  // 3.- Cookie
  if ( lang==null && this.cookieName!=null ) {
    if (document.cookie.length>0)
    {
      var c_start=document.cookie.indexOf(this.cookieName + "=");
      if (c_start!=-1)
      {
        c_start=c_start + this.cookieName.length+1;
        var c_end=document.cookie.indexOf(";",c_start);
        if (c_end==-1) c_end=document.cookie.length;
        lang = unescape(document.cookie.substring(c_start,c_end));
        //alert("Found cookie " + this.cookieName + "=" + lang);
      }
    }
  }

  // 4.- Default Lang
  if ( lang==null && this.defLang!=null ) {
    lang = this.defLang;
  }
  
  // ERROR: Language not set
  if ( lang==null ) {
    alert("Language can not be set");
  // Actualize currLang
  } else {
    this.currLang=lang;
    
    // Kep the lang in the cookie
    // TODO : Do we have to do this always?
    var expireDays = 10*365;
    var path = "/";
    var exdate=new Date();
    exdate.setDate(exdate.getDate()+expireDays);
    
    document.cookie=this.cookieName+ "=" +escape(lang)+ ((expireDays==null) ? "" : ";expires="+exdate.toUTCString() + ";path=" + path);
  }
}

/**
 * Find all HTMLElements that are going to be translated (builds this.mapEle)
 */
I18N.prototype.obtainI18NElements = function() {
  if ( this.mapEle!=null ) return;
  
  this.mapEle = [];
  
  // Get all the HTML elements that need a translation
  var myself=this;
  YAHOO.util.Dom.getElementsByClassName(this.i18nClass, null, null, function(ele) {
    var text=ele.id;
    if ( !text||text.length==0 ) {
      text=this.keysCaseInsensitive ? ele.innerHTML.toLowerCase() : ele.innerHTML;
    }
    ele.innerHTML="";
    if ( text ) {
      /*
      if ( text.indexOf(",")!=-1 ) {
        throw "No se puede traducir el término '" + text + "' porque contiene una , (carácter no válido)";
      }
      */
      // Nos vamos a guardar este HTMLElement, asociado a este texto
      var lista = myself.mapEle[text];
      // Nuevo término
      if ( !lista ) {
        lista = new Array();
        myself.mapEle[text] = lista;
      }
      lista.push(ele);
    }
  });
    
}

// -------------------------------------------------------------- Public Methods
/** 
 * Utility that prints the multilanguage contents of the page and generate
 * the JSON.
 */
I18N.prototype.buildJSON = function() {
  this.obtainI18NElements();

  // Translate all the HTML elements
  var json = "{\n";
  for ( var key in this.mapEle ) {
    // If this is not the first element, put a ","
    if ( json.indexOf(":")!=-1 ) {
      json += ',\n';
    }
    json += '"' + key + '" : "__' + key + '__"';
  }  
  json += "\n}";
  
  alert(json);
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
I18N.prototype.loadData = function(pCallback, pParams) {
  this.obtainCurrLang();

  var callback = pCallback;
  var params = pParams;
  
  var myself = this;
  
 
 YAHOO.util.Connect.asyncRequest("POST", this.funcGetFile(),
 { 
   success: function(o) { 
     var data = YAHOO.lang.JSON.parse(o.responseText);
     //var cadenas = data;
     for(var key in data ) {
       myself.translations[myself.keysCaseInsensitive ? key.toLowerCase() : key] = data[key];
     }
     if ( callback ) {
       callback(params); 
     }
   },
   failure: function(o) { /* Ignore. This error can raise if file loaded in local*/ }
 });
}

/**
 * Translate the page using the translations we already have.
 */
I18N.prototype.translatePage = function() {
  this.obtainI18NElements();

  // Translate all the HTML elements
  for ( var key in this.mapEle ) {
    var listaEle = this.mapEle[key];
    for(var ind=0; ind<listaEle.length; ++ind ) {
      var ele = listaEle[ind];
      ele.innerHTML = this.translateStr(key);
      YAHOO.util.Dom.setStyle(ele, "visibility", "visible");
    }  
  }
}

/**
 * Get the translations and translate the page (utility function).
 */
I18N.prototype.loadAndTranslate = function() {
  this.obtainCurrLang();
  
  var myself = this;  
  this.loadData(function(){
    // Esto lo ejecutamos sólo cuando ya se haya cargado todo el HTML
    YAHOO.util.Event.onDOMReady(function(){
        // Marcamos el idioma activo
        myself.funcSelectLang(myself.selectors[myself.currLang]);
        // Traducimos la página
        myself.translatePage();
    }); 
  });
}

/**
 * Set the language selectors for the page, the elements that we have to click
 * in order to change the language.
 */ 
I18N.prototype.setLangSelectors = function(lista) {
  this.obtainCurrLang();

  var myself = this;

  // Loop over all the selectors
  for(var ind=0; ind<lista.length; ++ind) {
    var ele = YAHOO.util.Dom.get(lista[ind][0]);
    var lang = lista[ind][1];

    this.selectors[lang] = ele;
    YAHOO.util.Event.addListener(ele, "click", function(evt, pLang) {
      myself.changeLang(pLang);
    }, lang);
  }
  if ( this.currLang!=null ) {
    this.funcSelectLang(this.selectors[this.currLang]);
  }
}


/**
 * Change the current language. 
 */
I18N.prototype.changeLang = function(lang) {
  // Refresca la página, cambiando el idioma
  // ¿Por qué refrescamos la página y no usamos JS? Se podría hacer, pero:
  // - Complica el código
  // - Nos obliga a cargar todos los contenidos en todos los idioma (problemas
  //   si hay muchos idiomas)
  // - El cambio lo hacemos en JS y tenemos que comunicarlo al servidor (para
  //   que al navegar se mantenga el nuevo idioma) y eso lía el código.
  // Lo más sencillo: refrescar la página (no es tan cool pero.....)
  // Deseleccionamos el idioma antiguo
 
  // Refrescamos la página
  var newUrl;

  if ( this.langUrlParameterName!=null ) {
    // Add lang=es to the URL.
    var url = window.top.location.href;
    if ( url.indexOf("?")==-1 ) {
      newUrl = url + "?" + this.langUrlParameterName + "=" + lang;
    // Parámetros adicionales  
    } else {
      var startPos = url.indexOf(this.langUrlParameterName+"=");
      
      // Este parámetro no existe, lo añadimos    
      if ( startPos==-1 ) {
        newUrl = url + "&" + this.langUrlParameterName + "=" + lang;
      // Existe, tenemos que cambiar el valor 
      } else {
        // Ponemos el nuevo valor
        newUrl = url.substring(0, startPos) + this.langUrlParameterName + "=" + lang;

        // Vamos a ver si el parámetro no estaba al final de la cadena, 
        // con lo que nos queda un troz de url por añadir
        var endPos = url.indexOf("&", startPos+(this.langUrlParameterName+"=").length);
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
I18N.prototype.translateStr = function(str) {
  var translation = this.translations[this.keysCaseInsensitive ? str.toLowerCase() : str];

  return translation ? translation : this.funcValue4NotTranslated(str);
}
