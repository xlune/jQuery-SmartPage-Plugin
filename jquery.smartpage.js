/**
 * jQuery SmartPage v0.1.0 - page smart change plugin
 *
 * Terms of Use - jQuery SmartPage
 * under the MIT (http://www.opensource.org/licenses/mit-license.php) License.
 *
 * Copyright 2011 xlune.com All rights reserved.
 * (http://blog.xlune.com/2011/05/jquerysmartpage.html)
 *
 * // A boilerplate for kick-starting jQuery plugins development
 * // version 1.2, April 29th, 2011
 * // by Stefan Gabos
 * // with help from Steven Black, Rob Lifford
 */
(function($) {
	$.fn.smartPage = function(method) {
		var defaultOptions = {
			endPoint: location.protocol + "//" + location.hostname + "/",
			fixedEndPoint: false,
			fragment: '#!',
			useFade: false,
			useCSSFade: false,
			useScrollTop: false,
			useHash: false,
			useHistoryState: false,
			useIE9: false,
			useFragmentClear: true,
			onStart: null,
			onChange: null,
			onComplete: null,
			onScriptComplete: null,
			onError: null,
			pageRules: [],
			baseList: [],
			insertList: [],
			scriptDelay: 100
		};
		var privateDefaults = {
			isInit_: false,
			state_: null,
			hash_: null,
			hashTimer_: null,
			deferred_: null,
			task_: []
		};
		var statics = {
			CANCEL: "cancel"
		};
		var settings = {};
		var methods = {
			init: function(options) {
				var self = this;
				settings = $.extend({}, defaultOptions, options, privateDefaults);
				if (helpers.isNotIE() || (settings.useIE9 && helpers.getIEVersion() >= 9)) {
					if (typeof(history.pushState) !== 'function') {
						settings.useHistoryState = false;
					}
					if (settings.fixedEndPoint
							&& settings.useHash
							&& !settings.useHistoryState
							&& helpers.checkPath(helpers.getUrl())) {
						var path = helpers.getPathName(helpers.getUrl());
						var base = helpers.getUrl().replace(/#.*$/gi, "");
						if (base !== settings.endPoint) {
							location.replace(settings.endPoint + settings.fragment + path);
						}
					}
					if(settings.useHash || settings.useHistoryState){
						if (settings.useHistoryState) {
							settings.state_ = location.href;
							helpers.setStateChangeEvent();
							if(settings.useFragmentClear) helpers.replaceClearHash();
						} else {
							if(!settings.fragment.match(/^#/)){
								settings.fragment = "#" + settings.fragment;
							}
							helpers.setHashChangeEvent();
							helpers.hashChangeHandler();
						}
						$(function(){
							helpers.setClickEvents(self);
						});
					}
				}else{
					if(settings.useFragmentClear) helpers.replaceClearHash();
				}
				return self.each(function() {
					var $element = $(self), element = self;
				});
			},
			getUrl: function(){
				if(settings.useHistoryState){
					return [
						location.protocol,
						"//",
						location.hostname,
						location.pathname,
						encodeURI(location.search).replace(/'/g, "%27"),
						encodeURI(location.hash).replace(/'/g, "%27")
					].join("");
				}else{
					var r = new RegExp(settings.fragment + '/?');
					return (helpers.getBasePoint() + settings.hash_).replace(r, "");
				}
			}
		};
		var helpers = {
			setClickEvents: function(root){
				$(root).find("a, area").live("click", helpers.clickHandler);
			},
			clickHandler: function(e){
				var path = $(e.target).attr("href");
				if(path){
					path = helpers.getFullPath(path);
					if(helpers.checkPath(path)){
						if(settings.useHistoryState){
							if(path !== settings.state_){
								history.pushState({}, helpers.getTitle(), path);
								helpers.load(path);
							}
						}else{
							path = helpers.getPathName(path);
							location.hash = settings.fragment + path;
						}
						e.preventDefault();
						return false;
					};
				}
				return true;
			},
			getTitle: function(){
				return document.title;
			},
			getUrl: function(){
				return helpers.escapeHtmlSpecialCharacters(location.href);
			},
			getFullPath: function(path){
				var base = helpers.getUrl().replace(/[#?].*$/gi, "").replace(/\/[^\/]*$/, "/");
				switch(true){
					case /^https?:\/\//.test(path):
						break;
					case /^\//.test(path):
						path = location.protocol + "//" + location.hostname + path;
						break;
					default:
						while(true){
							if(/^.\//.test(path)){
								path = path.replace(/^.\//, "");
							}else if(/^..\//.test(path)){
								path = path.replace(/^..\//, "");
								if(base.match(/\//g).length > 3){
									base = base.replace(/[^\/]*\/$/, "");
								}
							}else{
								path = base + path;
								break;
							}
						}
				}
				return path;
			},
			checkPath: function(fullPath){
				if(settings.pageRules instanceof Array){
					var i, arr = settings.pageRules.concat();
					if(!arr.length){
						var base = helpers.escapeRegExpSpecialCharacters(settings.endPoint);
						arr.push(new RegExp('^'+base, "i"));
					}
					for(i in arr){
						if(!(arr[i][0] instanceof RegExp && arr[i][0].test(fullPath) === arr[i][1])){
							return false;
						}
					}
					return true;
				}
				return false;
			},
			getPathName: function(fullPath){
				return fullPath.replace(helpers.getBasePoint(), "");
			},
			getHashKey: function(){
				var hash = location.hash;
				var r = new RegExp('^' + settings.fragment);
				return hash.replace(r, "");
			},
			getBasePoint: function(){
				return settings.endPoint.replace(/\/$/, "");
			},
			isNotIE: function(){
				return /*@cc_on!@*/true;
			},
			getIEVersion: function(){
				var v = 3;
				var d = document.createElement('div');
				var i = d.getElementsByTagName('i');
				while (
					d.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
					i[0]
				){};
				return v > 4 ? v : null ;
			},
			replaceClearHash: function(){
				var r = new RegExp(settings.fragment+"/?", "g");
				if(r.test(location.href)){
					if(settings.useHistoryState){
						var path = location.href.replace(r, "");
						history.replaceState({}, null, path);
						helpers.load(path);
					}else{
						location.replace(location.href.replace(r, ""));
					}
				};
			},
			load: function(url) {
				settings.state_ = url;
				settings.isInit_ = true;
				if(settings.deferred_){
					settings.deferred_.abort(statics.CANCEL);
				}
				if(typeof(settings.onStart) === "function"){
					settings.onStart();
				}
				settings.deferred_ = $.get(url).then(
					helpers.loadComplete,
					helpers.loadError
				);
			},
			loadCompleteTask: function(){
				if(settings.task_.length > 0){
					var task = settings.task_.shift();
					task();
				}else{
					if(typeof(settings.onScriptComplete) === "function"){
						settings.onScriptComplete();
					}
				}
			},
			loadCompleteChange: function(){
				if(typeof(settings.onChange) === "function"){
					settings.onChange();
				}
			},
			loadCompleteFinish: function(){
				if(typeof(settings.onComplete) === "function"){
					settings.onComplete();
				}
				helpers.loadCompleteTask();
				if(settings.useScrollTop){
					helpers.scrollTop();
				}
			},
			loadError: function(data, textStatus, jqXHR){
				if(textStatus !== statics.CANCEL){
					$.error("page load error");
					if(typeof(settings.onError) === "function"){
						settings.onError();
					}
				}
			},
			loadComplete: function(data, textStatus, jqXHR){
				var i, imax, j, jmax, f, t, s;
				var fromList = settings.baseList;
				var toList = settings.insertList;
				var rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
				var boxKey = "smartpage-script";
				var boxStyle = [
					"position: static !important;",
					"border:none !important;",
					"margin:0 !important;",
					"padding:0 !important;",
					"background:none !important;"
				].join(" ");
				var matches = data.match(rscript);
				var counter = (function(count){
					return function(match){
						return '<!--%%' + boxKey + (count++).toString() + '%%-->';
					};
				})(0);
				var defWrite = document.write;
				var defWriteln = document.writeln;
				settings.task_ = [];
				var dom = $("<div />").append(data.replace(rscript, counter));
				if(fromList instanceof Array){
					for (i = 0, imax = Math.min(fromList.length, toList.length); i < imax; i++) {
						f = $(fromList[i]);
						if(toList[i]){
							var tt = dom.find(toList[i]);
							tt.each(function(num){
								var ff, attr;
								if(!!(ff = $(f.get(num)))){
									for(attr in this.attributes){
										ff.attr(
											this.attributes[attr].nodeName,
											this.attributes[attr].nodeValue
										);
									}
								}
							});
							t = tt.html();
						}else{
							t = data;
						}
						for (j = 0, jmax = matches.length; j < jmax; j++) {
							if (t.match('<!--%%' + boxKey + j + '%%-->')) {
								t = t.replace('<!--%%' + boxKey + j + '%%-->', '<div id="' + boxKey + j.toString() + '" style="' + boxStyle + '"> </div>');
								settings.task_.push((function(id, num, script){
									return function(){
										var box = $("#" + id);
										if (box.size() > 0) {
											var timer, time = settings.scriptDelay;
											var s = $(script), src, el, loading = false;
											var comp = function(){
												if (!loading) {
													document.write = defWrite;
													document.writeln = defWriteln;
													helpers.loadCompleteTask();
												}
											};
											var loaded = function(e){
												if (loading) {
													loading = false;
													clearTimeout(timer);
													timer = setTimeout(comp, time);
												}
											};
											document.write = function(str){
												box.get(0).innerHTML += str;
												clearTimeout(timer);
												timer = setTimeout(comp, time);
											};
											document.writeln = function(str){
												str = str + "\r\n";
												box.get(0).innerHTML += str;
												clearTimeout(timer);
												timer = setTimeout(comp, time);
											};
											if (!!(src = s.attr("src"))) {
												loading = true;
												el = document.createElement("script");
												el.src = src;
												el.onload = loaded;
												el.onreadystatechange = function(){
													if (this.readyState == "loaded" || this.readyState == "complete") {
														loaded();
													}
												};
												box.get(0).appendChild(el);
											}
											else {
												clearTimeout(timer);
												timer = setTimeout(comp, time);
												box.html(s);
											}
										}
										else {
											helpers.loadCompleteTask();
										}
									};
								})(boxKey + j.toString(), j, matches[j]));
							}
						}
						helpers.setFadeAction(f, t, i);
					}
				}
			},
			setCSSFade: function(obj, op, time){
				op = isNaN(op) ? 0 : op ;
				time = isNaN(time) ? 0 : time ;
				obj.css({
					"-webkit-transition-property": "opacity",
					"-webkit-transition-duration": time.toString() + "s",
					"-webkit-transition-timing-function": "ease-out",
					"-moz-transition-property": "opacity",
					"-moz-transition-duration": time.toString() + "s",
					"-moz-transition-timing-function": "ease-out",
					"transition-property": "opacity",
					"transition-duration": time.toString() + "s",
					"transition-timing-function": "ease-out",
					"opacity": op
				});
			},
			setFadeAction: function(f, t, i){
				var useCSS = settings.useCSSFade
					&& (typeof($("html").css("-webkit-transition-property")) !== 'undefined'
					|| typeof($("html").css("-moz-transition-property")) !== 'undefined'
					|| typeof($("html").css("transition-property")) !== 'undefined');
				if(useCSS){
					clearTimeout(f.data("smartpage-timer"));
					helpers.setCSSFade(f, 0, 0.3);
					f.data("smartpage-timer", setTimeout((function(f, t, i){
						return function(){
							f.html(t);
							if (i == 0) {
								helpers.loadCompleteChange();
							}
							clearTimeout(f.data("smartpage-timer"));
							helpers.setCSSFade(f, 1, 0.3);
							f.data("smartpage-timer", setTimeout((function(f, t, i){
								return function(){
									if (i == 0) {
										helpers.loadCompleteFinish();
									}
								};
							})(f, t, i), 300));
						};
					})(f, t, i), 300));
				}else{
					f.stop().fadeTo((settings.useFade?300:1), 0.01, (function(f, t, i){
						return function(){
							f.html(t);
							if (i == 0) {
								helpers.loadCompleteChange();
							}
						};
					})(f, t, i)).fadeTo((settings.useFade?300:1), 1, (function(i){
						return function(){
							if (i == 0) {
								helpers.loadCompleteFinish();
							}
						};
					})(i));
				}
			},
			scrollTop: function(){
				var w = $(window);
				$("head").stop().css({
					position: "fixed",
					top: w.scrollTop() + "px"
				}).animate({top: 0}, {duration: 500, easing: "linear", step: function(num){
					w.scrollTop(num);
				}});
			},
			setStateChangeEvent : function(){
				$(window).unbind("popstate", helpers.stateChangeHandler);
				$(window).bind("popstate", helpers.stateChangeHandler);
			},
			stateChangeHandler: function(e){
				if(settings.isInit_){
					helpers.load(location.href);
				}
				settings.isInit_ = true;
			},
			setHashChangeEvent: function(){
				if("onhashchange" in window){
					$(window).unbind("hashchange", helpers.hashChangeHandler);
					$(window).bind("hashchange", helpers.hashChangeHandler);
				}else{
					clearInterval(settings.hashTimer_);
					settings.hashTimer_ = setInterval((function(self){
						return function(){
							helpers.hashChangeHandler.apply(self);
						};
					})(this), 500);
				}
			},
			hashChangeHandler: function(e){
				var h;
				if(settings.hash_ !== (h = helpers.getHashKey())){
					settings.hash_ = h;
					if (settings.isInit_) {
						helpers.load(helpers.getBasePoint() + h);
					}
					settings.isInit_ = true;
				}
			},
			escapeRegExpSpecialCharacters: function(str){
				return str.replace(/(\\|\/|\^|\$|\*|\+|\?|\{|\||\}|\[|\])/g, "\\$1");
			},
			escapeHtmlSpecialCharacters: function(str){
				var i, imax, list = [
					[/&/g, '&amp;'],
					[/</g, '&lt;'],
					[/>/g, '&gt;'],
					[/"/g, '&quot;'],
					[/'/g, '&#039;']
				];
				for (i=0,imax=list.length; i<imax; i++) {
					str = str.replace(list[i][0], list[i][1]);
				}
				return str;
			},
			delay: function(time){
				time = isNaN(time) ? 0 : time ;
				return $.Deferred(function(dfd){
					setTimeout(dfd.resolve, time*1000);
				}).promise();
			}
		};
		if(methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error( 'Method "' +  method + '" does not exist in smartPage plugin!');
		}
	};
})(jQuery);
