!function(t){"use strict";
function unescapeRaw(str){
  var s=String(str||"").trim();
  if((s.charAt(0)==='"'&&s.charAt(s.length-1)==='"')||(s.charAt(0)==="'"&&s.charAt(s.length-1)==="'")){
    if(s.charAt(0)==='"'){
      try{return JSON.parse(s)}catch(e){}
    }
    s=s.slice(1,-1);
  }
  try{
    var safe=s.replace(/\r/g,"\\r").replace(/\n/g,"\\n");
    return JSON.parse('"'+safe+'"');
  }catch(e){
    return s
      .replace(/\\"/g,'"')
      .replace(/\\'/g,"'")
      .replace(/\\n/g,"\n")
      .replace(/\\r/g,"\r")
      .replace(/\\t/g,"\t")
      .replace(/\\b/g,"\b")
      .replace(/\\f/g,"\f")
      .replace(/\\\\/g,"\\");
  }
}
function parseSmart(raw){
  var s=String(raw||"").trim();
  try{
    var p=JSON.parse(s);
    if(typeof p==="string"){
      try{return JSON.parse(p.trim())}catch(e){}
    }
    return p;
  }catch(firstErr){
    var cur=s;
    for(var i=0;i<3;i++){
      var next=unescapeRaw(cur);
      if(next===cur)break;
      cur=String(next).trim();
      try{
        var p2=JSON.parse(cur);
        if(typeof p2==="string"){
          cur=p2.trim();
          continue;
        }
        return p2;
      }catch(e2){}
    }
    throw firstErr;
  }
}
function unescapeJson(input,mode){
  if(!input||!String(input).trim())return"";
  mode=mode||"compact";
  var current=String(input).trim();
  for(var i=0;i<3;i++){
    try{
      var parsed=JSON.parse(current);
      if(typeof parsed==="string"){
        current=parsed.trim();
        continue;
      }
      if(mode==="pretty-2")return JSON.stringify(parsed,null,2);
      if(mode==="pretty-4")return JSON.stringify(parsed,null,4);
      if(mode==="raw")return current;
      return JSON.stringify(parsed);
    }catch(e){
      var next=unescapeRaw(current);
      if(next===current)break;
      current=String(next).trim();
    }
  }
  try{
    var finalParsed=JSON.parse(current);
    if(typeof finalParsed==="object"&&finalParsed!==null){
      if(mode==="pretty-2")return JSON.stringify(finalParsed,null,2);
      if(mode==="pretty-4")return JSON.stringify(finalParsed,null,4);
      if(mode==="raw")return current;
      return JSON.stringify(finalParsed);
    }
  }catch(e){}
  return current;
}
function escapeJson(input,minifyFirst,wrapQuotes){
  if(!input||!String(input).trim())return"";
  var text=String(input);
  if(minifyFirst){
    try{
      var parsed=parseSmart(text);
      text=JSON.stringify(parsed);
    }catch(e){
      text=String(input).trim();
    }
  }
  var escapedWithQuotes=JSON.stringify(text);
  return wrapQuotes?escapedWithQuotes:escapedWithQuotes.slice(1,-1);
}
function n(t){try{return JSON.parse(t),"Valid"}catch(t){return t.message}}
function e(t){if(!t||!String(t).trim())return"";return JSON.stringify(parseSmart(t))}
function r(t,n,e){var r=JSON.stringify(parseSmart(t),null,e);return"tab"===n&&(r=r.replace(/^\s+/gm,function(t){return t.replace(/ /g,"\t")})),r}
function o(n){h||(h=document.createElement("andypf-json-viewer"),h.id="json",h.expanded=!0,h.indent=2,h.showDataTypes=!1,h.showToolbar=!0,h.showSize=!0,h.showCopy=!0,h.expandIconType="square",t("#output").html(h)),h.setAttribute("theme","1"===localStorage.getItem("DARK")?"monokai":"default-light");try{h.data=parseSmart(n)}catch(t){h.data=t.message}}
function a(){v.length&&v.empty()}
function i(t){if("undefined"!=typeof monaco&&monaco.MarkerSeverity){if(t===monaco.MarkerSeverity.Error)return"Error";if(t===monaco.MarkerSeverity.Warning)return"Warning";if(t===monaco.MarkerSeverity.Info)return"Info"}return 8===t?"Error":4===t?"Warning":"Hint"}
function s(t){return i(t).toLowerCase()}
function c(t){return"undefined"!=typeof monaco&&monaco.MarkerSeverity?t:Number(t)||0}
function u(n){if(v.length&&(v.empty(),n&&n.length)){var e=n.slice().sort(function(t,n){return c(n.severity)-c(t.severity)||t.startLineNumber-n.startLineNumber||t.startColumn-n.startColumn}),r=t('<ul class="json-formatter-diagnostics"></ul>');e.forEach(function(n,e){var o=s(n.severity),a=t("<li></li>"),c=t('<button type="button" class="json-formatter-diagnostic"></button>').addClass("json-formatter-diagnostic-"+o);c.attr("data-marker-index",e),c.attr("title",n.message),c.append(t('<span class="json-formatter-diagnostic-icon" aria-hidden="true"></span>').text("error"===o?"\u00d7":"warning"===o?"!":"info"===o?"i":"\u00b7"),t('<span class="json-formatter-diagnostic-content"></span>').append(t('<span class="json-formatter-diagnostic-meta"></span>').text(i(n.severity)+" \u00b7 Line "+n.startLineNumber+", Col "+n.startColumn),t('<span class="json-formatter-diagnostic-message"></span>').text(n.message))),c.data("marker",n),a.append(c),r.append(a)}),v.append(r)}}
function d(){try{var n=t("#input").monacoEditor("getMarkers");return Array.isArray(n)?n:[]}catch(t){return[]}}
function f(){u(d())}
function m(){return w?void f():"undefined"!=typeof monaco&&monaco.editor&&monaco.editor.onDidChangeMarkers?(w=monaco.editor.onDidChangeMarkers(function(){f()}),void f()):void f()}
function p(){m(),f()}
function l(t){return t&&t.message?String(t.message):String(t||"")}
function g(t){ot.setBlobDownload({filename:"formatted.json",content:t,type:"application/json;charset=utf-8"})}
function y(t,n,e,o){if(ot.clearDownload(),!t)return a(),"";try{var i=r(t,n,e);return p(),g(i),i}catch(a){if(!o)return p(),l(a);try{if(!window.JSONRepair||"function"!=typeof JSONRepair.jsonrepair)throw new Error("JSON repair is unavailable.");var s=JSONRepair.jsonrepair(t);return i=r(s,n,e),p(),g(i),i}catch(t){return p(),l(t)}}}
var h;t(".theme").click(function(){h&&h.setAttribute("theme","1"===localStorage.getItem("DARK")?"monokai":"default-light")});var v=t("#information"),w=null;v.length&&(t(window).on("monacoReady",m),t(window).one("methodLoad",function(){m(),t(document).on("text-import:start",function(){t("#output").val(""),ot.clearDownload(),a()}),t(document).on("text-import:success",function(){t("#auto-update").prop("checked")||a()})}),v.on("click",".json-formatter-diagnostic",function(){var n=t(this).data("marker");if(n)try{t("#input").monacoEditor("selectMarker",n)}catch(t){}})),window.json={validate:n,minify:e,format:r,formatAndRender:y,view:o,unescape:unescapeJson,escape:escapeJson}}(jQuery);