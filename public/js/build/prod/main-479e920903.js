"use strict";

function disableHoverStylesOnScroll() {
  var e,
      t = document.body;t.classList && window.addEventListener && window.addEventListener("scroll", function () {
    clearTimeout(e), t.classList.contains("disable-hover") || t.classList.add("disable-hover"), e = setTimeout(function () {
      t.classList.remove("disable-hover");
    }, 300);
  }, !1);
}if (((function () {
  "use strict";function e(t, i) {
    function o(e, t) {
      return function () {
        return e.apply(t, arguments);
      };
    }var r;if ((i = i || {}, this.trackingClick = !1, this.trackingClickStart = 0, this.targetElement = null, this.touchStartX = 0, this.touchStartY = 0, this.lastTouchIdentifier = 0, this.touchBoundary = i.touchBoundary || 10, this.layer = t, this.tapDelay = i.tapDelay || 200, this.tapTimeout = i.tapTimeout || 700, !e.notNeeded(t))) {
      for (var a = ["onMouse", "onClick", "onTouchStart", "onTouchMove", "onTouchEnd", "onTouchCancel"], s = this, c = 0, u = a.length; u > c; c++) s[a[c]] = o(s[a[c]], s);n && (t.addEventListener("mouseover", this.onMouse, !0), t.addEventListener("mousedown", this.onMouse, !0), t.addEventListener("mouseup", this.onMouse, !0)), t.addEventListener("click", this.onClick, !0), t.addEventListener("touchstart", this.onTouchStart, !1), t.addEventListener("touchmove", this.onTouchMove, !1), t.addEventListener("touchend", this.onTouchEnd, !1), t.addEventListener("touchcancel", this.onTouchCancel, !1), Event.prototype.stopImmediatePropagation || (t.removeEventListener = function (e, n, i) {
        var o = Node.prototype.removeEventListener;"click" === e ? o.call(t, e, n.hijacked || n, i) : o.call(t, e, n, i);
      }, t.addEventListener = function (e, n, i) {
        var o = Node.prototype.addEventListener;"click" === e ? o.call(t, e, n.hijacked || (n.hijacked = function (e) {
          e.propagationStopped || n(e);
        }), i) : o.call(t, e, n, i);
      }), "function" == typeof t.onclick && (r = t.onclick, t.addEventListener("click", function (e) {
        r(e);
      }, !1), t.onclick = null);
    }
  }var t = navigator.userAgent.indexOf("Windows Phone") >= 0,
      n = navigator.userAgent.indexOf("Android") > 0 && !t,
      i = /iP(ad|hone|od)/.test(navigator.userAgent) && !t,
      o = i && /OS 4_\d(_\d)?/.test(navigator.userAgent),
      r = i && /OS [6-7]_\d/.test(navigator.userAgent),
      a = navigator.userAgent.indexOf("BB10") > 0;e.prototype.needsClick = function (e) {
    switch (e.nodeName.toLowerCase()) {case "button":case "select":case "textarea":
        if (e.disabled) return !0;break;case "input":
        if (i && "file" === e.type || e.disabled) return !0;break;case "label":case "iframe":case "video":
        return !0;}return /\bneedsclick\b/.test(e.className);
  }, e.prototype.needsFocus = function (e) {
    switch (e.nodeName.toLowerCase()) {case "textarea":
        return !0;case "select":
        return !n;case "input":
        switch (e.type) {case "button":case "checkbox":case "file":case "image":case "radio":case "submit":
            return !1;}return !e.disabled && !e.readOnly;default:
        return /\bneedsfocus\b/.test(e.className);}
  }, e.prototype.sendClick = function (e, t) {
    var n, i;document.activeElement && document.activeElement !== e && document.activeElement.blur(), i = t.changedTouches[0], n = document.createEvent("MouseEvents"), n.initMouseEvent(this.determineEventType(e), !0, !0, window, 1, i.screenX, i.screenY, i.clientX, i.clientY, !1, !1, !1, !1, 0, null), n.forwardedTouchEvent = !0, e.dispatchEvent(n);
  }, e.prototype.determineEventType = function (e) {
    return n && "select" === e.tagName.toLowerCase() ? "mousedown" : "click";
  }, e.prototype.focus = function (e) {
    var t;i && e.setSelectionRange && 0 !== e.type.indexOf("date") && "time" !== e.type && "month" !== e.type ? (t = e.value.length, e.setSelectionRange(t, t)) : e.focus();
  }, e.prototype.updateScrollParent = function (e) {
    var t, n;if ((t = e.fastClickScrollParent, !t || !t.contains(e))) {
      n = e;do {
        if (n.scrollHeight > n.offsetHeight) {
          t = n, e.fastClickScrollParent = n;break;
        }n = n.parentElement;
      } while (n);
    }t && (t.fastClickLastScrollTop = t.scrollTop);
  }, e.prototype.getTargetElementFromEventTarget = function (e) {
    return e.nodeType === Node.TEXT_NODE ? e.parentNode : e;
  }, e.prototype.onTouchStart = function (e) {
    var t, n, r;if (e.targetTouches.length > 1) return !0;if ((t = this.getTargetElementFromEventTarget(e.target), n = e.targetTouches[0], i)) {
      if ((r = window.getSelection(), r.rangeCount && !r.isCollapsed)) return !0;if (!o) {
        if (n.identifier && n.identifier === this.lastTouchIdentifier) return (e.preventDefault(), !1);this.lastTouchIdentifier = n.identifier, this.updateScrollParent(t);
      }
    }return (this.trackingClick = !0, this.trackingClickStart = e.timeStamp, this.targetElement = t, this.touchStartX = n.pageX, this.touchStartY = n.pageY, e.timeStamp - this.lastClickTime < this.tapDelay && e.preventDefault(), !0);
  }, e.prototype.touchHasMoved = function (e) {
    var t = e.changedTouches[0],
        n = this.touchBoundary;return Math.abs(t.pageX - this.touchStartX) > n || Math.abs(t.pageY - this.touchStartY) > n ? !0 : !1;
  }, e.prototype.onTouchMove = function (e) {
    return this.trackingClick ? ((this.targetElement !== this.getTargetElementFromEventTarget(e.target) || this.touchHasMoved(e)) && (this.trackingClick = !1, this.targetElement = null), !0) : !0;
  }, e.prototype.findControl = function (e) {
    return void 0 !== e.control ? e.control : e.htmlFor ? document.getElementById(e.htmlFor) : e.querySelector("button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea");
  }, e.prototype.onTouchEnd = function (e) {
    var t,
        a,
        s,
        c,
        u,
        l = this.targetElement;if (!this.trackingClick) return !0;if (e.timeStamp - this.lastClickTime < this.tapDelay) return (this.cancelNextClick = !0, !0);if (e.timeStamp - this.trackingClickStart > this.tapTimeout) return !0;if ((this.cancelNextClick = !1, this.lastClickTime = e.timeStamp, a = this.trackingClickStart, this.trackingClick = !1, this.trackingClickStart = 0, r && (u = e.changedTouches[0], l = document.elementFromPoint(u.pageX - window.pageXOffset, u.pageY - window.pageYOffset) || l, l.fastClickScrollParent = this.targetElement.fastClickScrollParent), s = l.tagName.toLowerCase(), "label" === s)) {
      if (t = this.findControl(l)) {
        if ((this.focus(l), n)) return !1;l = t;
      }
    } else if (this.needsFocus(l)) return e.timeStamp - a > 100 || i && window.top !== window && "input" === s ? (this.targetElement = null, !1) : (this.focus(l), this.sendClick(l, e), i && "select" === s || (this.targetElement = null, e.preventDefault()), !1);return i && !o && (c = l.fastClickScrollParent, c && c.fastClickLastScrollTop !== c.scrollTop) ? !0 : (this.needsClick(l) || (e.preventDefault(), this.sendClick(l, e)), !1);
  }, e.prototype.onTouchCancel = function () {
    this.trackingClick = !1, this.targetElement = null;
  }, e.prototype.onMouse = function (e) {
    return this.targetElement ? e.forwardedTouchEvent ? !0 : e.cancelable && (!this.needsClick(this.targetElement) || this.cancelNextClick) ? (e.stopImmediatePropagation ? e.stopImmediatePropagation() : e.propagationStopped = !0, e.stopPropagation(), e.preventDefault(), !1) : !0 : !0;
  }, e.prototype.onClick = function (e) {
    var t;return this.trackingClick ? (this.targetElement = null, this.trackingClick = !1, !0) : "submit" === e.target.type && 0 === e.detail ? !0 : (t = this.onMouse(e), t || (this.targetElement = null), t);
  }, e.prototype.destroy = function () {
    var e = this.layer;n && (e.removeEventListener("mouseover", this.onMouse, !0), e.removeEventListener("mousedown", this.onMouse, !0), e.removeEventListener("mouseup", this.onMouse, !0)), e.removeEventListener("click", this.onClick, !0), e.removeEventListener("touchstart", this.onTouchStart, !1), e.removeEventListener("touchmove", this.onTouchMove, !1), e.removeEventListener("touchend", this.onTouchEnd, !1), e.removeEventListener("touchcancel", this.onTouchCancel, !1);
  }, e.notNeeded = function (e) {
    var t, i, o, r;if ("undefined" == typeof window.ontouchstart) return !0;if (i = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1]) {
      if (!n) return !0;if (t = document.querySelector("meta[name=viewport]")) {
        if (-1 !== t.content.indexOf("user-scalable=no")) return !0;if (i > 31 && document.documentElement.scrollWidth <= window.outerWidth) return !0;
      }
    }if (a && (o = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/), o[1] >= 10 && o[2] >= 3 && (t = document.querySelector("meta[name=viewport]")))) {
      if (-1 !== t.content.indexOf("user-scalable=no")) return !0;if (document.documentElement.scrollWidth <= window.outerWidth) return !0;
    }return "none" === e.style.msTouchAction || "manipulation" === e.style.touchAction ? !0 : (r = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [, 0])[1], r >= 27 && (t = document.querySelector("meta[name=viewport]"), t && (-1 !== t.content.indexOf("user-scalable=no") || document.documentElement.scrollWidth <= window.outerWidth)) ? !0 : "none" === e.style.touchAction || "manipulation" === e.style.touchAction ? !0 : !1);
  }, e.attach = function (t, n) {
    return new e(t, n);
  }, "function" == typeof define && "object" == typeof define.amd && define.amd ? define(function () {
    return e;
  }) : "undefined" != typeof module && module.exports ? (module.exports = e.attach, module.exports.FastClick = e) : window.FastClick = e;
})(), "undefined" == typeof Garp)) var Garp = {};if ((Garp.transitionEndEvents = ["transitionEnd", "oTransitionEnd", "msTransitionEnd", "transitionend", "webkitTransitionEnd"], Garp.animationEndEvents = ["animationend", "webkitAnimationEnd", "oanimationend", "MSAnimationEnd"], Garp.getStyle = function (e, t) {
  return document.defaultView && document.defaultView.getComputedStyle ? document.defaultView.getComputedStyle(e, "").getPropertyValue(t) : e.currentStyle ? (t = t.replace(/\-(\w)/g, function (e, t) {
    return t.toUpperCase();
  }), e.currentStyle[t]) : "";
}, Garp.getTransitionProperty = function () {
  for (var e = document.createElement("fakeelement"), t = ["transition", "OTransition", "MSTransition", "MozTransition", "WebkitTransition"], n = function n(e) {
    return function () {
      return e;
    };
  }, i = 0, o = t.length; o > i; ++i) if (void 0 !== e.style[t[i]]) return (Garp.getTransitionProperty = n(t[i]), t[i]);return null;
}, Garp.getAnimationProperty = function () {
  for (var e = document.createElement("fakeelement"), t = ["animationName", "OAnimationName", "MSAnimationName", "MozAnimationName", "WebkitAnimationName"], n = function n(e) {
    return function () {
      return e;
    };
  }, i = 0, o = t.length; o > i; ++i) if (void 0 !== e.style[t[i]]) return (Garp.getAnimationProperty = n(t[i]), t[i]);return null;
}, Garp.getTransitionEndEvent = function () {
  var e = { transition: "transitionEnd", OTransition: "oTransitionEnd", MSTransition: "msTransitionEnd", MozTransition: "transitionend", WebkitTransition: "webkitTransitionEnd" },
      t = Garp.getTransitionProperty(),
      n = function n(e) {
    return function () {
      return e;
    };
  };return t && t in e ? (Garp.getTransitionEndEvent = n(e[t]), e[t]) : null;
}, "undefined" == typeof Garp)) var Garp = {};if ((Garp.Cookie = {}, Garp.Cookie.get = function (e) {
  for (var t = e + "=", n = document.cookie.split(";"), i = 0, o = n.length; o > i; ++i) {
    for (var r = n[i]; " " == r.charAt(0);) r = r.substring(1, r.length);if (0 === r.indexOf(t)) return r.substring(t.length, r.length);
  }return null;
}, Garp.Cookie.set = function (e, t, n) {
  t = escape(t) + "; path=/", t += n ? "; expires=" + n.toGMTString() : "", document.cookie = e + "=" + t;
}, Garp.Cookie.remove = function (e) {
  Garp.setCookie(e, "", new Date("1900"));
}, "undefined" == typeof Garp)) var Garp = {};Garp.FlashMessage = function (e, t) {
  var n,
      i,
      o = -1 !== t,
      r = document.documentElement,
      a = document.getElementsByTagName("body")[0],
      s = "flash-message-active",
      c = "flash-message-inactive";t = t || 5, o && (t *= 1000), "function" != typeof e.push && (e = [e]);var u = function u() {
    n && (n.parentNode.removeChild(n), n = null, r.className = r.className.replace(c, ""));
  },
      l = function l(e) {
    for (var t = e ? Garp.transitionEndEvents : Garp.animationEndEvents, i = 0, o = t.length; o > i; ++i) n.addEventListener(t[i], u, !1);
  },
      d = function d() {
    if ((clearInterval(i), n)) {
      var e = Garp.getStyle(n, Garp.getTransitionProperty()),
          t = Garp.getStyle(n, Garp.getAnimationProperty());(e || t) && l(e), r.className = r.className.replace(s, c), e || t || u();
    }
  },
      h = function h() {
    n = document.createElement("div"), n.setAttribute("id", "flash-message"), n.className = "flash-message";for (var c = "", u = 0, l = e.length; l > u; ++u) c += "<p>" + e[u] + "</p>";n.innerHTML = c, a.appendChild(n), setTimeout(function () {
      r.className += " " + s;
    }, 0), n.onclick = d, o && (i = setTimeout(d, t));
  };return (this.show = h, this.hide = d, this);
}, Garp.FlashMessage.parseCookie = function () {
  if ("undefined" == typeof JSON || "function" != typeof JSON.parse) return "";var e = "FlashMessenger",
      t = JSON.parse(unescape(Garp.Cookie.get(e))),
      n = [];if (!t || !t.messages) return "";for (var i in t.messages) {
    var o = t.messages[i];o && n.push(o.replace(/\+/g, " "));
  }var r = new Date();return (r.setHours(r.getHours() - 1), Garp.Cookie.set(e, "", r, "undefined" != typeof COOKIEDOMAIN ? COOKIEDOMAIN : document.location.host), n);
};var app = app || {};app.responsive = (function () {
  var e,
      t = function t() {
    e = document.documentElement.clientWidth;
  };return (window.addEventListener("resize", t), window.addEventListener("orientationchange", t), { BREAKPOINT_SMALL: 680, BREAKPOINT_MEDIUM: 960, BREAKPOINT_LARGE: 1200, getDocWidth: function getDocWidth() {
      return (e || (e = document.documentElement.clientWidth), e);
    }, getCurrentBreakpoint: function getCurrentBreakpoint() {
      var e = ["small", "medium", "large"],
          t = 0,
          n = "small";do n = e[t]; while (this.matchesBreakpoint(e[++t]));return n;
    }, matchesBreakpoint: function matchesBreakpoint(e) {
      switch (e) {case "small":
          return this.getDocWidth() >= this.BREAKPOINT_SMALL;case "medium":
          return this.getDocWidth() >= this.BREAKPOINT_MEDIUM;case "large":
          return this.getDocWidth() >= this.BREAKPOINT_LARGE;}
    } });
})();var app = app || {};app.init = function () {}, FastClick.attach(document.body), disableHoverStylesOnScroll();var cookie_msg = Garp.FlashMessage.parseCookie();if (cookie_msg) {
  var fm = new Garp.FlashMessage(cookie_msg);fm.show();
}