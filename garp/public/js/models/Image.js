Ext.ns('Garp.dataTypes');
(function() {
	if (!('Image' in Garp.dataTypes)) {
		return;
	}
	Garp.dataTypes.Image.on('init', function(){

		this.iconCls = 'icon-img';
		
		// Thumbnail column:
		this.insertColumn(0, {
			header: '<span class="hidden">' + __('Image') + '</span>',
			dataIndex: 'id',
			width: 84,
			fixed: true,
			renderer: Garp.renderers.imageRelationRenderer,
			hidden: false
		});

		this.addListener('loaddata', function(rec, formPanel){
			
			function updateUI(){

				// Upload callback does not contain a filename; it renderers the image itself. Do not overwrite:
				if (rec.get('filename')) {
					formPanel.preview.update(Garp.renderers.imagePreviewRenderer(rec.get('filename'), null, rec));
					formPanel.download.update({
						filename: rec.get('filename')
					});
				}
				// if we're in a relateCreateWindow, set height again, otherwise it might not fit. We choose a safe 440px height
				if (typeof formPanel.center == 'function') {
					var i = new Image();
					i.onload = function(){
						if (formPanel && formPanel.el && formPanel.el.dom) {
							formPanel.setHeight(440);
							formPanel.center();
						}
					};
					i.src  = formPanel.preview.getEl().child('img') ? formPanel.preview.getEl().child('img').dom.src : '';
				}
			}
			
			if (formPanel.rendered) {
				updateUI();
			} else {
				formPanel.on('show', updateUI, null, {
					single: true
				});
			}
			
		}, true);
		
		// Remove these fields, cause we are about to change the order and appearance of them... 
		this.removeField('filename');
		this.removeField('id');

		var fDesc = this.getField('filename_info');
		if (fDesc) {
			this.removeField('filename_info');
		} else {
			fDesc = {
				xtype: 'box',
				cls: 'garp-notification-boxcomponent',
				name: 'filename_info',
				html: __('Only {1} and {2} files with a maximum of {3} MB are accepted', 'jpg, png', 'gif', '20'),
				fieldLabel: ' '
			};
		}

		// ...include them again:
		this.insertField(0, {
			xtype: 'fieldset',
			style: 'margin: 0;padding:0;',
			items: [{
				name: 'id',
				hideFieldLabel: true,
				disabled: true,
				xtype: 'numberfield',
				hidden: true,
				ref: '../../../../_id'
			}, {
				name: 'filename',
				fieldLabel: __('Filename'),
				xtype: 'uploadfield',
				allowBlank: false,
				emptyText: __('Drag image here, or click browse button'),
				uploadURL: BASE + 'g/content/upload/type/image',
				ref: '../../../../filename',

				listeners: {
					'change': function(field, val){
						if (this.refOwner._id.getValue()) {
							var url = BASE + 'admin?' +
							Ext.urlEncode({
								model: Garp.currentModel,
								id: this.refOwner._id.getValue()
							});
							if (DEBUG) {
								url += '#DEBUG';
							}

							// because images won't reload if their ID is
							// still the same, we need to reload the page
							this.refOwner.formcontent.on('loaddata', function(){
								var lm = new Ext.LoadMask(Ext.getBody());
								lm.show();
								document.location.href = url;
							});
							this.refOwner.fireEvent('save-all');
						} else {
							this.refOwner.preview.update(Garp.renderers.uploadedImagePreviewRenderer(val));
							this.refOwner.get(0).get(0).fireEvent('loaddata', this.refOwner.rec, this.refOwner);
							this.refOwner.download.update({
								filename: val
							});
						}
						return true;
					}
				}
			}, fDesc, {
				xtype: 'box',
				ref: '../../../../preview',
				fieldLabel: __('Preview'),
				cls: 'preview',
				html: ''
			}, {
				xtype: 'box',
				hidden: false,
				ref: '../../../../download',
				fieldLabel: ' ',
				hideFieldLabel: false,
				tpl: new Ext.XTemplate('<tpl if="filename">', '<a href="' + IMAGES_CDN + '{filename}" target="_blank">' + __('View original file') + '</a>', '</tpl>')
			}]
		});


		// Wysiwyg Editor
		this.Wysiwyg = Ext.extend(Garp.WysiwygAbstract, {

			model: 'Image',

			idProperty: 'id',

			settingsMenu: true,

			margin: 0,

			getData: function(){
				return {
					id: this._data.id,
					caption: this._data.caption
				};
			},

			// override: we don't need filtering for images:
			filterHtml: function(){
				return true;
			},


			setCaption: function(text){
				this._data.caption = text;
				this.el.child('.caption').update(text);
				this.el.child('.caption').setDisplayed( text ? true : false);
			},

			showCaptionEditor: function(setPosition){
				if (!this.captionEditor) {
					this.captionEditor = new Ext.Editor({
						alignment: 'tl',
						autoSize: true,
						field: {
							selectOnFocus: true,
							xtype: 'textfield',
							width: '100%',
							anchor: '99%'
						}
					});
				}
				this.el.child('.caption').setDisplayed(true);
				// if the user clicks the upper 'settings' menu; the caption el should be displayed there,
				//... not below the image, where it might be "below the fold"
				if (!setPosition) {
					this.el.child('.caption').setStyle('position', 'static');
				}
				this.captionEditor.startEdit(this.el.child('.caption'), this._data.caption);
				this.captionEditor.on('complete', function(f, v){
					this.setCaption(v);
					this.el.child('.caption').setStyle('position','absolute');
				}, this);
			},

			getMenuOptions: function(){
				return [
				// {
				// 	group: '',
				// 	text: 'Add / remove caption',
				// 	handler: this.showCaptionEditor.createDelegate(this, [false])
				// },
				// {
				// 	group :'',
				// 	text: __('Add / remove animation classes'),
				// 	handler: this.showAnimClassesDialog
				// }
				];

			},



			/**
		 	 * After pick:
		 	 */
			pickerHandler: function(sel, afterInitCb){
				this._data = {
					id: sel.data.id,
					caption: sel.data.caption
				};
				var args = Array.prototype.slice.call(arguments);
				args.shift();
				afterInitCb.call(this, args);
			},

			/**
		 	 *
		 	 * @param {Object} afterInitCb
		 	 */
			beforeInit: function(afterInitCb){
				var args = arguments;
				// Do we need to present a dialog or not?
				if(this._data && this._data[this.idProperty]){
					afterInitCb.call(this, args);
					return;
				}
				var picker = new Garp.ModelPickerWindow({
					model: this.model,
					listeners: {
						select: function(sel){
							if (sel.selected) {
								this.pickerHandler(sel.selected, afterInitCb);
							} else {
								this.destroy();
							}
							picker.close();
						},
						scope: this
					}
				});
				picker.show();
			},

			/**
		 	 * Sets content height based on width (maintains aspect ratio)
		 	 * @param {Number} new width
		 	 * @returns height
		 	 */
			resizeContent: function(nw){
				var i = this._data;
				var aspct = i.height / i.width;
				var nHeight = (nw * aspct) - this.margin;
				this.contentEditableEl.setHeight(nHeight);
				if (this.contentEditableEl.child('.img')) {
					this.contentEditableEl.child('.img').setHeight(nHeight);
				}
				return nHeight;
			},


			setContent: function(){
				this.contentEditableEl = this.el.child('.contenteditable');
				this.contentEditableEl.update('');
				this.contentEditableEl.dom.setAttribute('contenteditable', false);

				var i = new Image();
				var scope = this;
				var path = IMAGES_CDN + 'scaled/cms_preview/' + this._data[this.idProperty];
				i.onerror = function(){
					scope.contentEditableEl.setStyle({
						position: 'relative',
						padding: 0
					});
					scope.contentEditableEl.update('<div class="img">' + __('Image not found') + '</div>');
				};
				i.onload = function(){

					Ext.apply(scope._data, {
						width: i.width,
						height: i.height
					});

					scope.contentEditableEl.setStyle({
						position: 'relative',
						padding: 0
					});

					scope.contentEditableEl.update('<div class="img"></div><p class="caption"></p>');
					scope.contentEditableEl.child('.img').setStyle({
						backgroundImage: 'url("' + path + '")'
					});
					// var captionEl = scope.contentEditableEl.child('.caption');
					// if (scope._data.caption) {
					// 	captionEl.update(scope._data.caption);
					// 	captionEl.show();
					// 	captionEl.on('click', scope.showCaptionEditor, scope);
					// } else {
					// 	captionEl.hide();
					// }

					scope.resizeContent(scope.contentEditableEl.getWidth());
					if (scope.ownerCt) {
						scope.ownerCt.doLayout();
					}
				};
				i.src = path;
				if (i.complete) {
					i.onload();
				}
			},

			/**
		 	 * init!
		 	 * @param {Object} ct
		 	 */
			initComponent: function(ct){

				this.html += '<div class="contenteditable"></div>';

				this.addClass('wysiwyg-image');
				this.addClass('wysiwyg-box');
				if (this.col) {
					this.addClass(this.col);
				}
				this.on('user-resize', function(w, nw){
					this.setHeight(this.resizeContent(nw));
				});
				this.on('afterrender', this.setContent, this);
				Garp.dataTypes.Image.Wysiwyg.superclass.initComponent.call(this, arguments);
			}
		});
	});
})();
