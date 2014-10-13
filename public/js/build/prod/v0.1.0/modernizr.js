!function(e,t,n){function r(e,t){return typeof e===t}function o(){var e,t,n,o,i,a,s;for(var l in m){if(e=[],t=m[l],t.name&&(e.push(t.name.toLowerCase()),t.options&&t.options.aliases&&t.options.aliases.length))for(n=0;n<t.options.aliases.length;n++)e.push(t.options.aliases[n].toLowerCase());for(o=r(t.fn,"function")?t.fn():t.fn,i=0;i<e.length;i++)a=e[i],s=a.split("."),1===s.length?v[s[0]]=o:2===s.length&&(!v[s[0]]||v[s[0]]instanceof Boolean||(v[s[0]]=new Boolean(v[s[0]])),v[s[0]][s[1]]=o),y.push((o?"":"no-")+s.join("-"))}}function i(e){var t=E.className,n=v._config.classPrefix||"",r=new RegExp("(^|\\s)"+n+"no-js(\\s|$)");t=t.replace(r,"$1"+n+"js$2"),v._config.enableClasses&&(t+=" "+n+e.join(" "+n),E.className=t)}function a(e,t){if("object"==typeof e)for(var n in e)g(e,n)&&a(n,e[n]);else{e=e.toLowerCase();var r=e.split("."),o=v[r[0]];if(2==r.length&&(o=o[r[1]]),"undefined"!=typeof o)return v;t="function"==typeof t?t():t,1==r.length?v[r[0]]=t:2==r.length&&(!v[r[0]]||v[r[0]]instanceof Boolean||(v[r[0]]=new Boolean(v[r[0]])),v[r[0]][r[1]]=t),i([(t?"":"no-")+r.join("-")]),v._trigger(e,t)}return v}function s(e,t){return!!~(""+e).indexOf(t)}function l(){var e=t.body;return e||(e=S("body"),e.fake=!0),e}function u(e,t,n,r){var o,i,a,s,u="modernizr",c=S("div"),f=l();if(parseInt(n,10))for(;n--;)a=S("div"),a.id=r?r[n]:u+(n+1),c.appendChild(a);return o=["&#173;",'<style id="s',u,'">',e,"</style>"].join(""),c.id=u,(f.fake?f:c).innerHTML+=o,f.appendChild(c),f.fake&&(f.style.background="",f.style.overflow="hidden",s=E.style.overflow,E.style.overflow="hidden",E.appendChild(f)),i=t(c,e),f.fake?(f.parentNode.removeChild(f),E.style.overflow=s,E.offsetHeight):c.parentNode.removeChild(c),!!i}function c(e){return e.replace(/([A-Z])/g,function(e,t){return"-"+t.toLowerCase()}).replace(/^ms-/,"-ms-")}function f(t,r){var o=t.length;if("CSS"in e&&"supports"in e.CSS){for(;o--;)if(e.CSS.supports(c(t[o]),r))return!0;return!1}if("CSSSupportsRule"in e){for(var i=[];o--;)i.push("("+c(t[o])+":"+r+")");return i=i.join(" or "),u("@supports ("+i+") { #modernizr { position: absolute; } }",function(t){return"absolute"==(e.getComputedStyle?getComputedStyle(t,null):t.currentStyle).position})}return n}function d(e){return e.replace(/([a-z])-([a-z])/g,function(e,t,n){return t+n.toUpperCase()}).replace(/^-/,"")}function p(e,t,o,i){function a(){u&&(delete b.style,delete b.modElem)}if(i=r(i,"undefined")?!1:i,!r(o,"undefined")){var l=f(e,o);if(!r(l,"undefined"))return l}var u,c,p,m,h;for(b.style||(u=!0,b.modElem=S("modernizr"),b.style=b.modElem.style),p=e.length,c=0;p>c;c++)if(m=e[c],h=b.style[m],s(m,"-")&&(m=d(m)),b.style[m]!==n){if(i||r(o,"undefined"))return a(),"pfx"==t?m:!0;try{b.style[m]=o}catch(v){}if(b.style[m]!=h)return a(),"pfx"==t?m:!0}return a(),!1}var m=[],h={_version:"v3.0.0pre",_config:{classPrefix:"",enableClasses:!0,usePrefixes:!0},_q:[],on:function(e,t){var n=this;setTimeout(function(){t(n[e])},0)},addTest:function(e,t,n){m.push({name:e,fn:t,options:n})},addAsyncTest:function(e){m.push({name:null,fn:e})}},v=function(){};v.prototype=h,v=new v;var g,y=[],E=t.documentElement;!function(){var e={}.hasOwnProperty;g=r(e,"undefined")||r(e.call,"undefined")?function(e,t){return t in e&&r(e.constructor.prototype[t],"undefined")}:function(t,n){return e.call(t,n)}}(),h._l={},h.on=function(e,t){this._l[e]||(this._l[e]=[]),this._l[e].push(t),v.hasOwnProperty(e)&&setTimeout(function(){v._trigger(e,v[e])},0)},h._trigger=function(e,t){if(this._l[e]){var n=this._l[e];setTimeout(function(){var e,r;for(e=0;e<n.length;e++)(r=n[e])(t)},0),delete this._l[e]}},v._q.push(function(){h.addTest=a});!function(e,t){function n(e,t){var n=e.createElement("p"),r=e.getElementsByTagName("head")[0]||e.documentElement;return n.innerHTML="x<style>"+t+"</style>",r.insertBefore(n.lastChild,r.firstChild)}function r(){var e=_.elements;return"string"==typeof e?e.split(" "):e}function o(e){var t=b[e[S]];return t||(t={},C++,e[S]=C,b[C]=t),t}function i(e,n,r){if(n||(n=t),h)return n.createElement(e);r||(r=o(n));var i;return i=r.cache[e]?r.cache[e].cloneNode():E.test(e)?(r.cache[e]=r.createElem(e)).cloneNode():r.createElem(e),!i.canHaveChildren||y.test(e)||i.tagUrn?i:r.frag.appendChild(i)}function a(e,n){if(e||(e=t),h)return e.createDocumentFragment();n=n||o(e);for(var i=n.frag.cloneNode(),a=0,s=r(),l=s.length;l>a;a++)i.createElement(s[a]);return i}function s(e,t){t.cache||(t.cache={},t.createElem=e.createElement,t.createFrag=e.createDocumentFragment,t.frag=t.createFrag()),e.createElement=function(n){return _.shivMethods?i(n,e,t):t.createElem(n)},e.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+r().join().replace(/[\w\-:]+/g,function(e){return t.createElem(e),t.frag.createElement(e),'c("'+e+'")'})+");return n}")(_,t.frag)}function l(e){e||(e=t);var r=o(e);return!_.shivCSS||m||r.hasCSS||(r.hasCSS=!!n(e,"article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}")),h||s(e,r),e}function u(e){for(var t,n=e.getElementsByTagName("*"),o=n.length,i=RegExp("^(?:"+r().join("|")+")$","i"),a=[];o--;)t=n[o],i.test(t.nodeName)&&a.push(t.applyElement(c(t)));return a}function c(e){for(var t,n=e.attributes,r=n.length,o=e.ownerDocument.createElement(w+":"+e.nodeName);r--;)t=n[r],t.specified&&o.setAttribute(t.nodeName,t.nodeValue);return o.style.cssText=e.style.cssText,o}function f(e){for(var t,n=e.split("{"),o=n.length,i=RegExp("(^|[\\s,>+~])("+r().join("|")+")(?=[[\\s,>+~#.:]|$)","gi"),a="$1"+w+"\\:$2";o--;)t=n[o]=n[o].split("}"),t[t.length-1]=t[t.length-1].replace(i,a),n[o]=t.join("}");return n.join("{")}function d(e){for(var t=e.length;t--;)e[t].removeNode()}function p(e){function t(){clearTimeout(a._removeSheetTimer),r&&r.removeNode(!0),r=null}var r,i,a=o(e),s=e.namespaces,l=e.parentWindow;return!N||e.printShived?e:("undefined"==typeof s[w]&&s.add(w),l.attachEvent("onbeforeprint",function(){t();for(var o,a,s,l=e.styleSheets,c=[],d=l.length,p=Array(d);d--;)p[d]=l[d];for(;s=p.pop();)if(!s.disabled&&T.test(s.media)){try{o=s.imports,a=o.length}catch(m){a=0}for(d=0;a>d;d++)p.push(o[d]);try{c.push(s.cssText)}catch(m){}}c=f(c.reverse().join("")),i=u(e),r=n(e,c)}),l.attachEvent("onafterprint",function(){d(i),clearTimeout(a._removeSheetTimer),a._removeSheetTimer=setTimeout(t,500)}),e.printShived=!0,e)}var m,h,v="3.7.0",g=e.html5||{},y=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,E=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,S="_html5shiv",C=0,b={};!function(){try{var e=t.createElement("a");e.innerHTML="<xyz></xyz>",m="hidden"in e,h=1==e.childNodes.length||function(){t.createElement("a");var e=t.createDocumentFragment();return"undefined"==typeof e.cloneNode||"undefined"==typeof e.createDocumentFragment||"undefined"==typeof e.createElement}()}catch(n){m=!0,h=!0}}();var _={elements:g.elements||"abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output picture progress section summary template time video",version:v,shivCSS:g.shivCSS!==!1,supportsUnknownElements:h,shivMethods:g.shivMethods!==!1,type:"default",shivDocument:l,createElement:i,createDocumentFragment:a};e.html5=_,l(t);var T=/^$|\b(?:all|print)\b/,w="html5shiv",N=!h&&function(){var n=t.documentElement;return!("undefined"==typeof t.namespaces||"undefined"==typeof t.parentWindow||"undefined"==typeof n.applyElement||"undefined"==typeof n.removeNode||"undefined"==typeof e.attachEvent)}();_.type+=" print",_.shivPrint=p,p(t)}(this,t);var S=function(){return"function"!=typeof t.createElement?t.createElement(arguments[0]):t.createElement.apply(t,arguments)},C={elem:S("modernizr")};v._q.push(function(){delete C.elem});var b={style:C.elem.style};v._q.unshift(function(){delete b.style});h.testProp=function(e,t,r){return p([e],n,t,r)};o(),i(y),delete h.addTest,delete h.addAsyncTest;for(var _=0;_<v._q.length;_++)v._q[_]();e.Modernizr=v}(this,document);