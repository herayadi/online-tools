!function(t,e,n,a){function o(t,e,n){l({src:t[e++],onload:function(){e===t.length?n():o(t,e,n)}})}function r(t){t=Array.isArray(t)?t:[t];var e={status:0,load:function(n){e.status||(e.status=1,o(t,0,function(){e.status=2,n&&setTimeout(n)}))}};return e}function i(t,e){function n(){u(t,a+new Array(r++%3+2).join("."))}e=e||300;var a,o,r,i={start:function(t){a=t||"processing",i.stop(),r=2,n(),o=setInterval(n,e)},stop:function(){o&&(clearInterval(o),o=null)}};return i}function c(t){return/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)}function s(e){return c(e)?t(e).val():t(e).text()}function u(e,n){e.each(function(){c(this)?t(this).val(n):t(this).text(n)})}function l(t){var e=n.createElement("script");e.async=!0,e.src=t.src,e.onload=t.onload,e.crossOrigin=t.crossOrigin,n.body.appendChild(e)}function h(){for(var t=0;t<delayScripts.length;++t)!function(t){setTimeout(function(){t.src?l(t):t.onload&&t.onload()},t.delay||0)}(delayScripts[t])}function p(a,o){var r=t("#remember-input"),i=t("[data-remember]"),c=localStorage.getItem(y);return a||o||!c||(r.prop("checked",!0),i.each(function(){var e=localStorage.getItem(y+"_"+t(this).data("remember"));e&&("SELECT"===this.tagName?t(this).find('option[value="'+e+'"]').length&&t(this).val(e):"checkbox"===this.type?t(this).prop("checked","1"===e):t(this).val(e))})),r.change(function(){r.prop("checked")?(c=!0,localStorage.setItem(y,"1"),i.trigger("input"),o&&(o=!1,e.history.pushState({},n.title,location.pathname))):(c=!1,localStorage.removeItem(y),i.each(function(){localStorage.removeItem(y+"_"+t(this).data("remember"))}))}),i.on("input",function(){if(c){var e=y+"_"+t(this).data("remember");"checkbox"===this.type?t(this).prop("checked")?localStorage.setItem(e,1):localStorage.setItem(e,0):localStorage.setItem(e,t(this).val())}}),i.length||r.closest(".option-block").hide(),c}function d(){for(var t={},e=location.search.substring(1),n=e.split("&"),a=0;a<n.length;++a){var o=n[a].split("=");t[o[0]]=decodeURIComponent(o[1])}return t}function g(){if(t("#share-link").length){var e=d(),n=!1;return t("[data-share]").each(function(){var a=t(this).data("share"),o=e[a];o&&(o=o,"SELECT"===this.tagName?t(this).find('option[value="'+o+'"]').length&&t(this).val(o):"checkbox"===this.type?t(this).prop("checked","1"===o):t(this).val(o),n=!0)}),n}}function f(){var e=localStorage.getItem("SWAP")||"{}";localStorage.removeItem("SWAP");try{e=JSON.parse(e)}catch(t){return!1}for(var n=Object.keys(e),a=0;a<n.length;++a){var o=n[a],r=t(o);r.length&&("checkbox"===r[0].type?r.prop("checked",!0):r.val(e[o]))}var i=localStorage.getItem("NO_SWAPPED");return localStorage.removeItem("NO_SWAPPED"),n.length&&!i}function m(){var e=t("#share-link");if(e.length){var n=[];t("[data-share]:not([data-share-ignore])").each(function(){var e=t(this).data("share"),a="";(a="checkbox"===this.type?t(this).prop("checked")?"1":"0":t(this).val())&&n.push(e+"="+encodeURIComponent(a))});var a="";n.length&&(a=location.origin+location.pathname+"?"+n.join("&")),e.val(a)}}function v(t,e,n){t===ot.executeId&&O(e,n)}function b(){function n(t){t.classList.add("adsbygoogle"),(e.adsbygoogle=e.adsbygoogle||[]).push({})}var a=new IntersectionObserver(function(t){t.forEach(function(t){t.isIntersecting&&(a.unobserve(t.target),n(t.target))})},{rootMargin:"200px 0px"});t("ins.ads").each(function(){a.observe(this)})}e.ot=e.ot||{},e.method=e.method||null,Object.assign||(++waitLoadCount,delayScripts.push({src:"https://cdnjs.cloudflare.com/ajax/libs/core-js/3.33.1/minified.js",onload:function(){methodLoad()}})),e.withOptions=function(e,n,a){a=a||0;var o=n.map(function(e){var n=t('[data-option="'+e+'"]');return{name:e,element:n,type:n.data("option-type")}}),r=function(t){return function(e){for(var n=[],r=0;r<o.length;++r){var i=o[r];if("encoding"===i.type){var c=I(i.element);if(!1===c)return!1;n.push(c)}else{var s=i.element.val();"number"===i.element.attr("type")?s=parseFloat(s):"checkbox"===i.element.attr("type")&&(s=i.element.prop("checked")),n.push(s)}}return n.splice(a,0,e),t.apply(this,n)}},i=r(e);return e.update&&(i.update=r(e.update)),i},e.withOptionsObj=function(e){var n=[];t("[data-option]").each(function(){n.push(t(this).data("option"))});for(var a=["input"],o=0;o<n.length;++o)a.push(n[o].replace(/[_-](.)/g,function(t,e){return e.toUpperCase()}));var r=function(t){return function(){for(var e={},n=0;n<arguments.length;++n)e[a[n]]=arguments[n];return t.call(this,e)}},i=r(e);return e.update&&(i.update=r(e.update)),withOptions(i,n)};var y="REMEMBER_INPUT";e.swap=function(e,n){gtag("event","swap");for(var a={},o=0;o<n.length;++o){var r=n[o],i=t(r[0]);a[r[1]]=r[2]?i.prop("checked")?"1":"":s(i[0])}localStorage.setItem("SWAP",JSON.stringify(a)),location.href=e};var k,S,I,O;t(n).ready(function(){h();var a,o=f(),c=!o&&g(),s=p(o,c),l=t("#input"),y=t("#output"),x=t("#auto-update"),C=x.prop("checked"),w=i(y);ot.executeId=0,handleOutput=function(t,e){t instanceof Promise?t.then(function(t){v(e,y,t)}).catch(function(t){v(e,y,t)}):v(e,y,t)};var E=!1;if(k=function(){if(P<waitLoadCount)return E=!0,void w.start("loading");if(method){var t=++ot.executeId;try{if(m(),val=I(l),!1===val)return;gtag("event","submit"),handleOutput(method(val),t)}catch(e){v(t,y,e)}}},S=function(){x[0].checked&&(a&&(clearTimeout(a),a=null),a=setTimeout(function(){k()},0))},I=function(t){return t.val()},O=function(t,e){u(t,e)},x.length>0){var T=function(){t(this).off("change",S),t(this).off("input propertychange",T)};t("[data-auto-update], [data-option]").on("input propertychange",T),t("[data-auto-update], [data-option]").on("input propertychange change",S),x.change(S)}t(".btn-execute").click(function(){k()});var P=0;e.methodLoad=function(){++P<waitLoadCount||(w.stop(),t(e).trigger("methodLoad"),(o||c||s&&C||E)&&k())},ot.getQuery=d,ot.createOnDemandScript=r,ot.createProcessingMessage=i,ot.getInput=I,ot.setOutput=O,ot.autoUpdate=S,ot.handleOutput=handleOutput,ot.execute=k,ot.setExecute=function(t){ot.execute=k=t},ot.setGetInput=function(t){ot.getInput=I=t},ot.setSetOutput=function(t){ot.setOutput=O=t};var A=t("#sidebar details.active")[0];A&&A.scrollIntoView(),t("#sidebar-toggler").click(function(){t("#sidebar").addClass("open"),t("#sidebar-toggler").attr("aria-expanded",!0)}),t("#sidebar .mask").click(function(){t("#sidebar").removeClass("open"),t("#sidebar-toggler").attr("aria-expanded",!1)}),t(".theme").click(function(){t("html").toggleClass("dark-theme"),localStorage.setItem("DARK",t("html").hasClass("dark-theme")?1:0),gtag("event","theme")}),t('[data-toggle="copyblock"]').each(function(){var e=t(this),n=t(e.find("[data-clipboard-target]").data("clipboard-target")),a=t("<div></div>");e.prop("open")||(n.replaceWith(a),n.appendTo("body").addClass("hidden-input")),e.on("toggle",function(){e.prop("open")?a.replaceWith(n.removeClass("hidden-input")):(n.replaceWith(a),n.appendTo("body").addClass("hidden-input"))})}),t('[data-toggle="toggle"]').each(function(){var e=t(this),n=t(e.data("target")),a=function(){n.toggle(e.prop("checked"))};e.change(a),a()}),t('[data-toggle="fullscreen"]').each(function(){var e=t(this),n=e.closest(".block");e.click(function(){n.toggleClass("fullscreen"),gtag("event","fullscreen")})}),t("summary").on("click",".toolbar",function(t){t.preventDefault()}),t(n).on("click",function(e){t("details.page-title-menu[open]").each(function(){this.contains(e.target)||(this.open=!1)})}),t(n).on("keydown",function(e){27===e.which&&t("details.page-title-menu[open]").each(function(){this.open=!1})}),t("[data-remember-open]").each(function(){var e=this,n="OPEN_"+t(e).data("remember-open");t(e).on("toggle",function(){localStorage.setItem(n,e.open?"1":"0")})}),t(".tool-description").one("toggle",function(){gtag("event","detail")});(function() {
  try {
    var sb = t('#sidebar .container');
    if (sb.length) {
      var sbWrap = t('<div class="sidebar-search-wrap"><input type="search" id="sidebar-search" class="sidebar-search-input" placeholder="Search tools..." autocomplete="off" spellcheck="false"></div>');
      t('#sidebar header').after(sbWrap);
      sbWrap.find('input').on('input', function() {
        var q = t(this).val().trim().toLowerCase();
        if (!q) {
          t('#sidebar details').show().each(function() {
            t(this).find('li').show();
            if (!t(this).hasClass('active')) {
              this.open = false;
            }
          });
          return;
        }
        t('#sidebar details').each(function() {
          var d = t(this);
          var matchCount = 0;
          d.find('li').each(function() {
            var li = t(this);
            var txt = li.text().toLowerCase();
            if (txt.indexOf(q) !== -1) {
              li.show();
              matchCount++;
            } else {
              li.hide();
            }
          });
          if (matchCount > 0) {
            d.show();
            this.open = true;
          } else {
            d.hide();
          }
        });
      });
    }

    var idx = t('#index');
    if (idx.length) {
      var idxWrap = t('<div class="index-search-wrap"><input type="search" id="index-search" class="index-search-input" placeholder="Search 270+ tools (SHA256, AES, Base64, UUID, JSON, QR...)" autocomplete="off" spellcheck="false"><span class="search-badge">Press / to focus</span></div>');
      idx.prepend(idxWrap);
      var idxInput = idxWrap.find('input');
      t(n).on('keydown', function(e) {
        if (e.key === '/' && !c(e.target)) {
          e.preventDefault();
          idxInput.focus();
        }
      });
      idxInput.on('input', function() {
        var q = t(this).val().trim().toLowerCase();
        if (!q) {
          t('#index .section').show();
          t('#index .block').show().find('li').show();
          return;
        }
        t('#index .section').each(function() {
          var sec = t(this);
          var secMatches = 0;
          sec.find('.block').each(function() {
            var blk = t(this);
            var heading = blk.find('h3').text().toLowerCase();
            var blkMatches = 0;
            blk.find('li').each(function() {
              var li = t(this);
              var txt = li.text().toLowerCase();
              if (heading.indexOf(q) !== -1 || txt.indexOf(q) !== -1) {
                li.show();
                blkMatches++;
              } else {
                li.hide();
              }
            });
            if (blkMatches > 0) {
              blk.show();
              secMatches++;
            } else {
              blk.hide();
            }
          });
          if (secMatches > 0) {
            sec.show();
          } else {
            sec.hide();
          }
        });
      });
    }
  } catch (err) {
    console.error('Search init error:', err);
  }
})();
"localhost"!=location.hostname&&b()});var x;e.showMessage=function(e,n,a){t("#message").stop(!0,!0).text(e).show(),t("#message").toggleClass("error",!!n),clearTimeout(x),x=setTimeout(function(){t("#message").fadeOut(1e3)},a||2e3)}}(jQuery,window,document);