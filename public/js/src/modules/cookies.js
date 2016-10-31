/**
 * Garp cookie helper utilities
 */
var Garp = Garp || {};

Garp.Cookie = {};

/**
 * Grab a Cookie
 * @param {Object} name
 */
Garp.Cookie.get = function(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0, cal = ca.length; i < cal; ++i) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length);
    }
        if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
    }
    return null;
};

/**
 * Set a cookie
 * @param {Object} name
 * @param {Object} value
 * @param {Date} expiration date
 * @param {String} domain
 */
Garp.Cookie.set = function(name, value, date, domain) {
  value = escape(value) + "; path=/";
  if (domain) {
    value += '; domain=' + escape(domain);
  }
  value += (!date ? "" : "; expires=" + date.toGMTString());
  document.cookie = name + "=" + value;
};

Garp.Cookie.remove = function(name) {
  Garp.setCookie(name, '', new Date('1900'));
};

module.exports = Garp.Cookie;
