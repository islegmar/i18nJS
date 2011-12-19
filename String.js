/**
 * (Optional) Extends the class String for i18n
 */
String.prototype.translate = function() {
  return I18N.translateStr(this);
}

String.prototype.startsWith = function(str){
    return (this.indexOf(str) === 0);
}
