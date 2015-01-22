!function(){"AuthFacebook"in Garp.dataTypes&&Garp.dataTypes.AuthFacebook.on("init",function(){})}(),function(){"AuthLinkedin"in Garp.dataTypes&&Garp.dataTypes.AuthLinkedin.on("init",function(){})}(),function(){"AuthLocal"in Garp.dataTypes&&Garp.dataTypes.AuthLocal.on("init",function(){})}(),function(){"AuthPasswordless"in Garp.dataTypes&&Garp.dataTypes.AuthPasswordless.on("init",function(){})}(),function(){"AuthTwitter"in Garp.dataTypes&&Garp.dataTypes.AuthTwitter.on("init",function(){})}(),function(){"Chapter"in Garp.dataTypes&&Garp.dataTypes.Chapter.on("init",function(){})}(),function(){"ClusterClearCacheJob"in Garp.dataTypes&&Garp.dataTypes.ClusterClearCacheJob.on("init",function(){})}(),function(){"ClusterRecurringJob"in Garp.dataTypes&&Garp.dataTypes.ClusterRecurringJob.on("init",function(){})}(),function(){"ClusterServer"in Garp.dataTypes&&Garp.dataTypes.ClusterServer.on("init",function(){})}(),function(){"Document"in Garp.dataTypes&&Garp.dataTypes.Document.on("init",function(){})}(),Ext.ns("Garp.dataTypes"),function(){"Image"in Garp.dataTypes&&Garp.dataTypes.Image.on("init",function(){this.iconCls="icon-img",this.insertColumn(0,{header:'<span class="hidden">'+__("Image")+"</span>",dataIndex:"id",width:84,fixed:!0,renderer:Garp.renderers.imageRelationRenderer,hidden:!1}),this.addListener("loaddata",function(e,t){function i(){if(e.get("filename")&&(t.preview.update(Garp.renderers.imagePreviewRenderer(e.get("filename"),null,e)),t.download.update({filename:e.get("filename")})),"function"==typeof t.center){var i=new Image;i.onload=function(){t&&t.el&&t.el.dom&&(t.setHeight(440),t.center())},i.src=t.preview.getEl().child("img")?t.preview.getEl().child("img").dom.src:""}}t.rendered?i():t.on("show",i,null,{single:!0})},!0),this.removeField("filename"),this.removeField("id");var e=this.getField("filename_info");e?this.removeField("filename_info"):e={xtype:"box",cls:"garp-notification-boxcomponent",name:"filename_info",html:__("Only {1} and {2} files with a maximum of {3} MB are accepted","jpg, png","gif","20"),fieldLabel:" "},this.insertField(0,{xtype:"fieldset",style:"margin: 0;padding:0;",items:[{name:"id",hideFieldLabel:!0,disabled:!0,xtype:"numberfield",hidden:!0,ref:"../../../../_id"},{name:"filename",fieldLabel:__("Filename"),xtype:"uploadfield",allowBlank:!1,emptyText:__("Drag image here, or click browse button"),uploadURL:BASE+"g/content/upload/type/image",ref:"../../../../filename",listeners:{change:function(e,t){if(this.refOwner._id.getValue()){var i=BASE+"admin?"+Ext.urlEncode({model:Garp.currentModel,id:this.refOwner._id.getValue()});DEBUG&&(i+="#DEBUG"),this.refOwner.formcontent.on("loaddata",function(){var e=new Ext.LoadMask(Ext.getBody());e.show(),document.location.href=i}),this.refOwner.fireEvent("save-all")}else this.refOwner.preview.update(Garp.renderers.uploadedImagePreviewRenderer(t)),this.refOwner.get(0).get(0).fireEvent("loaddata",this.refOwner.rec,this.refOwner),this.refOwner.download.update({filename:t});return!0}}},e,{xtype:"box",ref:"../../../../preview",fieldLabel:__("Preview"),cls:"preview",html:""},{xtype:"box",hidden:!1,ref:"../../../../download",fieldLabel:" ",hideFieldLabel:!1,tpl:new Ext.XTemplate('<tpl if="filename">','<a href="'+IMAGES_CDN+'{filename}" target="_blank">'+__("View original file")+"</a>","</tpl>")}]}),this.Wysiwyg=Ext.extend(Garp.WysiwygAbstract,{model:"Image",idProperty:"id",settingsMenu:!0,margin:0,getData:function(){return{id:this._data.id,caption:this._data.caption}},filterHtml:function(){return!0},setCaption:function(e){this._data.caption=e,this.el.child(".caption").update(e),this.el.child(".caption").setDisplayed(e?!0:!1)},showCaptionEditor:function(e){this.captionEditor||(this.captionEditor=new Ext.Editor({alignment:"tl",autoSize:!0,field:{selectOnFocus:!0,xtype:"textfield",width:"100%",anchor:"99%"}})),this.el.child(".caption").setDisplayed(!0),e||this.el.child(".caption").setStyle("position","static"),this.captionEditor.startEdit(this.el.child(".caption"),this._data.caption),this.captionEditor.on("complete",function(e,t){this.setCaption(t),this.el.child(".caption").setStyle("position","absolute")},this)},getMenuOptions:function(){return[]},pickerHandler:function(e,t){this._data={id:e.data.id,caption:e.data.caption};var i=Array.prototype.slice.call(arguments);i.shift(),t.call(this,i)},beforeInit:function(e){var t=arguments;if(this._data&&this._data[this.idProperty])return void e.call(this,t);var i=new Garp.ModelPickerWindow({model:this.model,listeners:{select:function(t){t.selected?this.pickerHandler(t.selected,e):this.destroy(),i.close()},scope:this}});i.show()},resizeContent:function(e){var t=this._data,i=t.height/t.width,a=e*i-this.margin;return this.contentEditableEl.setHeight(a),this.contentEditableEl.child(".img")&&this.contentEditableEl.child(".img").setHeight(a),a},setContent:function(){this.contentEditableEl=this.el.child(".contenteditable"),this.contentEditableEl.update(""),this.contentEditableEl.dom.setAttribute("contenteditable",!1);var e=new Image,t=this,i=IMAGES_CDN+"scaled/cms_preview/"+this._data[this.idProperty];e.onerror=function(){t.contentEditableEl.setStyle({position:"relative",padding:0}),t.contentEditableEl.update('<div class="img">'+__("Image not found")+"</div>")},e.onload=function(){Ext.apply(t._data,{width:e.width,height:e.height}),t.contentEditableEl.setStyle({position:"relative",padding:0}),t.contentEditableEl.update('<div class="img"></div><p class="caption"></p>'),t.contentEditableEl.child(".img").setStyle({backgroundImage:'url("'+i+'")'}),t.resizeContent(t.contentEditableEl.getWidth()),t.ownerCt&&t.ownerCt.doLayout()},e.src=i,e.complete&&e.onload()},initComponent:function(){this.html+='<div class="contenteditable"></div>',this.addClass("wysiwyg-image"),this.addClass("wysiwyg-box"),this.col&&this.addClass(this.col),this.on("user-resize",function(e,t){this.setHeight(this.resizeContent(t))}),this.on("afterrender",this.setContent,this),Garp.dataTypes.Image.Wysiwyg.superclass.initComponent.call(this,arguments)}})})}(),function(){"Info"in Garp.dataTypes&&Garp.dataTypes.Info.on("init",function(){})}(),function(){"Location"in Garp.dataTypes&&Garp.dataTypes.Location.on("init",function(){})}(),Ext.ns("Garp.dataTypes"),function(){"Snippet"in Garp.dataTypes&&Garp.dataTypes.Snippet.on("init",function(){this.disableDelete=!0,this.disableCreate=!0,this.getField("text").height=300,this.getField("html").height=300,this.addListener("loaddata",function(e,t){function i(){Ext.each(n,function(t){a.findField(t).setVisible("1"==e.data["has_"+t])}),t.ImagePreview_image_id.setVisible(1==e.data.has_image),"undefined"!=typeof e.data.variables&&a.findField("variables")&&a.findField("variables").setVisible(e.data.variables&&e.data.variables.length)}var a=t.getForm(),n=["name","html","text"];if(t.rendered?i():t.on("show",i,null,{single:!0}),t.ImagePreview_image_id.setText(Garp.renderers.imageRelationRenderer(e.get("image_id"),null,e)||__("Add image")),t.variables_box&&e.data.variables){var l=e.data.variables.split(",");l="<ul><li>%"+l.join("%</li><li>%")+"%</li></ul>",t.variables_box.update(l)}else t.variables_box&&t.variables_box.update("-")}),this.getColumn("image_id").header="",Ext.each(["identifier"],function(e){var t=this.getField(e);Ext.apply(t,{disabled:!0,xtype:"textfield",allowBlank:!0})},this),this.getField("variables")&&(this.removeField("variables"),this.addField({ref:"../../../variables_box",allowBlank:!0,fieldLabel:__("Variables"),name:"variables",xtype:"box",hidden:!1,disabled:!1,cls:"garp-notification-boxcomponent",style:"margin-top: 20px;",html:""}),this.addField({xtype:"box",html:__("Variables will be replaced with dynamic content at the frontend."),fieldLabel:" "})),Ext.each(["has_text","has_name","has_image","has_html"],function(e){this.getField(e).hidden=!0},this)})}(),function(){"Text"in Garp.dataTypes&&Garp.dataTypes.Text.on("init",function(){this.iconCls="icon-text",this.Wysiwyg=Ext.extend(Garp.WysiwygAbstract,{allowedTags:["a","b","i","br","p","div","ul","ol","li"],_data:{description:null,name:null},getTagNames:function(e){var t=[];return e.childNodes?(Array.prototype.slice.call(e.childNodes).forEach(function(e){e&&e.tagName&&t.push(e.tagName)}),t):void 0},fixParagraphs:function(){var e,t=this.contentEditableEl.dom;if(t.childNodes&&(Ext.DomQuery.jsSelect("DIV",t).reverse().forEach(function(t){var i=t.childNodes;e=document.createElement("P"),Array.prototype.slice.call(i).forEach(function(t){e.appendChild(t.clone?t.clone():t)}),t.parentNode.replaceChild(e,t)}),-1==this.getTagNames(t).indexOf("P"))){var i=document.createRange();e=document.createElement("P"),i.selectNodeContents&&i.selectNodeContents(t),i.surroundContents(e),i.collapse(!0),i.detach()}},filterHtml:function(){function e(i){Ext.each(i,function(i){if(i){if(i.normalize(),i.tagName){var a=i.tagName.toLowerCase();if(-1==t.allowedTags.indexOf(a))if(i.childNodes.length>0)for(;i.childNodes.length>0&&i.parentNode;){var n=i.childNodes[i.childNodes.length-1],l=n.cloneNode(!0);i.parentNode.insertBefore(l,i),i.removeChild(n),i.parentNode.removeChild(i),e(t.contentEditableEl.dom.childNodes)}else i.parentNode&&i.parentNode.removeChild(i)}i.childNodes&&e(i.childNodes)}})}var t=this;e(this.contentEditableEl.dom.childNodes),this.fixParagraphs()},getData:function(){return this.contentEditableEl?{description:this.contentEditableEl.dom.innerHTML,name:this._data.name||!1}:""},setTitle:function(e){this._data.name=e,this.titleEl.update(e),this.titleEl.setDisplayed(e?!0:!1)},showTitleDialog:function(){this.titleEditor||(this.titleEditor=new Ext.Editor({alignment:"tl",autoSize:!0,field:{selectOnFocus:!0,xtype:"textfield",width:"100%",anchor:"99%"}})),this.titleEl.setDisplayed(!0),this.titleEditor.startEdit(this.titleEl,this._data.name),this.titleEditor.on("complete",function(e,t){this.setTitle(t)},this)},getMenuOptions:function(){return[{group:"",text:__("Add / remove title"),handler:this.showTitleDialog},{group:"",text:__("Add / remove animation classes"),handler:this.showAnimClassesDialog}]},initComponent:function(){this.html+='<div class="vertical-content"><h4 class="contenttitle"></h4><div class="contenteditable">'+__("Enter text")+"</div></div>",this.on("afterrender",function(){this.addClass("wysiwyg-box"),this.col&&this.addClass(this.col),this.el.select(".dd-handle, .target").each(function(e){e.dom.setAttribute(id,Ext.id())}),this.contentEditableEl=this.el.select(".contenteditable").first(),this.contentEditableEl.dom.setAttribute("contenteditable",!0),this.contentEditableEl.removeAllListeners(),this.contentEditableEl.on("focus",this.filterHtml,this),this.contentEditableEl.on("click",this.filterHtml,this),this.contentEditableEl.on("blur",this.filterHtml,this),this.titleEl=this.el.select(".contenttitle").first(),this.titleEl.removeAllListeners(),this.titleEl.on("click",this.showTitleDialog,this),this.type&&this.el.addClass(this.type),this._data&&this._data.description&&(this.contentEditableEl.update(this._data.description),this.titleEl.update(this._data.name||"")),this.titleEl.setDisplayed(this._data&&this._data.name||!1)},this),Garp.dataTypes.Text.Wysiwyg.superclass.initComponent.call(this,arguments)}})})}(),function(){"User"in Garp.dataTypes&&Garp.dataTypes.User.on("init",function(){this.removeRelationPanel("AuthLocal"),Ext.apply(this.getColumn("fullname"),{virtualSortField:"first_name"}),this.addColumn({dataIndex:"password",header:"Password",renderer:Ext.emptyFn,hidden:!0,virtual:!0}),this.addField({hidden:!0,ref:"../../../passwordField",name:"password"}),this.addField({allowBlank:!0,xtype:"passwordfieldset",ref:"../../../changePassword",callback:function(e,t){var i=e.refOwner.refOwner.passwordField,a=e.refOwner.refOwner.getForm().findField("email");t||a._keepRequired?(a.allowBlank=!1,a.label.addClass("required-field"),i.setValue(t)):(a.allowBlank=!0,a.label.removeClass("required-field"),i.setValue("")),e.refOwner.refOwner.getForm().items.each(function(){this.validate&&this.validate()})}}),this.addListener("loaddata",function(e,t){t.changePassword.collapseAndHide(),e.get("image_id")&&t.ImagePreview_image_id.setText(Garp.renderers.imageRelationRenderer(e.get("image_id"),null,e)||__("Add image"));var i=t.getForm().findField("role");if(i){var a=Garp.localUser.role||"User";Ext.each(Garp.ACL[a].children,function(e){var t=i.store.find("field1",e);i.store.removeAt(t)})}var n=t.getForm().findField("email");n&&n.allowBlank===!1?n._keepRequired=!0:n&&(n._keepRequired=!1)})})}(),Ext.ns("Garp.dataTypes"),function(){"Video"in Garp.dataTypes&&Garp.dataTypes.Video.on("init",function(){this.insertColumn(0,{header:'<span class="hidden">'+__("Thumbnail")+"</span>",width:84,fixed:!0,dataIndex:"thumbnail",renderer:Garp.renderers.imageRenderer});var e=this.getField("url");this.removeField("url"),this.insertField(1,Ext.apply(e,{ref:"urlField"})),this.insertField(2,{xtype:"box",cls:"garp-notification-boxcomponent",html:__("YouTube and Vimeo Url's are supported"),fieldLabel:" "}),this.insertField(3,{xtype:"button",ref:"../../../uploadBtn",hidden:!0,width:120,allowBlank:!0,anchor:null,fieldLabel:" ",handler:function(){this.ownerCt.urlField.clearInvalid();var e=new Garp.YouTubeUploadWindow({listeners:{uploadComplete:function(t){e.close(),this.ownerCt.urlField.setValue("http://youtu.be/watch?v="+t.data.videoId),Garp.formPanel.fireEvent("save-all")},scope:this}});e.show()},text:__("Upload a new video to YouTube")}),this.addFields([{xtype:"box",ref:"../../../preview",fieldLabel:__("Preview"),_data:{player:"",width:0,height:0},tpl:Garp.videoTpl},{xtype:"box",cls:"separator"},{name:"tags",fieldLabel:__("Tags"),xtype:"displayfield",allowBlank:!0,style:"max-height: 18px;overflow:hidden;"},{name:"video_author",fieldLabel:__("Author"),allowBlank:!0,xtype:"displayfield"}]),this.getField("player").hidden=!0,this.addListener("loaddata",function(e,t){function i(){if(t.el&&t.el.dom)if(e.phantom)t.uploadBtn.show(),t.preview.update({width:0,height:0,player:""});else{t.uploadBtn.hide();var i=t.preview.getWidth(),a=Math.floor(9*i/16);e.get("player")&&t.preview.update({width:i,height:a,player:e.get("player")})}}t.rendered?i.defer(500):t.on("show",i,null,{single:!0})}),Garp.dataTypes.Image&&Garp.dataTypes.Image.Wysiwyg&&(this.Wysiwyg=Ext.extend(Garp.dataTypes.Image.Wysiwyg,{model:"Video",idProperty:"id",pickerHandler:function(e,t){this._data={id:e.data.id,image:e.data.image};var i=Array.prototype.slice.call(arguments);i.shift(),t.call(this,i)},getData:function(){return{id:this._data.id,image:this._data.image}},initComponent:function(){this.html+='<div class="contenteditable"></div>',this.addClass("wysiwyg-image"),this.addClass("wysiwyg-box"),this.col&&this.addClass(this.col),this.on("user-resize",function(e,t){this.setHeight(this.resizeContent(t))}),this.on("afterrender",function(){this.contentEditableEl=this.el.child(".contenteditable"),this.contentEditableEl.update(""),this.contentEditableEl.dom.setAttribute("contenteditable",!1);var e=new Image,t=this,i=this._data.image;e.onload=function(){Ext.apply(t._data,{width:e.width,height:e.height}),t.contentEditableEl.setStyle({position:"relative",padding:0}),t.contentEditableEl.update('<div class="img"></div>'),t.contentEditableEl.child(".img").setStyle({backgroundImage:'url("'+i+'")'}),t.resizeContent(t.contentEditableEl.getWidth()),t.ownerCt&&t.ownerCt.doLayout()},e.src=i,e.complete&&e.onload()},this),Garp.dataTypes.Image.Wysiwyg.superclass.initComponent.call(this,arguments)}}))})}(),Garp.dataTypes.AuthLocal.on("init",function(){}),Garp.dataTypes.AuthPasswordless.on("init",function(){}),Garp.dataTypes.ClusterClearCacheJob.on("init",function(){}),Garp.dataTypes.ClusterRecurringJob.on("init",function(){}),Garp.dataTypes.ClusterServer.on("init",function(){}),Garp.dataTypes.Image.on("init",function(){}),Garp.dataTypes.Snippet.on("init",function(){}),Garp.dataTypes.User.on("init",function(){});