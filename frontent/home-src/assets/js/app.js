define(['jquery'], function($){
	var app = {
		alert : function(message, level, callback){
			alert(message);
			
			if(typeof(callback) == 'string'){
				location.href = callback;
			}else if(typeof(callback) == 'function'){
				callback();
			}
		},
		
		ajax : function(aOption){			
			var aUsingOption = $.extend({
				type : 'post',
				complete : function(oXhr){
					if((oXhr.status >= 300 && oXhr.status < 400) && oXhr.status != 304){
						var redirectUrl = oXhr.getResponseHeader('X-Redirect');
						if(oXhr.responseText.length){
							alert(oXhr.responseText);
							location.href = redirectUrl;
						}else{
							location.href = redirectUrl;
						}
					}
					aOption.complete && aOption.complete(oXhr);
				},
				error : function(oXhr){
					if((oXhr.status >= 300 && oXhr.status < 400) && oXhr.status != 304){
						alert(oXhr.responseText);
					}
				}
			}, aOption);
			
			return $.ajax(aUsingOption);
		},
		
		cookie : function(name, value, options) {
			if (typeof value != 'undefined') { // name and value given, set cookie
				options = options || {};
				if (value === null) {
					value = '';
					options.expires = -1;
				}
				var expires = '';
				if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
					var date;
					if (typeof options.expires == 'number') {
						date = new Date();
						date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
					} else {
						date = options.expires;
					}
					expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
				}
				// CAUTION: Needed to parenthesize options.path and options.domain
				// in the following expressions, otherwise they evaluate to undefined
				// in the packed version for some reason...
				var path = options.path ? '; path=' + (options.path) : '';
				var domain = options.domain ? '; domain=' + (options.domain) : '';
				var secure = options.secure ? '; secure' : '';
				document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
			} else { // only name given, get cookie
				var cookieValue = null;
				if (document.cookie && document.cookie != '') {
					var cookies = document.cookie.split(';');
					for (var i = 0; i < cookies.length; i++) {
						var cookie = jQuery.trim(cookies[i]);
						// Does this cookie string begin with the name we want?
						if (cookie.substring(0, name.length + 1) == (name + '=')) {
							cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
							break;
						}
					}
				}
				return cookieValue;
			}
		},
		
		//装载URL参数
		loadParam : function(rule){
			var pathinfo = location.pathname.substr(1);
			if(pathinfo.substr(-4) == '.htm'){
				pathinfo += 'l';
			}
			if(rule == pathinfo || rule + 'l' == pathinfo){
				return {};
			}
			//console.log('pathinfo', pathinfo);
			var matchResults = rule.match(new RegExp('<\\w+:.+?>', 'g'));
			var aParamNames = [];
			if(!matchResults){
				return null;
			}

			matchResults.map(function(item){
				var pattern = item.replace(/<\w+:/, '(');
				var paramNameMatchResult = item.match(/<(\w+)/);
				aParamNames.push(paramNameMatchResult[1]);
				pattern = pattern.replace('>', ')');
				//console.log('pattern', pattern);
				rule = rule.replace(item, pattern);
			});

			//console.log('RegExp', eRule);
			var aParamVaules = pathinfo.match(new RegExp(rule));
			//console.log('matched', paramVaules);
			if(!aParamVaules){
				$.error('App.loadParam 加载请求参数失败');
				return null;
			}
			var aParams = {};
			for(var i = 1; i < aParamVaules.length; i++){
				aParams[aParamNames[i - 1]] = aParamVaules[i];
			}
			app.aParams = $.extend(app.aParams, aParams);
			return aParams;
		},
		
		aParams : {},
		
		init : function(){
			var url = window.location.href;
			var aParams = null;
			if(url.indexOf('?') != -1){
				aParams = {};
				var paramsStr = url.split('?')[1],
					aParamsArr = paramsStr.split('&'),
					aParamsPropertyArr = [];
				for(var j in aParamsArr){
					aParamsPropertyArr = aParamsArr[j].split('=');
					var key = aParamsPropertyArr[0],
						value = aParamsPropertyArr[1];
					aParams[key] = value;
				}
			}
			aParams && (this.aParams = aParams);
		},
		
		showHeadBar : function(){
			var aUserInfo = sessionStorage.getItem('userInfo');
			if(aUserInfo){
				aUserInfo = JSON.parse(aUserInfo);
			}else{
				this.ajax({
					url : '/worker/headbar.json',
					async : false,
					success : function(aResult){
						if(aResult.code){
							app.alert(aResult.message, aResult.code, aResult.data);
							return;
						}
						aUserInfo = aResult.data;
						sessionStorage.setItem('userInfo', JSON.stringify(aResult.data));
					}
				});
			}
			
			$('#mainOut').before('<header class="container-full">\
				<div class="left"><a href="/home.html">首页</a></div>\
				<div class="right">\
					<span class="newMessageTip" id="newMessageTip"></span>\
					<span class="glyphicon glyphicon-envelope" id="icoMessage"></span>\
					<a href="/worker/center.html">' + aUserInfo.name + '</a>&nbsp;\
					<a href="/worker/logout.do">退出登陆</a>\
				</div>\
			</header>');
			
			
			this.ajax({
				url : '/system/check-notice.do',
				success : function(aResult){
					if(aResult.data === true){
						$('#newMessageTip').css({display : 'inline-block'});
					}
				}
			});
		},
		
		util : {
			isEmptyObject : function(obj) {
				for (var key in obj){
					return false;  
				}
				return true;
			}  
		}
	};
	app.init();
	return app;
});