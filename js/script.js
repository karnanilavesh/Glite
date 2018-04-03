window.onload = function(){
	var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9+/=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/rn/g,"n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}
	$('[data-toggle="tooltip"]').tooltip(); 
	var th = $("#test").height();
	var tw = $("#test").width();
	var obj = new Object();
	$("#test").hide();
	function init(){
		var h = $("#htmltitle").offset().top;
		var h1 = th-h;
		htmleditor.setSize("100%",h1);
		csseditor.setSize("100%",h1);
		jseditor.setSize("100%",h1);
		$("#result1").height(h1);
		$("#result2").height(th);
		$.post("/import/",{mode:"project"}, function(result){
			if ( result === "nop" ){
				return;			
			} 
			obj = jQuery.parseJSON( result );
			htmleditor.setValue(Base64.decode(obj.Html));
			csseditor.setValue(Base64.decode(obj.Css));
			jseditor.setValue(Base64.decode(obj.Js));
		});
	}
	var withbox = false;
	var arr = [true,true,true,true];
	var editorarr = ["htmleditor","csseditor","jseditor","resouter"];
	var currentold = [3,0];
	var theme=["default","ambiance","the-matrix","neat"];
	var sizeclass = ["col-sm-","col-md-","col-lg-"];
	function resize(){
		var i,j;
		for(i=0;i<4;i++)
			for(j=0;j<3;j++){
				if(i != 3 || withbox){
					$("#"+editorarr[i]).removeClass(sizeclass[j]+Math.round((12/currentold[1])).toString());
					$("#"+editorarr[i]).addClass(sizeclass[j]+Math.round((12/currentold[0])).toString());
				}
			}		
	}
	function handle( i){
		arr[i] = !arr[i];
		if(i != 3 || withbox){
			if(!arr[i]) {
				$("#"+editorarr[i]).hide();
				currentold[1] = currentold[0];
				currentold[0]--;
			} else {
				$("#"+editorarr[i]).show();
				currentold[1] = currentold[0];
        		        currentold[0]++;
			}
			resize();
		}else{
			if(!arr[i])
				$("#res2outer").hide();
			else
				$("#res2outer").show();	
			init();		
		}
	}	
	$("#htmlbtn").on('click', function() {
        	handle(0);
     	});
	$("#cssbtn").on('click',function() {
                handle(1);
        });
	$("#jsbtn").on('click', function() {
                handle(2);
        });
	$("#outputbtn").on('click', function() {
                handle(3);
        });
	$("#changeres2").on('click', function() {
		withbox = true;
		currentold[1] = currentold[0];
		currentold[0]++;
		$("#resouter").show();	
		$("#res2outer").hide()
		resize();
	});
	$("#changeres1").on('click', function() {
		withbox = false;
		currentold[1] = currentold[0];
		currentold[0]--;
		$("#resouter").hide();	
		$("#res2outer").show()
		resize();
	});
	function completeAfter(cm, pred) {
        	var cur = cm.getCursor();
        	if (!pred || pred()) setTimeout(function() {
          		if (!cm.state.completionActive)
            			cm.showHint({completeSingle: false});
        		}, 100);
        	return CodeMirror.Pass;
      	}
	function completeIfAfterLt(cm) {
	        return completeAfter(cm, function() {
	        	var cur = cm.getCursor();
          		return cm.getRange(CodeMirror.Pos(cur.line, cur.ch - 1), cur) == "<";
        	});
      	}
	var htmleditor = CodeMirror.fromTextArea(document.getElementById("htmlcode"), {
		lineNumbers: true,
		extraKeys: {"'<'": completeAfter,
          "'/'": completeIfAfterLt,"Ctrl-Space": "autocomplete","Alt-F": "findPersistent","F11": function(cm) {
			cm.setOption("fullScreen", !cm.getOption("fullScreen"));
		},"Esc": function(cm) {
			if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
		}},
		matchBrackets: true,
		mode: "htmlmixed"
  	});
	var csseditor = CodeMirror.fromTextArea(document.getElementById("csscode"), {
    		lineNumbers: true,
		extraKeys: {"Ctrl-Space": "autocomplete","Alt-F": "findPersistent","F11": function(cm) {
			cm.setOption("fullScreen", !cm.getOption("fullScreen"));
		},"Esc": function(cm) {
			if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
		}},
		matchBrackets: true,		
		mode: "css"
		});
	var jseditor = CodeMirror.fromTextArea(document.getElementById("jscode"), {
		lineNumbers: true,
		extraKeys: {"Ctrl-Space": "autocomplete","Alt-F": "findPersistent","F11": function(cm) {
			cm.setOption("fullScreen", !cm.getOption("fullScreen"));
		},"Esc": function(cm) {
			if (cm.getOption("fullScreen")) cm.setOption("fullScreen", false);
		}},
		matchBrackets: true,
		mode: {name: "javascript", globalVars: true}
	});
	$("#result").on('click',function(event){
		htmleditor.save();
		csseditor.save();
		jseditor.save();
		var html = document.getElementById("htmlcode").value;
		var css = document.getElementById("csscode").value;
		var js = document.getElementById("jscode").value;
		var result = html + "<style>" + css +"</style>"+"<script>"+js+"</script>";
		var data_url = "data:text/html;charset=utf-8;base64," + Base64.encode(result);
		if(withbox)
        		document.getElementById("result1").src = data_url;
		else
			document.getElementById("result2").src = data_url;
		var hash = "#result2"
		$('html, body').animate({
			scrollTop: $(hash).offset().top
		}, 900, function(){
			window.location.hash = hash;
 		});
	});
	$("#settingsicon").on("click",function(){
		$("#popupbg").show();
		$("#popup").show();	
		setpopelt();
	});
	$("#setbtndone").on("click",function(){
		$("#popup").hide();
		$("#popupbg").hide();	
	});
	$("#select").change(function () {
		var str = "";
		$( "select option:selected" ).each(function() {
			str += $( this ).text() + " ";
		});
		setTheme(str);
	});
	$('#cbLineNum').change(function() {
		if($(this).is(":checked")) {
			setLinenum(true)
      			return;
		}
		setLinenum(false)
	});
	$('#cbMatchBrackets').change(function() {
		if($(this).is(":checked")) {
			setMatchBrackets(true)
      			return;
		}
		setMatchBrackets(false)
	});
  	function setTheme(a){
		htmleditor.setOption("theme", a);
		csseditor.setOption("theme", a);
		jseditor.setOption("theme", a);	
	}
	function setMatchBrackets(a){
		htmleditor.setOption("matchBrackets", a);
		csseditor.setOption("matchBrackets", a);
		jseditor.setOption("matchBrackets", a);	
		/*if(false){
			htmleditor.setOption("mode", null);
			csseditor.setOption("mode", null);
			jseditor.setOption("mode", null);
		}else{
			htmleditor.setOption("mode", "htmlmixed");
			csseditor.setOption("mode", "css");
			jseditor.setOption("mode", {name: "javascript", globalVars: true});
		}*/
		htmleditor.refresh();
		csseditor.refresh();
		jseditor.refresh();
	}
	function setLinenum(a){
		htmleditor.setOption("lineNumbers", a);
		csseditor.setOption("lineNumbers", a);
		jseditor.setOption("lineNumbers", a);	
		htmleditor.refresh();
		csseditor.refresh();
		jseditor.refresh();
	}
	function setpopelt(){
		var h = $("#popup").height();
		var w = $("#popup").width();
		$("#popup").css('top',th/2-h/2-20);
		$("#popup").css('left',tw/2-w/2-20);
	}
	function savepopelt(){
		var h = $("#savepopup").height();
		var w = $("#savepopup").width();
		$("#savepopup").css('top',th/2-h/2-20);
		$("#savepopup").css('left',tw/2-w/2-20);
	}
	function ftpopelt(){
		$("#ftdiv").css('height',th/2+10);
		$("#ftdiv1").css('height',th/4-10);
		var h = $("#ftdiv").height();
		var w = $("#ftdiv").width();
		$("#ftdiv").css('top',th/2-h/2-20);
		$("#ftdiv").css('left',tw/2-w/2-20);	
	}	
	setTheme("default");
	$("#saveicon").on("click", function(){
		if (obj.Path == undefined){
			notify("create a new project");
			$("#savepopup").show();
			$("#popupbg").show();	
		savepopelt();	
		} else {
			send(htmleditor.getValue("\n"), csseditor.getValue("\n"), jseditor.getValue("\n"),Base64.decode(obj.Name));
		}
	});
	openpath=""
	$("#importicon").on("click", function(){
		$("#popupbg").show();
		$("#ftdiv").show();
		savepopelt();
		$('#ftdiv1').fileTree({ root: '/', script: 'filetree/' }, function(file) { 
					openpath=file+"/";
		});
		ftpopelt();
	});
	$("#btnopen").on("click",function(){
		open(openpath);
		$("#ftdiv").hide();
		$("#popupbg").hide();
	});
	$("#btnsave").on("click",function(){
		var name= $("#name").val();		
		send(htmleditor.getValue("\n"), csseditor.getValue("\n"), jseditor.getValue("\n"),name);
		$("#savepopup").hide();
		$("#popupbg").hide();
	});
	$(".close").on("click",function(){
		$("#savepopup").hide();
		$("#ftdiv").hide();
		$("#popup").hide();
		$("#popupbg").hide();
	});
	function open(pathval) {
		$.post("/import/",{path:pathval}, function(result){
			if ( result === "not project" ){
				alert("not imported")			
			} 
			obj = jQuery.parseJSON( result );
			htmleditor.setValue(Base64.decode(obj.Html));
			csseditor.setValue(Base64.decode(obj.Css));
			jseditor.setValue(Base64.decode(obj.Js));
		});	
	}
	//save start
	function send(a,b,c,d){
			//check if path is undefined
			$.post('/saveProject/', { html:a, css:b, js:c, name:d }, function(result) {
    				if (result == "saved"){
					notify("saved");			
				} else {
					notify("not saved");				
				}
			});
	}
	//save end
	function notify(s){
		$("#notificationArea").html(s);
		$('#notification').slideDown(300).delay(3000).slideUp(300);
	}
	shortcut.add("Ctrl+S", function() {
		$("#saveicon").trigger("click");
	});
	shortcut.add("Ctrl+C", function() {
		$("#result").trigger("click");
	});
	var str = "";
	$( "select option:selected" ).each(function() {
		str += $( this ).text() + " ";
	});
	setTheme(str);
	init();	
}
