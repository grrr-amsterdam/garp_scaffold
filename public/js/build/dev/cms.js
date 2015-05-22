/**
 * overrides.js
 * This file contains overrides and *small* extensions on the Ext Framework itself and the Garp namespace.
 */
Ext.ns('Garp');

/**
 * @DEBUG utility function. ONLY Needed if Ticket #70 (CMS JS error) occurs again.
 *
Ext.override(Ext.Element, {
	getValue : function(asNumber){
		if (!this.dom) {
			\\TEMP = this;
			throw __('Error! Element "' + this.id + '" doesn\'t exist anymore.');

		} else {
			var val = this.dom.value;
			return asNumber ? parseInt(val, 10) : val;
		}
    }
});
*/

(function(){
	var  mailtoOrUrlRe = /(^mailto:(\w+)([\-+.][\w]+)*@(\w[\-\w]*))|((((^https?)|(^ftp)):\/\/)?([\-\w]+\.)+\w{2,3}(\/[%\-\w]+(\.\w{2,})?)*(([\w\-\.\?\\\/+@&#;`~=%!]*)(\.\w{2,})?)*\/?)/i;
	//   mailtoOrUrlRe = /(^mailto:(\w+)([\-+.][\w]+)*@(\w[\-\w]*))|((((^https?)|(^ftp)):\/\/)([\-\w]+\.)+\w{2,3}(\/[%\-\w]+(\.\w{2,})?)*(([\w\-\.\?\\\/+@&#;`~=%!]*)(\.\w{2,})?)*\/?)/i;
	Ext.apply(Ext.form.VTypes, {
		mailtoOrUrl: function(val, field){
			return mailtoOrUrlRe.test(val);
		},
		mailtoOrUrlText: 'Not a valid Url'
	});
})();

Garp.mailtoOrUrlPlugin = {
	init: function(field){
		var stricter = /(^mailto:(\w+)([\-+.][\w]+)*@(\w[\-\w]*))|(((^https?)|(^ftp)):\/\/([\-\w]+\.)+\w{2,3}(\/[%\-\w]+(\.\w{2,})?)*(([\w\-\.\?\\\/+@&#;`~=%!]*)(\.\w{2,})?)*\/?)/i;
		field.on({
			'change': function(f, n, o){
				if (!stricter.test(n) && n) {
					f.setValue('http://' + n);
				}
			}
		});

	}
};

/**
 * Override  updateRecord. We don't want non-dirty values to get synced. It causes empty string instead of null values...
 */
Ext.apply(Ext.form.BasicForm.prototype, {
	/**
     * Persists the values in this form into the passed {@link Ext.data.Record} object in a beginEdit/endEdit block.
     * @param {Record} record The record to edit
     * @return {BasicForm} this
     */
    updateRecord : function(record){
        record.beginEdit();
        var fs = record.fields,
            field,
            value;
        fs.each(function(f){
            field = this.findField(f.name);
			if(field){
				// ADDED BECAUSE OF NULL VALUES:
				if(typeof field.isDirty !== 'undefined' && !field.isDirty()){
					return;
				}
                value = field.getValue();
                if (Ext.type(value) !== false && value.getGroupValue) {
                    value = value.getGroupValue();
                } else if ( field.eachItem ) {
                    value = [];
                    field.eachItem(function(item){
                        value.push(item.getValue());
                    });
                }
                record.set(f.name, value);
            }
        }, this);
        record.endEdit();
        return this;
    }
});

/**
 * Define default fieldset config:
 */
Ext.apply(Ext.form.FieldSet.prototype,{
	border: false,
	buttonAlign: 'left',
	collapsible: true,

	defaults: {
		anchor: '-30',
		msgTarget: 'under'

	},
	hideCollapseTool: true,
	labelWidth: 120,
	labelSeparator: ' ',
	titleCollapse: true
});

/**
 * Defaults for combo:
 */
Ext.apply(Ext.form.ComboBox.prototype, {
	triggerAction: 'all',
	typeAhead: false
});

Ext.apply(Ext.grid.GridPanel.prototype,{
	loadMask: true
});

/**
 * Undirty is not native. Add it via Form's prototype. Simple extension on BasicForm
 */
Ext.apply(Ext.form.BasicForm.prototype,{

	// apply a change event to a form:
	// see: http://code.extjs.com:8080/ext/ticket/159
	add: function(){
		var me = this;
		me.items.addAll(Array.prototype.slice.call(arguments, 0));
		Ext.each(arguments, function(f){
			f.form = me;
			f.on('change', me.onFieldChange, me);
		});
		return me;
	},

	onFieldChange: function(){
		this.fireEvent('change', this);
	},
	// end see

	unDirty: function(){
		Ext.each(this.items.items, function(){
			if (this.xtype === 'richtexteditor' || this.xtype === 'htmleditor') {
				// Do not let the rte push textarea contents to iframe. It causes the caret to move to the end of the content...
				this.on({
					'beforepush': {
						fn: function(){
							return false;
						},
						'single': true
					}
				});
			}
			this.originalValue = this.getValue();
		});
	}
});

/**
 * Override data Store for Zend Compatibility:
 *
 */
Ext.override(Ext.data.Store, {

	/**
	 * Sort as a string ("name ASC") instead of object { sort : 'name', dir : 'ASC' }
	 */
	load: function(options){
		options = Ext.apply({}, options);
		this.storeOptions(options);
		if (this.sortInfo && this.remoteSort) {
			var pn = this.paramNames;
			options.params = Ext.apply({}, options.params);

			// sort as a string:
			options.params[pn.sort] = this.sortInfo.field + ' ' + this.sortInfo.direction;

			delete options.params[pn.dir];
		}
		try {
			return this.execute('read', null, options); // <-- null represents rs.  No rs for load actions.
		}
		catch (e) {
			this.handleException(e);
			return false;
		}
	}
});

/**
 * Fancier menu show
 * Give all menus (but not submenus) a fade In
 */
if (!Ext.isIE) {
	Ext.apply(Ext.menu.Menu.prototype, {
		listeners: {
			'show': function(){
				if (!this.parentMenu) {
					var el = this.getEl();
					var o = {
						duration: 0.2
					};
					el.fadeIn(o);
					if (el.shadow && el.shadow.el) {
						el.shadow.el.fadeIn(o);
					}
				}
				return true;
			}
		}
	});
}
Ext.apply(Ext.grid.GridPanel.prototype, {
	listeners:{
		/**
		 * Clear selections, when clicking outside of selection:
 		 */
		'containerclick': function(){
			this.getSelectionModel().clearSelections();
		},

		/**
		 * Hide columns with no title/text from columnMenu's:
		 */
		'viewready': function(){
			if (this.getView() && this.getView().hmenu) {
				var columnMenu = this.getView().hmenu.get('columns');
				columnMenu.menu.on('beforeshow', function(){
					var items = this.items;
					items.each(function(menuItem){
						if (!menuItem.text) {
							columnMenu.menu.remove(menuItem.itemId);
						}
					});
				});
			}
		}
	}
});

/**
 * Image Template for embeding images
 */
Garp.imageTpl = new Ext.XTemplate(['<tpl if="caption">', '<tpl if="align">', '<figure class="figure" style="float: {align};">', '</tpl>', '<tpl if="!align">', '<figure class="figure" style="float: none;">', '</tpl>', '<img src="{path}" draggable="false"> ', '<figcaption>{caption}</figcaption>', '</figure>', '</tpl>', '<tpl if="!caption">', '<tpl if="align">', '<img class="figure {align}" src="{path}">', '</tpl>', '<tpl if="!align">', '<img class="figure" src="{path}">', '</tpl>', '</tpl>']);

/**
 * Video Template for embeding videos
 */
Garp.videoTpl = new Ext.XTemplate('<figure class="video-embed"><iframe width="{width}" height="{height}" src="{player}" frameborder="0"></iframe></figure>');

/**
 * Ext.Panel setTitle override for TabPanels (ellipsis added)
 * @param {String} title
 * @param {String} iconCls
 */
Ext.override(Ext.Panel, {
	setTitle : function(title, iconCls){
		if (this.tabEl) {
			title = Ext.util.Format.ellipsis(title, 25, true);
		}
        this.title = title;

        if(this.header && this.headerAsText){
            this.header.child('span').update(title);
        }
        if(iconCls){
            this.setIconClass(iconCls);
        }
        this.fireEvent('titlechange', this, title);
        return this;
    }
});

/**
 * Override BasicForm getFieldValues, because compositeFields don't work well native (can't get fieldValues from items inside comp.field)
 * @param {Object} dirtyOnly
 */
/*
Ext.form.BasicForm.prototype.getFieldValues = function(dirtyOnly){
	var o = {}, n, key, val;
	function walk(f){
		n = f.getName();
		if (!n)
			return;
		key = o[n];
		val = f.getValue();

		if (Ext.isDefined(key)) {
			if (Ext.isArray(key)) {
				o[n].push(val);
			} else {
				o[n] = [key, val];
			}
		} else {
			o[n] = val;
		}
	}
	this.items.each(function(f){
		if (!f.xtype == 'compositefield' && !f.disabled && (dirtyOnly !== true || f.isDirty())) {
			walk(f);
		} else if (f.xtype == 'compositefield' && f.items) {
			f.items.each(function(cf){
				walk(cf);
			})
		}
	});
	return o;
};*/

Ext.apply(Ext.BasicForm.prototype, {
	getFieldValues : function(dirtyOnly){
        var o = {},
            n,
            key,
            val;
        this.items.each(function(f) {

			function walk(f){

				if (!f.disabled && (dirtyOnly !== true || f.isDirty())) {
					n = f.getName();
					if (!n) {
						return;
					}
					key = o[n];
					val = f.getValue();

					if (Ext.isDefined(key)) {
						if (Ext.isArray(key)) {
							o[n].push(val);
						} else {
							o[n] = [key, val];
						}
					} else {
						o[n] = val;
					}
				}
			}
			if ((f.xtype == 'tweetfield') && f.items) {
				f.items.each(function(cf){
					walk(cf);
				});
			} else {
				walk(f);
			}
        });
        return o;
    }
});

/**
 * Extension to Ext.Grid Column
 */
Ext.override(Ext.grid.Column,{
	virtual: false
});

/**
 *
 */

Ext.override(Ext.form.Field,{
	// necessary for 'one' field models. Otherwise formDirty will not fire until field blur, which is odd
	enableKeyEvents: true,

	// countBox helper functions:
	getCountBox: function(){
		var cb;
		if (this.refOwner) {
			cb = this.refOwner[this.countBox];
		} else if (this.ownerCt.ownerCt) {
			cb = this.ownerCt.ownerCt.ownerCt.ownerCt[this.countBox];
		}
		return cb;
	},
	updateCountBox: function(){
		var l = this.maxLength - (this.getValue() ? this.getValue().length : 0);
		if(l < 0){
			this.getCountBox().getEl().addClass('negative');
		} else {
			this.getCountBox().getEl().removeClass('negative');
		}
		this.getCountBox().update(l + ' ' + __('left'));
	},
	hideCountBox: function(){
		this.getCountBox().update('');
		return true;
	},

	initComponent: function(){

		Ext.form.Field.superclass.initComponent.call(this);

		// Prevent conflicts with superbox select. We'll quit here:
		if(this.xtype && this.xtype == 'superboxselect'){
			return true;
		}
		this.on('blur', function(){
			if (this.getValue()) {
				if (this.getValue() === String(this.getValue())) {
					this.setValue(String(this.getValue()).trim());
				}
			}
			return true;
		}, this);

		this.on('afterrender', function(){

			if (this.countBox && this.maxLength) {
				this.getEl().on({
					'keypress': {
						fn: this.updateCountBox,
						buffer: 50,
						scope: this
					}
				});
				this.on('focus',  this.updateCountBox, this);
				this.on('blur',  this.hideCountBox, this);
				this.on('change',  this.updateCountBox, this);
			}

			if (!this.allowBlank && this.label) {
				this.label.addClass('required-field');
			}
			if (this.xtype == 'numberfield' && this.label){
				this.label.addClass('number-field');
				if (!this.width) {
					this.setWidth(50);
					delete this.anchor;
				}
			}
		}, this);
        this.addEvents(
            'focus',
            'blur',
            'specialkey',
            'change',
            'invalid',
            'valid'
        );
	}
});

/**
 * Same as field ^^
 */
Ext.override(Ext.Button, {
	initComponent: function(){

		if (this.menu) {
			this.menu = Ext.menu.MenuMgr.get(this.menu);
			this.menu.ownerCt = this;
		}

		Ext.Button.superclass.initComponent.call(this);

		// fieldLabel class support:
		if (this.allowBlank !== true) {
			this.on('afterrender', function(){
				if (this.label) {
					this.label.addClass('required-field');
				}
			}, this);

		}

		this.addEvents('click', 'toggle', 'mouseover', 'mouseout', 'menushow', 'menuhide', 'menutriggerover', 'menutriggerout');

		if (this.menu) {
			this.menu.ownerCt = undefined;
		}
		if (Ext.isString(this.toggleGroup)) {
			this.enableToggle = true;
		}
	}
});

/**
 * provide renderer function to displayFields:
 */
Ext.override(Ext.form.DisplayField, {
	setValue: function(v){
		if (this.renderer) {
			v = this.renderer(v);
		}
		this.setRawValue(v);
		return this;
	}
});

/**
 * MySQL doesn't like null for TimeFields and DateFields. It's picky on time format too:
 */
Ext.override(Ext.form.TimeField, {
	format: 'H:i', // we default to 24Hr format. "12:00 AM" is not supported
	getValue: function(){
		var v = Ext.form.TimeField.superclass.getValue.call(this);
        return this.formatDate(this.parseDate(v)) || null;
	}
});

Ext.override(Ext.form.DateField, {
	getValue: function(){
		return this.parseDate(Ext.form.DateField.superclass.getValue.call(this)) || null;
	},
	setValue: function(date){
		if (date && ((date.getFullYear && date.getFullYear() > -1) || this.parseDate(date))) {
			return Ext.form.DateField.superclass.setValue.call(this, this.formatDate(this.parseDate(date)));
		}
		return Ext.form.DateField.superclass.setValue.call(this, null);
	}
});

/**
 * custom (simplification of) paging toolbar
 */
Ext.override(Ext.PagingToolbar, {
	initComponent : function(){
		var T = Ext.Toolbar;
		this.first = new T.Button({});
		this.last = new T.Button({});
		this.refresh = new T.Button({});

        var pagingItems = [ this.prev = new T.Button({
            tooltip: this.prevText,
            overflowText: this.prevText,
            iconCls: 'x-tbar-page-prev',
            disabled: true,
            handler: this.movePrevious,
            scope: this
        }), this.beforePageText,
        this.inputItem = new Ext.form.NumberField({
            cls: 'x-tbar-page-number',
            allowDecimals: false,
            allowNegative: false,
            enableKeyEvents: true,
            selectOnFocus: true,
            submitValue: false,
            listeners: {
                scope: this,
                keydown: this.onPagingKeyDown,
                blur: this.onPagingBlur
            }
        }), this.afterTextItem = new T.TextItem({
            text: String.format(this.afterPageText, 1)
        }), this.next = new T.Button({
            tooltip: this.nextText,
            overflowText: this.nextText,
            iconCls: 'x-tbar-page-next',
            disabled: true,
            handler: this.moveNext,
            scope: this
        })];


        var userItems = this.items || this.buttons || [];
        if (this.prependButtons) {
            this.items = userItems.concat(pagingItems);
        }else{
            this.items = pagingItems.concat(userItems);
        }
        delete this.buttons;
        if(this.displayInfo){
            this.items.push('->');
            this.items.push(this.displayItem = new T.TextItem({}));
        }
        Ext.PagingToolbar.superclass.initComponent.call(this);
        this.addEvents(
            /**
             * @event change
             * Fires after the active page has been changed.
             * @param {Ext.PagingToolbar} this
             * @param {Object} pageData An object that has these properties:<ul>
             * <li><code>total</code> : Number <div class="sub-desc">The total number of records in the dataset as
             * returned by the server</div></li>
             * <li><code>activePage</code> : Number <div class="sub-desc">The current page number</div></li>
             * <li><code>pages</code> : Number <div class="sub-desc">The total number of pages (calculated from
             * the total number of records in the dataset as returned by the server and the current {@link #pageSize})</div></li>
             * </ul>
             */
            'change',
            /**
             * @event beforechange
             * Fires just before the active page is changed.
             * Return false to prevent the active page from being changed.
             * @param {Ext.PagingToolbar} this
             * @param {Object} params An object hash of the parameters which the PagingToolbar will send when
             * loading the required page. This will contain:<ul>
             * <li><code>start</code> : Number <div class="sub-desc">The starting row number for the next page of records to
             * be retrieved from the server</div></li>
             * <li><code>limit</code> : Number <div class="sub-desc">The number of records to be retrieved from the server</div></li>
             * </ul>
             * <p>(note: the names of the <b>start</b> and <b>limit</b> properties are determined
             * by the store's {@link Ext.data.Store#paramNames paramNames} property.)</p>
             * <p>Parameters may be added as required in the event handler.</p>
             */
            'beforechange'
        );
        this.on('afterlayout', this.onFirstLayout, this, {single: true});
        this.cursor = 0;
        this.bindStore(this.store, true);
    }});


/**
 * Overrides for propertygrid & column: no sorting by default, and support for 'required' property marking:
 */

Ext.override(Ext.grid.PropertyGrid, {
	initComponent : function() {
		this.customRenderers = this.customRenderers || {};
		this.customEditors = this.customEditors || {};
		this.lastEditRow = null;
		var store = new Ext.grid.PropertyStore(this);
		this.propStore = store;
		var cm = new Ext.grid.PropertyColumnModel(this, store);
		//store.store.sort('name', 'ASC');
		this.addEvents('propertychange');
		this.cm = cm;
		this.ds = store.store;
		Ext.grid.PropertyGrid.superclass.initComponent.call(this);

		this.mon(this.selModel, 'beforecellselect', function(sm, rowIndex, colIndex) {
			if (colIndex === 0) {
				this.startEditing.defer(200, this, [rowIndex, 1]);
				return false;
			}
		}, this);
	}
});

Ext.override(Ext.grid.PropertyColumnModel, {
	constructor : function(grid, store) {

		var g = Ext.grid, f = Ext.form;

		this.grid = grid;
		g.PropertyColumnModel.superclass.constructor.call(this, [{
			header : this.nameText,
			width : 50,
			sortable : false,
			dataIndex : 'name',
			id : 'name',
			menuDisabled : true
		}, {
			header : this.valueText,
			width : 50,
			resizable : false,
			dataIndex : 'value',
			id : 'value',
			menuDisabled : true
		}]);
		this.store = store;

		var bfield = new f.Field({
			autoCreate : {
				tag : 'select',
				children : [{
					tag : 'option',
					value : 'true',
					html : this.trueText
				}, {
					tag : 'option',
					value : 'false',
					html : this.falseText
				}]
			},
			getValue : function() {
				return this.el.dom.value == 'true';
			}
		});
		this.editors = {
			'date' : new g.GridEditor(new f.DateField({selectOnFocus : true})),
			'string' : new g.GridEditor(new f.TextField({selectOnFocus : true})),
			'number' : new g.GridEditor(new f.NumberField({selectOnFocus : true,style : 'text-align:left;'})),
			'boolean' : new g.GridEditor(bfield, {autoSize : 'both'})
		};
		this.renderCellDelegate = this.renderCell.createDelegate(this);
		this.renderPropDelegate = this.renderProp.createDelegate(this);
	},

	requiredPropertyRenderer : function(v, m, r) {
		var ce = this.grid.customEditors;
		if(ce[r.id] && ce[r.id].field && ce[r.id].field.allowBlank === false){
			m.css = 'required-property';
		}
		return this.renderProp(v);
	},

	getRenderer : function(col) {
		return (col === 0 ? this.requiredPropertyRenderer.createDelegate(this) : (this.renderCellDelegate || this.renderPropDelegate));
	}
}); 

/**
 * garp.config.js
 * 
 * Defines config properties and functions ("globals")
 */

Ext.ns('Garp');

Garp.SMALLSCREENWIDTH = 640;

/**
 * Locale
 */
if (typeof Garp.locale === 'undefined') {
	Garp.locale = {};
}

function __(str, vars){
	if (arguments.length > 1) {
		var args = [].slice.call(arguments);
		args.unshift(typeof Garp.locale[str] !== 'undefined' ? Garp.locale[str] : str);
		return String.format.apply(String, args);
	}
	if (typeof Garp.locale[str] !== 'undefined') {
		return Garp.locale[str];
	}
	return str;
}
	
/**
 * Defaults & shortcuts
 */
var maxItems = Math.floor((window.innerHeight - 100 - 34) / 20) - 1; // grid starts 100px from top, ends 34px from bottom
Ext.applyIf(Garp,{
	pageSize: maxItems * 2, // double the pageSize to let the scrollbar show
	localUser: {}, // the logged in User
	confirmMsg: __('Changes will get lost. Continue?')
});

Ext.apply(Ext.Ajax,{
	timeout: 0
});

Ext.ns('Garp.renderers');

/**
 * General Column Renderers & Field converters
 * 
 */
Ext.apply(Garp.renderers,{
	
	/**
	 * Converter for fullname fields. Combines first, prefix, last into one field. Usefull e.g. as displayField for relationFields
	 * @param {Object} v field value (not used)
	 * @param {Object} rec Ext.Record
	 */
	fullNameConverter: function(v, rec){
		var name = [];
		Ext.each(['first_name', 'last_name_prefix', 'last_name'], function(f){
			if(rec[f]){
				name.push(rec[f]);
			}
		});
		if(!name){
			name = rec.name;
		}
		return name.join(' ');
	},
	
	/**
	 * Google address resolver. Forms only
	 * @param {Object} arr
	 * @return {String} formated address
	 */
	geocodeAddressRenderer: function(arr){
		arr = arr.address_components;
		var country_long,
		country,
		city,
		street,
		housenumber,
		out = '';

		Ext.each(arr, function(i){
			if(i.types.indexOf('country') > -1){
				country_long = i.long_name;
				country = i.short_name;
			}
			if(i.types.indexOf('locality') > -1){
				city = i.short_name;
			}
			if(i.types.indexOf('route') > -1){
				street = i.short_name;
			}
			if(i.types.indexOf('street_number') > -1){
				housenumber = i.short_name;
			}
			
		});
		if (housenumber) {
			out = street + ' ' + housenumber;
		} else if (street) {
			out = street;
		} 
		if(city){
			out += ', ' + city;
		}
		if(country != 'NL'){
			out += ', ' + country_long;
		}
		return out;		
	},
	
	/**
	 * We do not want HTML to be viewed in a grid column. This causes significant performance hogs and Adobe Flash™ bugs otherwise...
	 */
	htmlRenderer: function(){
		return '';
	},
	
	/**
	 * Shorter Date & Time
	 * @param {Date/String} date
	 */
	shortDateTimeRenderer: function(date, meta, rec){
		var displayFormat = 'd M Y H:i';
		if (Ext.isDate(date)) {
			return date.format(displayFormat);
		}
		if (date && typeof Date.parseDate(date,'Y-m-d H:i:s') != 'undefined') {
			return Date.parseDate(date, 'Y-m-d H:i:s').format(displayFormat);
		}
		return '-';
	},
	
	
	/**
	 * Date & Time
	 * @param {Date/String} date
	 */
	dateTimeRenderer: function(date, meta, rec){
		var displayFormat = 'd F Y H:i';
		if (Ext.isDate(date)) {
			return date.format(displayFormat);
		}
		if (date && typeof Date.parseDate(date,'Y-m-d H:i:s') != 'undefined') {
			return Date.parseDate(date, 'Y-m-d H:i:s').format(displayFormat);
		}
		return '-';
	},
	
	/**
	 * Used in metaPanel
	 * @param {Object} v
	 */
	metaPanelDateRenderer: function(v){
		if (v && v.substr(0, 4) == '0000') {
			return '<i>' + __('Invalid date') + '</i>';
		}
		return v ? Garp.renderers.intelliDateTimeRenderer(v) : '<i>' + __('No date specified') + '</i>';
	},
	
	/**
	 * Date only
	 * @param {Object} date
	 */
	dateRenderer: function(date, meta, rec){
		var displayFormat = 'd F Y';
		if (Ext.isDate(date)) {
			var v =  date.format(displayFormat);
			return v;
		}
		if (date && typeof Date.parseDate(date, 'Y-m-d') != 'undefined') {
			return Date.parseDate(date, 'Y-m-d').format(displayFormat);
		} else if (date && typeof Date.parseDate(date, 'd F Y') != 'undefined') {
			return Date.parseDate(date, 'd F Y').format(displayFormat);
		}
		return '-';
	},
	
	/**
	 * 
	 * @param {Date/String} date
	 * @param {Object} meta
	 * @param {Object} rec
	 */
	timeRenderer: function(date, meta, rec){
		var displayFormat = 'H:i';
		if (Ext.isDate(date)) {
			var v =  date.format(displayFormat);
			return v;
		}
		if (date && typeof Date.parseDate(date, 'H:i:s') != 'undefined') {
			return Date.parseDate(date, 'H:i:s').format(displayFormat);
		} else if (date && typeof Date.parseDate(date, 'H:i') != 'undefined') {
			return Date.parseDate(date, 'H:i').format(displayFormat);
		}
		return '-';
	},
	
	/**
	 * Year
	 * @param {Date/String} date
	 */
	yearRenderer: function(date, meta, rec){
		var displayFormat = 'Y';
		if (Ext.isDate(date)) {
			return date.format(displayFormat);
		}
		if (date && typeof Date.parseDate(date,'Y') != 'undefined') {
			return Date.parseDate(date, 'Y').format(displayFormat);
		}
		return '-';
	},
	
	
	/**
	 * For use in Forms. 
	 * 
	 * Displays today @ time, yesterday @ time or just the date (WITHOUT time)
	 * 
	 * @TODO Decide if this also needs to go into grids. Make adjustments then.
	 * @param {Date} date
	 */
	intelliDateTimeRenderer: function(date){
		var now = new Date();
		var yesterday = new Date().add(Date.DAY, -1);
		date = Date.parseDate(date, 'Y-m-d H:i:s');
		if (!date) {
			return;
		}
		if(date.getYear() == now.getYear()){
			if(date.getMonth() == now.getMonth()){
				if(date.getDate() == yesterday.getDate()){
					return __('Yesterday at') + ' ' + date.format('H:i');
				}
				if(date.getDate() == now.getDate()){
					//if(date.getMinutes() == now.getMinutes()){
					//	return __('a few seconds ago');
					//} 
					return __('Today at') + ' ' + date.format('H:i');
				}
				return date.format('j M');
			}	
		}
		return date.format('j M Y');
	},
	
	
	/**
	 * Image
	 * @param {Object} val
	 */
	imageRenderer: function(val, meta, record, options){
		if(!record){
			record = {
				id: 0
			};
		}
		if(!Ext.isObject(options)){
			options = {
				size: 64
			};
		}
		var localTpl = new Ext.Template('<div class="garp-image-renderct"><img src="' + IMAGES_CDN + 'scaled/cms_list/' + record.id + '" width="' + options.size+ '" alt="{0}" /></div>', {
			compile: false,
			disableFormats: true
		});
		var remoteTpl = new Ext.Template('<div class="garp-image-renderct"><img src="{0}" width="' + options.size+ '" alt="{0}" /></div>', {
			compile: false,
			disableFormats: true
		});
		
		if (typeof record == 'undefined') {
			return __('New Image');
		}
		
		var v = val ? (/^https?:\/\//.test(val) ? remoteTpl.apply([val]) : localTpl.apply([val])) : __('No Image uploaded');
		return v;
	},
	
	/**
	 * Relation Renderer for buttons & columnModel
	 * @param {String} val image Id
	 * @param {Object} meta information. Only used in columnModel.renderer setup 
	 */
	imageRelationRenderer: function(val, meta, record){
		var imgHtml = '<img src="' + IMAGES_CDN + 'scaled/cms_list/' + val + '" width="64" alt="" />';
		if (meta) {	// column model renderer
			if (!val) {
				imgHtml = '<div class="no-img"></div>';
			}
			return '<div class="garp-image-renderct">' + imgHtml + '</div>';
		} else {	// button
			return val ? imgHtml : null;
		}
	},
	
	/**
	 * Image rendererer primarily intended for Garp.formPanel, not realy appropriate as a column renderer. Use imageRenderer instead
	 * @param {String} val
	 */
	imagePreviewRenderer: function(val,meta,record){
		var tpl = new Ext.Template('<div class="garp-image-renderct"><img src="' + IMAGES_CDN + 'scaled/cms_preview/' + record.id + '" alt="{0}" /></div>', {
			compile: true,
			disableFormats: true
		});
		if(typeof record == 'undefined'){
			record = {
				phantom : true
			};
		}
		var v =  val ? tpl.apply([val]) : record.phantom === true ? __('New Image') : __('No Image uploaded');
		return v;
	},
	
	/**
	 * 
	 * @param {String} val
	 */
	uploadedImagePreviewRenderer: function(val){
		var tpl = new Ext.Template('<div class="garp-image-renderct"><img src="' + IMAGES_CDN + val + '" /></div>', {
			compile: true,
			disableFormats: true
		});
		return tpl.apply(val);
	},

	
	/**
	 * cropPreviewRenderer
	 */
	cropPreviewRenderer: function(val, meta, record){
		if (record.get('w') && record.get('h')) {
			var size = 32;
			var w = record.get('w') / record.get('h') * size;
			var h = record.get('h') / record.get('w') * size;
			if (w > size) {
				h = h * (size / w);
				w = size;
			}
			if (h > size) {
				w = w * (size / h);
				h = size;
			}
			if (h == w) {
				w = h = size * 0.75;
			}
			var mt = (size - h) / 2;
			var ml = (size - w) / 2;
			h = Math.ceil(h);
			w = Math.ceil(w);
			mt = Math.floor(mt);
			ml = Math.floor(ml);
			
			return '<div style="background: #aaa; width: ' + size + 'px; height: ' + size + 'px; border: 1px #888 solid;"><div style="width: ' + w + 'px; height: ' + h + 'px; background-color: #eee;margin: ' + mt + 'px ' + ml + 'px;"></div></div>';
		} else {
			return '';
		}
	},
	
	/**
	 * 
	 * @param {Number} row
	 * @param {Number} cell
	 * @param {Object} view
	 */
	checkVisible: function(row, cell, view){
		if(view.getRow(row)){
			return Ext.get(view.getCell(row, cell)).isVisible(true);
		}
		return false;
	},
	
	/**
	 * remoteDisplayFieldRenderer
	 * grabs the external model and uses its displayField
	 * 
	 * Usage from extended model:
	 * @example this.addColumn({
	 *  // [...]
	 *  sortable: false
	 * 	dataIndex: 'Cinema'
	 * 	renderer: Garp.renderers.remoteDisplayFieldRenderer.createDelegate(null, ['Cinema'], true) // no scope, Cinema model, append arguments
	 * });
	 * 
	 * @param {Object} val
	 * @param {Object} meta
	 * @param {Object} rec
	 * @param {Number} rI
	 * @param {Number} cI
	 * @param {Object} store
	 * @param {Object} view
	 * @param {String} modelName
	 */
	remoteDisplayFieldRenderer: function(val, meta, rec, rI, cI, store, view, modelName){
		if (!modelName || !val) {
			return;
		}
		view.on('refresh', function(){
				if (Garp.renderers.checkVisible(rI, cI, view)) {
					Garp[modelName].fetch({
						query: {
							id: val
						}
					}, function(res){
						// make res an ultra ligtweight 'pseudo record':
						if (res.rows && res.rows[0]) {
							res.rows[0].get = function(v){
								return this[v] || '';
							};
							var text = Garp.dataTypes[modelName].displayFieldRenderer(res.rows[0]);
							if (Ext.get(view.getCell(rI, cI))) {
								Ext.get(view.getCell(rI, cI)).update('<div unselectable="on" class="x-grid3-cell-inner x-grid3-col-0">' + text + '</div>');
							}
						}
					});
				}
			
		}, {
			buffer: 200,
			scope: this
		});
		
		return '<div class="remoteDisplayFieldSpinner"></div>';
	},
	
	checkboxRenderer: function(v){
		return v == '1'  ? __('yes') : __('no');
	},
	
	i18nRenderer: function(v){
		if(v && typeof v == 'object' && v[DEFAULT_LANGUAGE]){
			return v[DEFAULT_LANGUAGE];
		} else if (typeof v !== 'object') {
			return v;
		} 
		return '-';
	}
});

/**
 * @class Searchbar
 * 
 * Toolbar with searchfield and option menu
 * 
 * @extends Ext.Toolbar   
 * @author: Peter
 */

Ext.ns('Ext.ux');

Ext.ux.Searchbar = Ext.extend(Ext.Toolbar, {

	/**
	 * @cfg height
	 * fixed to enable show/hide
	 *
	 * @TODO: Not sure why we need to hardcode this. Bug in Ext?
	 */
	height: 27,
	
	/**
	 * @cfg grid
	 * reference to the gridpanel this toolbar is bound to:
	 */
	grid: null,
	
	/**
	 * @function makeQuery
	 * 
	 * preserves possible "Model.id" queryStrings for relatePanel
	 * 
	 * @param {Object} queryStr
	 */
	makeQuery: function(queryStr){
		if (!queryStr) {
			this.grid.getStore().baseParams = Ext.apply({},this.originalBaseParams);
		} else {
			var q = this.grid.getStore().baseParams ? this.grid.getStore().baseParams.query : '';
			var dt = new Ext.util.MixedCollection();
			dt.addAll(Garp.dataTypes);
			var preserve = {};
			
			if (Ext.isObject(q)) {
				dt.eachKey(function(key){
					var keyId = key + '.id';
					if (q[keyId]) {
						preserve[keyId] = q[keyId];
					}
					var keyNotId = key + '.id <>';
					if (q[keyNotId]) {
						preserve[keyNotId] = q[keyNotId];
					}
				});
			}
			
			var selectedFields = this.getSelectedSearchFields();
			// make sure there are fields to look in:
			// fixes Melkweg Issue #958
			if (!selectedFields.length && this.getAllSearchFields().length){
				selectedFields = this.searchableFields;
			}
			
			var _query = Ext.apply(this.convertQueryString(queryStr, selectedFields), preserve);
			this.grid.getStore().setBaseParam('query', _query);
			this.grid.getStore().setBaseParam('pageSize', Garp.pageSize);
		}
		this.fireEvent('search', this);
		this.grid.getStore().load();
		//this.grid.getSelectionModel().selectFirstRow();
	},
	
	/**
	 * @function convertQueryString
	 * converts string to object
	 * @param {String} query
	 * @return {Object}
	 */
	convertQueryString: function(query, fields){
		if (query === '') {
			return {};
		}
		var q = '%' + query + '%';
		if (fields && fields.length) {
			var obj = {};
			Ext.each(fields, function(f){
				obj[f + ' like'] = q;
			});
			return {
				'or': obj
			};
		}
	},
	
	/**
	 * @function getSelectedSearchFields
	 * @return {Array} fields
	 */
	getSelectedSearchFields: function(){
		var fields = [];
		if (this.searchOptionsMenu) {
			Ext.each(this.searchOptionsMenu.items.items, function(item){
				if (item.xtype === 'menucheckitem' && item.checked && item._dataIndex) {
					fields.push(item._dataIndex);
				}
			});
		}
		return fields;
	},
	
	/**
	 * @function getAllSearchFields
	 * @return {Array} all fields searchable
	 */
	getAllSearchFields: function(){
		var fields = [];
		if (!this.grid) {
			return;
		}
		Ext.each(this.grid.getColumnModel().config, function(col){
			if (col.searchable === false) {
				return;
			} else if (col.searchable || (col.dataIndex !== 'relationMetadata')) {
				fields.push(col);
			}
		});
		return fields;
	},
	
	/**
	 * searchOptionsMenu
	 * The search options menu (Placeholder. It will get rebuild later, when the grid finishes loading):
	 */
	searchOptionsMenu: new Ext.menu.Menu({
		items: {
			xtype: 'menutextitem',
			cls: 'garp-searchoptions-menu',
			text: Ext.PagingToolbar.prototype.emptyMsg
		}
	}),
	
	/**
	 * @function buildSearchOptionsMenu
	 */
	buildSearchOptionsMenu: function(){
		var fields = this.getAllSearchFields();
		var menuItems = [{
			xtype: 'menutextitem',
			cls: 'garp-searchoptions-menu',
			text: __('Search in:')
		}, {
			xtype: 'menucheckitem',
			ref: 'selectAll',
			hideOnClick: false,
			checked: false,
			text: __('Select All'),
			checkHandler: function(ci, checked){
				if(!ci.parentMenu){
					return;
				}
				ci.parentMenu.items.each(function(){
					if(this._dataIndex){
						this.setChecked(checked, true);
					}
				});
			}
		}, '-'];
		
		this.searchableFields = [];
		Ext.each(fields, function(f){
			menuItems.push({
				text: f.header,
				checked: f.searchable || !f.hidden,
				_dataIndex: f.dataIndex
			});
			if (f.searchable || !f.hidden) {
				this.searchableFields.push(f.dataIndex);
			}
		}, this);
		this.searchOptionsMenu = new Ext.menu.Menu({
			defaults: {
				xtype: 'menucheckitem',
				hideOnClick: false
			},
			items: menuItems
		});
	},
	
	setBaseParams: function(){
		this.originalBaseParams  = Ext.apply({},this.store.baseParams);
	},
	
	/**
	 * @function initComponent
	 */
	initComponent: function(){
		
		this.addEvents('search');
		
		// Build the options menu, when the grid finishes loading its data:
		this.store.on({
			'load': {
				scope: this,
				single: true,
				fn: function(){
					if (!this.grid) {
						this.grid = this.ownerCt; // Can this be done in a better way?
					}
					if(!this.grid){
						return;
					}
					this.grid.getColumnModel().on('hiddenchange', function(){
						this.buildSearchOptionsMenu();
					}, this);
					this.buildSearchOptionsMenu();
				}
			}
		});
		
		// Add menu and searchfield to the toolbar: 
		var scope = this;
		this.layout = 'hbox';
		this.items = [{
			xtype: 'tbbutton',
			ref: 'searchoptionsbtn',
			iconCls: 'icon-searchoptions',
			//cls: 'garp-searchoptions',
			tooltip: __('Zoekopties'),
			width: 22,
			flex: 0,
			scope: this,
			handler: function(btn){
				this.searchOptionsMenu.show(btn.el);
			}
		}, this.searchField = new Ext.ux.form.SearchField({
			xtype: 'twintrigger',
			flex: 1,
			//style: 'paddingLeft: 22px;',
			store: this.store,
			value: Ext.isObject(this.store.baseParams.query) ? '' : this.store.baseParams.query,
			listeners:{
				'change': function(){
					var v = this.getValue();
					if(v.length <1){
						this.removeClass('has-search');
					} else {
						this.addClass('has-search');
					}
					
				}
			},
			onTrigger1Click: function(){
				if (this.hasSearch) {
					this.triggers[0].hide();
					this.el.dom.value = '';
					scope.makeQuery('');
					this.removeClass('has-search');
				}
			},
			onTrigger2Click: function(){
				var v = this.getRawValue();
				if (v.length < 1) {
					this.onTrigger1Click();
					return;
				}
				this.triggers[0].show();
				this.hasSearch = true;
				scope.makeQuery(v);
				
			}
		})];
		
		Ext.ux.Searchbar.superclass.initComponent.call(this);
	},
	
	/**
	 * @function blur
	 * Extended blur to cause searchField to blur as well
	 */
	blur: function(){
		this.searchField.blur();
		Ext.ux.Searchbar.superclass.blur.call(this);
	},
	
	/**
	 * Sets the UI as if one searched for an id
	 * @param {Object} id
	 */
	searchById: function(id){
		// show the id in the search bar & update menu to only set 'id' checked 
		var bb = this;
		var sf = this.searchField;
		var sm = this.searchOptionsMenu;
		sf.setValue(id);
		sf.triggers[0].show();
		sf.hasSearch = true;
		sf.fireEvent('change');
		sm.items.each(function(item){
			if (item.setChecked) {
				item.setChecked(item.text == 'id' ? true : false);
			}
		});
		bb.fireEvent('change');
	},
	
	/**
	 * @function afterRender
	 */
	afterRender: function(){
		var kn = new Ext.KeyNav(this.getEl(), {
			'esc': function(){
				this.blur();
				this.fireEvent('defocus');
			},
			scope: this
		});
		this.setBaseParams();
		Ext.ux.Searchbar.superclass.afterRender.call(this);
	}
});
 
 // register the component to allow lazy instantiating:
Ext.reg('searchbar', Ext.ux.Searchbar); 
/**
 * @class Ext.ux.form.DateTime
 * @extends Ext.form.Field
 *
 * DateTime field, combination of DateField and TimeField
 *
 * @author      Ing. Jozef Sakáloš
 * @copyright (c) 2008, Ing. Jozef Sakáloš
 * @version   2.0
 * @revision  $Id: Ext.ux.form.DateTime.js 813 2010-01-29 23:32:36Z jozo $
 *
 * @license Ext.ux.form.DateTime is licensed under the terms of
 * the Open Source LGPL 3.0 license.  Commercial use is permitted to the extent
 * that the code/component(s) do NOT become part of another Open Source or Commercially
 * licensed development library or toolkit without explicit permission.
 * 
 * <p>License details: <a href="http://www.gnu.org/licenses/lgpl.html"
 * target="_blank">http://www.gnu.org/licenses/lgpl.html</a></p>
 *
 * @forum      22661
 *
 * @donate
 * <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank">
 * <input type="hidden" name="cmd" value="_s-xclick">
 * <input type="hidden" name="hosted_button_id" value="3430419">
 * <input type="image" src="https://www.paypal.com/en_US/i/btn/x-click-butcc-donate.gif" 
 * border="0" name="submit" alt="PayPal - The safer, easier way to pay online.">
 * <img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1">
 * </form>
 */

Ext.ns('Ext.ux.form');

/**
 * Creates new DateTime
 * @constructor
 * @param {Object} config A config object
 */
Ext.ux.form.DateTime = Ext.extend(Ext.form.Field, {
    /**
     * @cfg {Function} dateValidator A custom validation function to be called during date field
     * validation (defaults to null)
     */
     dateValidator:null
    /**
     * @cfg {String/Object} defaultAutoCreate DomHelper element spec
     * Let superclass to create hidden field instead of textbox. Hidden will be submittend to server
     */
    ,defaultAutoCreate:{tag:'input', type:'hidden'}
    /**
     * @cfg {String} dtSeparator Date - Time separator. Used to split date and time (defaults to ' ' (space))
     */
    ,dtSeparator:' '
    /**
     * @cfg {String} hiddenFormat Format of datetime used to store value in hidden field
     * and submitted to server (defaults to 'Y-m-d H:i:s' that is mysql format)
     */
    ,hiddenFormat:'Y-m-d H:i:s'
    /**
     * @cfg {Boolean} otherToNow Set other field to now() if not explicly filled in (defaults to true)
     */
    ,otherToNow:true
    /**
     * @cfg {Boolean} emptyToNow Set field value to now on attempt to set empty value.
     * If it is true then setValue() sets value of field to current date and time (defaults to false)
     */
    /**
     * @cfg {String} timePosition Where the time field should be rendered. 'right' is suitable for forms
     * and 'below' is suitable if the field is used as the grid editor (defaults to 'right')
     */
    ,timePosition:'right' // valid values:'below', 'right'
    /**
     * @cfg {Function} timeValidator A custom validation function to be called during time field
     * validation (defaults to null)
     */
    ,timeValidator:null
    /**
     * @cfg {Number} timeWidth Width of time field in pixels (defaults to 100)
     */
    ,timeWidth:100
    /**
     * @cfg {String} dateFormat Format of DateField. Can be localized. (defaults to 'm/y/d')
     */
    ,dateFormat:'m/d/y'
    /**
     * @cfg {String} timeFormat Format of TimeField. Can be localized. (defaults to 'g:i A')
     */
    ,timeFormat:'g:i A'
    /**
     * @cfg {Object} dateConfig Config for DateField constructor.
     */
    /**
     * @cfg {Object} timeConfig Config for TimeField constructor.
     */

    // {{{
    /**
     * @private
     * creates DateField and TimeField and installs the necessary event handlers
     */
    ,initComponent:function() {
        // call parent initComponent
        Ext.ux.form.DateTime.superclass.initComponent.call(this);

        // create DateField
        var dateConfig = Ext.apply({}, {
             id:this.id + '-date'
            ,format:this.dateFormat || Ext.form.DateField.prototype.format
            ,width:this.timeWidth
			,hidden:this.hidden
            ,selectOnFocus:this.selectOnFocus
            ,validator:this.dateValidator
			,enableKeyEvents:true
            ,listeners:{
                  blur:{scope:this, fn:this.onBlur}
				 ,keypress:{scope:this, fn:this.onBlur}
                 ,focus:{scope:this, fn:this.onFocus}
            }
        }, this.dateConfig);
        this.df = new Ext.form.DateField(dateConfig);
        this.df.ownerCt = this;
        delete(this.dateFormat);

        // create TimeField
        var timeConfig = Ext.apply({}, {
             id:this.id + '-time'
            ,format:this.timeFormat || Ext.form.TimeField.prototype.format
            ,width:this.timeWidth
			,hidden:this.hidden
            ,selectOnFocus:this.selectOnFocus
            ,validator:this.timeValidator
			,enableKeyEvents:true
            ,listeners:{
                  blur:{scope:this, fn:this.onBlur}
				 ,keypress:{scope:this, fn:this.onBlur}
                 ,focus:{scope:this, fn:this.onFocus}
            }
        }, this.timeConfig);
        this.tf = new Ext.form.TimeField(timeConfig);
        this.tf.ownerCt = this;
        delete(this.timeFormat);

        // relay events
        this.relayEvents(this.df, ['focus', 'specialkey', 'invalid', 'valid']);
        this.relayEvents(this.tf, ['focus', 'specialkey', 'invalid', 'valid']);

        this.on('specialkey', this.onSpecialKey, this);
		
    } // eo function initComponent
    // }}}
    // {{{
    /**
     * @private
     * Renders underlying DateField and TimeField and provides a workaround for side error icon bug
     */
    ,onRender:function(ct, position) {
        // don't run more than once
        if(this.isRendered) {
            return;
        }

        // render underlying hidden field
        Ext.ux.form.DateTime.superclass.onRender.call(this, ct, position);

        // render DateField and TimeField
        // create bounding table
        var t;
        if('below' === this.timePosition || 'bellow' === this.timePosition) {
            t = Ext.DomHelper.append(ct, {tag:'table',style:'border-collapse:collapse',children:[
                 {tag:'tr',children:[{tag:'td', style:'padding-bottom:1px', cls:'ux-datetime-date'}]}
                ,{tag:'tr',children:[{tag:'td', cls:'ux-datetime-time'}]}
            ]}, true);
        }
        else {
            t = Ext.DomHelper.append(ct, {tag:'table',style:'border-collapse:collapse',children:[
                {tag:'tr',children:[
                    {tag:'td',style:'padding-right:4px', cls:'ux-datetime-date'},{tag:'td', cls:'ux-datetime-time'}
                ]}
            ]}, true);
        }

        this.tableEl = t;
        this.wrap = t.wrap({cls:'x-form-field-wrap'});
//        this.wrap = t.wrap();
        this.wrap.on("mousedown", this.onMouseDown, this, {delay:10});

        // render DateField & TimeField
        this.df.render(t.child('td.ux-datetime-date'));
        this.tf.render(t.child('td.ux-datetime-time'));

        // workaround for IE trigger misalignment bug
        // see http://extjs.com/forum/showthread.php?p=341075#post341075
//        if(Ext.isIE && Ext.isStrict) {
//            t.select('input').applyStyles({top:0});
//        }

        this.df.el.swallowEvent(['keydown', 'keypress']);
        this.tf.el.swallowEvent(['keydown', 'keypress']);

        // create icon for side invalid errorIcon
        if('side' === this.msgTarget) {
            var elp = this.el.findParent('.x-form-element', 10, true);
            if(elp) {
                this.errorIcon = elp.createChild({cls:'x-form-invalid-icon'});
            }

            var o = {
                 errorIcon:this.errorIcon
                ,msgTarget:'side'
                ,alignErrorIcon:this.alignErrorIcon.createDelegate(this)
            };
            Ext.apply(this.df, o);
            Ext.apply(this.tf, o);
//            this.df.errorIcon = this.errorIcon;
//            this.tf.errorIcon = this.errorIcon;
        }

        // setup name for submit
        this.el.dom.name = this.hiddenName || this.name || this.id;

        // prevent helper fields from being submitted
        this.df.el.dom.removeAttribute("name");
        this.tf.el.dom.removeAttribute("name");

        // we're rendered flag
        this.isRendered = true;

        // update hidden field
        this.updateHidden();

    } // eo function onRender
    // }}}
    // {{{
    /**
     * @private
     */
    ,adjustSize:Ext.BoxComponent.prototype.adjustSize
    // }}}
    // {{{
    /**
     * @private
     */
    ,alignErrorIcon:function() {
        this.errorIcon.alignTo(this.tableEl, 'tl-tr', [2, 0]);
    }
    // }}}
    // {{{
    /**
     * @private initializes internal dateValue
     */
    ,initDateValue:function() {
        this.dateValue = this.otherToNow ? new Date() : new Date(1970, 0, 1, 0, 0, 0);
    }
    // }}}
    // {{{
    /**
     * Calls clearInvalid on the DateField and TimeField
     */
    ,clearInvalid:function(){
        this.df.clearInvalid();
        this.tf.clearInvalid();
    } // eo function clearInvalid
    // }}}
    // {{{
    /**
     * Calls markInvalid on both DateField and TimeField
     * @param {String} msg Invalid message to display
     */
    ,markInvalid:function(msg){
        this.df.markInvalid(msg);
        this.tf.markInvalid(msg);
    } // eo function markInvalid
    // }}}
    // {{{
    /**
     * @private
     * called from Component::destroy. 
     * Destroys all elements and removes all listeners we've created.
     */
    ,beforeDestroy:function() {
        if(this.isRendered) {
//            this.removeAllListeners();
            this.wrap.removeAllListeners();
            this.wrap.remove();
            this.tableEl.remove();
            this.df.destroy();
            this.tf.destroy();
        }
    } // eo function beforeDestroy
    // }}}
    // {{{
    /**
     * Disable this component.
     * @return {Ext.Component} this
     */
    ,disable:function() {
        if(this.isRendered) {
            this.df.disabled = this.disabled;
            this.df.onDisable();
            this.tf.onDisable();
        }
        this.disabled = true;
        this.df.disabled = true;
        this.tf.disabled = true;
        this.fireEvent("disable", this);
        return this;
    } // eo function disable
    // }}}
    // {{{
    /**
     * Enable this component.
     * @return {Ext.Component} this
     */
    ,enable:function() {
        if(this.rendered){
            this.df.onEnable();
            this.tf.onEnable();
        }
        this.disabled = false;
        this.df.disabled = false;
        this.tf.disabled = false;
        this.fireEvent("enable", this);
        return this;
    } // eo function enable
    // }}}
    // {{{
    /**
     * @private Focus date filed
     */
    ,focus:function() {
        this.df.focus();
    } // eo function focus
    // }}}
    // {{{
    /**
     * @private
     */
    ,getPositionEl:function() {
        return this.wrap;
    }
    // }}}
    // {{{
    /**
     * @private
     */
    ,getResizeEl:function() {
        return this.wrap;
    }
    // }}}
    // {{{
    /**
     * @return {Date/String} Returns value of this field
     */
    ,getValue:function() {
        // create new instance of date
        return this.dateValue ? new Date(this.dateValue) : '';
    } // eo function getValue
    // }}}
    // {{{
    /**
     * @return {Boolean} true = valid, false = invalid
     * @private Calls isValid methods of underlying DateField and TimeField and returns the result
     */
    ,isValid:function() {
        return this.df.isValid() && this.tf.isValid();
    } // eo function isValid
    // }}}
    // {{{
    /**
     * Returns true if this component is visible
     * @return {boolean} 
     */
    ,isVisible : function(){
        return this.df.rendered && this.df.getActionEl().isVisible();
    } // eo function isVisible
    // }}}
    // {{{
    /** 
     * @private Handles blur event
     */
    ,onBlur:function(f) {
        // called by both DateField and TimeField blur events

        // revert focus to previous field if clicked in between
        if(this.wrapClick) {
            f.focus();
            this.wrapClick = false;
        }

        // update underlying value
        if(f === this.df) {
            this.updateDate();
        }
        else {
            this.updateTime();
        }
        this.updateHidden();

        this.validate();

        // fire events later
        (function() {
            if(!this.df.hasFocus && !this.tf.hasFocus) {
                var v = this.getValue();
                if(String(v) !== String(this.startValue)) {
                    this.fireEvent("change", this, v, this.startValue);
                }
                this.hasFocus = false;
                this.fireEvent('blur', this);
            }
        }).defer(100, this);

    } // eo function onBlur
    // }}}
    // {{{
    /**
     * @private Handles focus event
     */
    ,onFocus:function() {
        if(!this.hasFocus){
            this.hasFocus = true;
            this.startValue = this.getValue();
            this.fireEvent("focus", this);
        }
    }
    // }}}
    // {{{
    /**
     * @private Just to prevent blur event when clicked in the middle of fields
     */
    ,onMouseDown:function(e) {
        if(!this.disabled) {
            this.wrapClick = 'td' === e.target.nodeName.toLowerCase();
        }
    }
    // }}}
    // {{{
    /**
     * @private
     * Handles Tab and Shift-Tab events
     */
    ,onSpecialKey:function(t, e) {
        var key = e.getKey();
        if(key === e.TAB) {
            if(t === this.df && !e.shiftKey) {
                e.stopEvent();
                this.tf.focus();
            }
            if(t === this.tf && e.shiftKey) {
                e.stopEvent();
                this.df.focus();
            }
            this.updateValue();
        }
        // otherwise it misbehaves in editor grid
        if(key === e.ENTER) {
			this.tf.setValue(this.tf.getRawValue()); // Added by Peter (4-1-2012) to accept for different times than in the dropdown
            this.updateValue();
        }

    } // eo function onSpecialKey
    // }}}
    // {{{
    /**
     * Resets the current field value to the originally loaded value 
     * and clears any validation messages. See Ext.form.BasicForm.trackResetOnLoad
     */
    ,reset:function() {
		// commented-out by PP [14-05-2012]
		/*
        this.df.setValue(this.originalValue);
        this.tf.setValue(this.originalValue);
        */
    } // eo function reset
    // }}}
    // {{{
    /**
     * @private Sets the value of DateField
     */
    ,setDate:function(date) {
        this.df.setValue(date);
    } // eo function setDate
    // }}}
    // {{{
    /** 
     * @private Sets the value of TimeField
     */
    ,setTime:function(date) {
        this.tf.setValue(date);
    } // eo function setTime
    // }}}
    // {{{
    /**
     * @private
     * Sets correct sizes of underlying DateField and TimeField
     * With workarounds for IE bugs
     */
    ,setSize:function(w, h) {
        if(!w) {
            return;
        }
        if('below' === this.timePosition) {
            this.df.setSize(w, h);
            this.tf.setSize(w, h);
            if(Ext.isIE) {
                this.df.el.up('td').setWidth(w);
                this.tf.el.up('td').setWidth(w);
            }
        }
        else {
            this.df.setSize(w - this.timeWidth - 4, h);
            this.tf.setSize(this.timeWidth, h);

            if(Ext.isIE) {
                this.df.el.up('td').setWidth(w - this.timeWidth - 4);
                this.tf.el.up('td').setWidth(this.timeWidth);
            }
        }
    } // eo function setSize
    // }}}
    // {{{
    /**
     * @param {Mixed} val Value to set
     * Sets the value of this field
     */
    ,setValue:function(val) {
        if(!val && true === this.emptyToNow) {
            this.setValue(new Date());
            return;
        }
        else if(!val) {
            this.setDate('');
            this.setTime('');
            this.updateValue();
            return;
        }
        if ('number' === typeof val) {
          val = new Date(val);
        }
        else if('string' === typeof val && this.hiddenFormat) {
            val = Date.parseDate(val, this.hiddenFormat);
        }
        val = val ? val : new Date(1970, 0 ,1, 0, 0, 0);
        var da;
        if(val instanceof Date) {
            this.setDate(val);
            this.setTime(val);
            this.dateValue = new Date(Ext.isIE ? val.getTime() : val);
        }
        else {
            da = val.split(this.dtSeparator);
            this.setDate(da[0]);
            if(da[1]) {
                if(da[2]) {
                    // add am/pm part back to time
                    da[1] += da[2];
                }
                this.setTime(da[1]);
            }
        }
        this.updateValue();
    } // eo function setValue
    // }}}
    // {{{
    /**
     * Hide or show this component by boolean
     * @return {Ext.Component} this
     */
    ,setVisible: function(visible){
        if(visible) {
            this.df.show();
            this.tf.show();
        }else{
            this.df.hide();
            this.tf.hide();
        }
        return this;
    } // eo function setVisible
    // }}}
    //{{{
    ,show:function() {
        return this.setVisible(true);
    } // eo function show
    //}}}
    //{{{
    ,hide:function() {
        return this.setVisible(false);
    } // eo function hide
    //}}}
    // {{{
    /**
     * @private Updates the date part
     */
    ,updateDate:function() {

        var d = this.df.getValue();
        if(d) {
            if(!(this.dateValue instanceof Date)) {
                this.initDateValue();
                if(!this.tf.getValue()) {
                    this.setTime(this.dateValue);
                }
            }
            this.dateValue.setMonth(0); // because of leap years
            this.dateValue.setFullYear(d.getFullYear());
            this.dateValue.setMonth(d.getMonth(), d.getDate());
//            this.dateValue.setDate(d.getDate());
        }
        else {
            this.dateValue = '';
            this.setTime('');
        }
    } // eo function updateDate
    // }}}
    // {{{
    /**
     * @private
     * Updates the time part
     */
    ,updateTime:function() {
        var t = this.tf.getValue();
        if(t && !(t instanceof Date)) {
            t = Date.parseDate(t, this.tf.format);
        }
        if(t && !this.df.getValue()) {
            this.initDateValue();
            this.setDate(this.dateValue);
        }
        if(this.dateValue instanceof Date) {
            if(t) {
                this.dateValue.setHours(t.getHours());
                this.dateValue.setMinutes(t.getMinutes());
                this.dateValue.setSeconds(t.getSeconds());
            }
            else {
                this.dateValue.setHours(0);
                this.dateValue.setMinutes(0);
                this.dateValue.setSeconds(0);
            }
        }
    } // eo function updateTime
    // }}}
    // {{{
    /**
     * @private Updates the underlying hidden field value
     */
    ,updateHidden:function() {
        if(this.isRendered) {
            var value = this.dateValue instanceof Date ? this.dateValue.format(this.hiddenFormat) : '';
            this.el.dom.value = value;
        }
    }
    // }}}
    // {{{
    /**
     * @private Updates all of Date, Time and Hidden
     */
    ,updateValue:function() {

        this.updateDate();
        this.updateTime();
        this.updateHidden();

        return;
    } // eo function updateValue
    // }}}
    // {{{
    /**
     * @return {Boolean} true = valid, false = invalid
     * calls validate methods of DateField and TimeField
     */
    ,validate:function() {
        return this.df.validate() && this.tf.validate();
    } // eo function validate
    // }}}
    // {{{
    /**
     * Returns renderer suitable to render this field
     * @param {Object} Column model config
     */
    ,renderer: function(field) {
        var format = field.editor.dateFormat || Ext.ux.form.DateTime.prototype.dateFormat;
        format += ' ' + (field.editor.timeFormat || Ext.ux.form.DateTime.prototype.timeFormat);
        var renderer = function(val) {
            var retval = Ext.util.Format.date(val, format);
            return retval;
        };
        return renderer;
    } // eo function renderer
    // }}}

}); // eo extend

// register xtype
Ext.reg('xdatetime', Ext.ux.form.DateTime);

// Added by Harmen :-) @ 11 March 2014
Ext.apply(Ext.ux.form.DateTime.prototype, {
	dateFormat : 'd F Y',
	timeFormat : 'H:i:s'
});		

/**
 * 
 */
Garp.MapWindow = Ext.extend(Ext.Window,{
	
	width: 800,
	height: 440,
	modal: true,
	iconCls: 'icon-map',
	maximizable: true,
	frame: true,
	title: __('Map'),
	buttonAlign: 'left',
	
	/**
	 * @cfg lat
	 * contains the name of the latitude field
	 */
	'lat': null,
	/**
	 * @cfg long
	 * contains the name of the longitude field
	 */
	'long': null,
	/**
	 * @cfg long
	 * contains the ref to the address box
	 */
	'address': null,
	
	/**
	 * @cfg fieldRef
	 * pointer to common container for both location fields
	 */
	fieldRef: null,
	
	// Private variables //
	map: null,
	pointer: null,
	latlng: null,
	
	/**
	 * @function buildPointer
	 * builds the dragable pointer, and add's an event listener on it's drag event
	 */
	buildPointer: function(){
		this.pointer = new google.maps.Marker({
			position: this.latlng,
			animation: google.maps.Animation.DROP,
			draggable: true
		});
		var scope = this;
		google.maps.event.addListener(this.pointer, 'dragend', function(e){
			scope.latlng = e.latLng;
			scope.map.setCenter(e.latLng);
		});
		this.pointer.setMap(this.map);

	},
	
	/**
	 * @function addLocation
	 * adds the pointer (= the location) to the map
	 */
	addLocation: function(){
		this.latlng = this.map.getCenter();
		this.buildPointer();
		this.pointer.setMap(this.map);
		this.addLocationBtn.hide();
		this.removeLocationBtn.show();
	},
	
	/**
	 * @function removeLocation
	 * removes the location & pointer from the map
	 */
	removeLocation: function(){
		if (this.pointer) {
			this.pointer.setMap(null); // removes it
		}
		this.addLocationBtn.show();
		this.removeLocationBtn.hide();
	},
	
	/**
	 * @function drawMap
	 */
	drawMap: function(){
		this.map = new google.maps.Map(this.body.dom, {
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			zoom: 11 // @TODO: should this be overridable?
		});
		if (this.pointer) {
			this.map.setCenter(this.latlng);
			this.pointer.setMap(this.map);
			this.removeLocationBtn.show();
			this.addLocationBtn.hide();
		} else {
			this.addLocationBtn.show();
			this.removeLocationBtn.hide();
		
			var lat = this.fieldRef.find('name', this['lat'])[0].getValue();
			var lng = this.fieldRef.find('name', this['long'])[0].getValue();
			if (lat && lng) {
				this.latlng = new google.maps.LatLng(lat, lng);
				this.map.setCenter(this.latlng);
				this.buildPointer();
			} else {
				this.map.setCenter(new google.maps.LatLng(52.3650012, 5.0692639)); // @TODO: (see this.map comment above)
			}
		}
	},
	
	// Init: //
	initComponent: function(){
		// <script type="text/javascript" src="http://maps.google.com/maps/api/js?sensor=false"></script>
		
		
		this.on({
			'afterrender': {
				scope: this,
				fn: function(){
					if (typeof google == 'undefined') {
						Garp.lazyLoad('//maps.googleapis.com/maps/api/js?sensor=false', this.drawMap.createDelegate(this));
					} else {
						this.drawMap();
					}
				}
			}
		}, {
			'resize': {
				fn: function(){
					if (this.map) {
						google.maps.event.trigger(this.map, 'resize');
					}
				}
			}
		});
		
		Ext.apply(this, {
			buttons: [{
				text: __('Add Location'),
				ref: '../addLocationBtn',
				hidden: true,
				handler: this.addLocation.createDelegate(this)
			}, {
				text: __('Remove Location'),
				ref: '../removeLocationBtn',
				hidden: true,
				handler: this.removeLocation.createDelegate(this)
			}, {
				text: __('Address Lookup'),
				iconCls: 'icon-search',
				scope: this,
				handler: function(){
					var scope = this;
					Ext.Msg.prompt(__('Address Lookup'), __('Please enter the address to lookup:'), function(btn, query){
						if (btn == 'ok' && query) {
							var geocoder = new google.maps.Geocoder();
							geocoder.geocode({
								address: query
							}, function(resp, status){
								if (status == 'OK' && resp.length) {
									scope.latlng = resp[0].geometry.location;
									scope.buildPointer();
									scope.drawMap();
									scope.addLocationBtn.hide();
									scope.removeLocationBtn.show();
								} else {
									Ext.Msg.alert(scope.title, __('Address not found'));
								}
							});
						}
					});
				}
			}, '->', {
				text: __('Ok'),
				scope: this,
				handler: function(){
					
					this.fieldRef.find('name', this['lat'])[0].setValue('' + this.latlng.lat()); // cast to string!
					this.fieldRef.find('name', this['long'])[0].setValue('' + this.latlng.lng());
					this.fieldRef.find('name', this['lat'])[0].fireEvent('change');
					this.fieldRef.find('name', this['long'])[0].fireEvent('change');
					this.close();
				}
			}, {
				text: __('Cancel'),
				scope: this,
				handler: this.close
			}]
		});
		
		Garp.MapWindow.superclass.initComponent.call(this);
	}
});
Ext.ns('Garp');

Garp.MapField = Ext.extend(Ext.form.FieldSet, {

	/**
	 * Defaults:
	 */
	latFieldname: 'location_lat',
	longFieldname: 'location_long',
	addressRef: 'location_address',
	fieldLabel: __('Location'),
	
	anchor: -30,
	layout: 'hbox',
	msgTarget: 'under',
	style: 'padding: 0;',
	
	/**
	 * updates the address textual representation of the lat/long combination
	 */
	updateAddress: function(){
		var owner = this.refOwner.refOwner;
		var lat = owner.getForm().findField(this.latFieldname);
		var lng = owner.getForm().findField(this.longFieldname);
		var address = owner.formcontent[this.addressRef];
		
		function updateAddress(){
			var geocoder = new google.maps.Geocoder();
			if (lat.getValue() && lng.getValue()) {
				//address.update(__('Searching location...'));
				
				geocoder.geocode({
					'latLng': new google.maps.LatLng(lat.getValue(), lng.getValue())
				}, function(results, status){
					if (status == google.maps.GeocoderStatus.OK) {
						if (results[0]) {
							address.update(Garp.renderers.geocodeAddressRenderer(results[0]));
						} else {
							address.update(__('Location set, but unknown'));
						}
					} else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
						address.update(__('Location set, but unknown'));
					} else {
						address.update(__('Unknown error occurred.'));
					}
				});
			} else {
				address.update(__('No location specified'));
			}
		}
		if (typeof google == 'undefined') {
			Garp.lazyLoad('http://maps.googleapis.com/maps/api/js?sensor=false', updateAddress);
		} else {
			updateAddress();
		}
		lat.on('change', updateAddress);
	},
	
	initComponent: function(ct){
		this.items = [{
			xtype: 'button',
			iconCls: 'icon-map',
			text: __('Map'),
			flex: 0,
			margins: '0 20 0 0',
			handler: function(){
				new Garp.MapWindow({
					fieldRef: this.ownerCt,
					'lat': this.latFieldname,
					'long': this.longFieldname
				}).show();
			},
			scope: this
		}, {
			name: this.latFieldname,
			fieldLabel: __('Location lat'),
			disabled: false,
			hidden: true,
			allowBlank: true,
			xtype: 'textfield'
		}, {
			name: this.longFieldname,
			fieldLabel: __('Location long'),
			disabled: false,
			hidden: true,
			allowBlank: true,
			xtype: 'textfield'
		}, {
			xtype: 'box',
			ref: '../../' + this.addressRef,
			flex: 0,
			margins: '4 20 0 0'
		}];
		Garp.MapField.superclass.initComponent.call(this, ct);
		this.on('show', this.updateAddress, this);
	}
});

Ext.reg('mapfield', Garp.MapField);
/**
 * Extended DisplayField to accept a custom renderer.
 * @param {Object} val
 */
Ext.ux.form.RederedDisplayField = Ext.extend(Ext.form.DisplayField,  {
   
	renderer: function(val){
		return val;
	},
	
    setRawValue : function(v){
		v = this.renderer(v);
		
        if(this.htmlEncode){
            v = Ext.util.Format.htmlEncode(v);
        }
        return this.rendered ? (this.el.dom.innerHTML = (Ext.isEmpty(v) ? '' : v)) : (this.value = v);
    }

});

Ext.reg('rendereddisplayfield', Ext.ux.form.RederedDisplayField);
/*!
 * Ext JS Library 3.2.1
 * Copyright(c) 2006-2010 Ext JS, Inc.
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.ns('Ext.ux.form');

/**
 * @class Ext.ux.form.FileUploadField
 * @extends Ext.form.TextField
 * Creates a file upload field.
 * @xtype fileuploadfield
 */
Ext.ux.form.FileUploadField = Ext.extend(Ext.form.TextField,  {
    /**
     * @cfg {String} buttonText The button text to display on the upload button (defaults to
     * 'Browse...').  Note that if you supply a value for {@link #buttonCfg}, the buttonCfg.text
     * value will be used instead if available.
     */
    buttonText: __('Browse&hellip;'),
    /**
     * @cfg {Boolean} buttonOnly True to display the file upload field as a button with no visible
     * text field (defaults to false).  If true, all inherited TextField members will still be available.
     */
    buttonOnly: false,
    /**
     * @cfg {Number} buttonOffset The number of pixels of space reserved between the button and the text field
     * (defaults to 3).  Note that this only applies if {@link #buttonOnly} = false.
     */
    buttonOffset: 3,
    /**
     * @cfg {Object} buttonCfg A standard {@link Ext.Button} config object.
     */

    // private
    readOnly: true,

    /**
     * @hide
     * @method autoSize
     */
    autoSize: Ext.emptyFn,

    // private
    initComponent: function(){
        Ext.ux.form.FileUploadField.superclass.initComponent.call(this);

        this.addEvents(
            /**
             * @event fileselected
             * Fires when the underlying file input field's value has changed from the user
             * selecting a new file from the system file selection dialog.
             * @param {Ext.ux.form.FileUploadField} this
             * @param {String} value The file value returned by the underlying file input field
             */
            'fileselected'
        );
    },

    // private
    onRender : function(ct, position){
        Ext.ux.form.FileUploadField.superclass.onRender.call(this, ct, position);

        this.wrap = this.el.wrap({cls:'x-form-field-wrap x-form-file-wrap'});
        this.el.addClass('x-form-file-text');
        this.el.dom.removeAttribute('name');
        this.createFileInput();

        var btnCfg = Ext.applyIf(this.buttonCfg || {}, {
            text: this.buttonText
        });
        this.button = new Ext.Button(Ext.apply(btnCfg, {
            renderTo: this.wrap,
            cls: 'x-form-file-btn' + (btnCfg.iconCls ? ' x-btn-icon' : '')
        }));

        if(this.buttonOnly){
            this.el.hide();
            this.wrap.setWidth(this.button.getEl().getWidth());
        }

        this.bindListeners();
        this.resizeEl = this.positionEl = this.wrap;
    },
    
    bindListeners: function(){
        this.fileInput.on({
            scope: this,
            mouseenter: function() {
                this.button.addClass(['x-btn-over','x-btn-focus']);
            },
            mouseleave: function(){
                this.button.removeClass(['x-btn-over','x-btn-focus','x-btn-click']);
            },
            mousedown: function(){
                this.button.addClass('x-btn-click');
            },
            mouseup: function(){
                this.button.removeClass(['x-btn-over','x-btn-focus','x-btn-click']);
            },
            change: function(){
                var v = this.fileInput.dom.value;
                this.setValue(v);
                this.fireEvent('fileselected', this, v);    
            }
        }); 
    },
    
    createFileInput : function() {
        this.fileInput = this.wrap.createChild({
            id: this.getFileInputId(),
            name: this.name||this.getId(),
            cls: 'x-form-file',
            tag: 'input',
            type: 'file',
            size: 1
        });
    },
    
    reset : function(){
		// Added by PP for i18n fieldset support; our parent may have removed us, so no reset is needed 
		if (this.fileInput) {
			this.fileInput.remove();
			this.createFileInput();
			this.bindListeners();
		}
        Ext.ux.form.FileUploadField.superclass.reset.call(this);
    },

    // private
    getFileInputId: function(){
        return this.id + '-file';
    },

    // private
    onResize : function(w, h){
        Ext.ux.form.FileUploadField.superclass.onResize.call(this, w, h);

        this.wrap.setWidth(w);

        if(!this.buttonOnly){
            w = this.wrap.getWidth() - this.button.getEl().getWidth() - this.buttonOffset;
            this.el.setWidth(w);
        }
    },

    // private
    onDestroy: function(){
        Ext.ux.form.FileUploadField.superclass.onDestroy.call(this);
        Ext.destroy(this.fileInput, this.button, this.wrap);
    },
    
    onDisable: function(){
        Ext.ux.form.FileUploadField.superclass.onDisable.call(this);
        this.doDisable(true);
    },
    
    onEnable: function(){
        Ext.ux.form.FileUploadField.superclass.onEnable.call(this);
        this.doDisable(false);

    },
    
    // private
    doDisable: function(disabled){
        this.fileInput.dom.disabled = disabled;
        this.button.setDisabled(disabled);
    },


    // private
    preFocus : Ext.emptyFn,

    // private
    alignErrorIcon : function(){
        this.errorIcon.alignTo(this.wrap, 'tl-tr', [2, 0]);
    }

});

Ext.reg('fileuploadfield', Ext.ux.form.FileUploadField);

// backwards compat
Ext.form.FileUploadField = Ext.ux.form.FileUploadField;

/**
 * @class UploadCombo
 * 
 * Displays an upload dialog when triggering the trigger button of the triggerfield
 * 
 * @extends Ext.form.TriggerField 
 * @author: Peter
 */

Ext.ns('Ext.ux.form');

Ext.ux.form.UploadCombo = Ext.extend(Ext.form.TriggerField, {
	
	title: __('Upload'),
	fieldLabel: __('File'),
	iconCls: 'icon-image',
	emptyText: __('Select file'),
	
	previewTpl: new Ext.Template('<img src="{0}uploads/images/{1}" title="{1}" style="max-width:400px;max-height:260px;" /><br><a href="{0}uploads/images/{1}" target="_blank">' + __('Download') + '&hellip;</a>'),
	uploadURL: BASE + 'g/content/upload',
	
	/**
	 * Displays the dialog
	 */
	showUploadDialog: function(){
		
		var previewBox = {
			ref: 'previewBox',
			hideMode: 'visibility',
			frame: true,
			hidden: true
		};
		
		if (this.getValue()) {
			Ext.apply(previewBox, {
				html: this.previewTpl.apply([BASE, this.getValue()]),
				style: 'overflow: auto;margin-bottom: 10px;text-align:center;',
				height: 290,
				hidden: false
			});
		}
		
		this.win = new Ext.Window({
			modal: true,
			title: this.title,
			iconCls: this.iconCls,
			width: 450,
			height: (this.getValue() ? 420 : 130),
			border: false,
			items: [{
				xtype: 'form',
				ref: 'formpanel',
				fileUpload: true,
				border: false,
				frame: true,
				bodyStyle: 'padding: 10px 10px 0 10px',
				items: [ previewBox, {
					anchor: '95%',
					value: this.value,
					height: 40,
					name: 'file',
					fieldLabel: this.fieldLabel,
					allowBlank: false,
					buttonText: __('Browse&hellip;'),
					hideFieldLabel: true,
					emptyText: this.emptyText,
					listeners: {
						'fileselected': this.performUpload.createDelegate(this)
					},
					xtype: 'fileuploadfield'
				}]
			}],
			buttons: [/*{
				text: __('Upload'),
				handler: this.performUpload.createDelegate(this)
			}, */
			{
				text: __('Cancel'),
				scope: this,
				handler: function(){
					this.win.close();
				}
			}]
		});
		this.win.show();
		this.setupFileDrop();
	},
	
	/**
	 * Uploads the dialog's form's file input
	 */
	performUpload: function(){
		var form = this.win.formpanel.getForm();
		if (form.isDirty()) {
			var mask = new Ext.LoadMask(Ext.getBody(), {
				msg: __('Uploading...')
			});
			mask.show();
			var scope = this;
			form.submit({
				clientValidation: false,
				url: this.uploadURL,
				success: this.uploadCallback.createSequence(function(){
					mask.hide();
				}).createDelegate(this),
				failure: function(form, action){
					mask.hide();
					var msg = '';
					if (action && action.result && action.result.messages && action.result.messages.length) {
						msg = action.result.messages.join('<br />');
					}
					Ext.Msg.alert(__('Error'), '<b>' + __('Error uploading file') + '</b>:<br />' + msg);
					
				}
			});
		} else {
			this.win.close();
		}
	},
	
	/**
	 * Callback
	 * @param {Object} form
	 * @param {Object} action
	 */
	uploadCallback: function(form, action){
		this.win.close();
		if (action.result.file) {
			this.setValue(action.result.file);
		}
		this.fireEvent('change', this, action.result.file, '');
	},
	
	
	/**
	 * Sets up FF file d'n drop functionality
	 */
	setupFileDrop: function(){
		
		var el = this.win.getEl();
		var scope = this;
		
		function cancel(e){
			e.stopPropagation();
			e.preventDefault();
			return false;
		}
		
		function dropHandler(e){
			cancel(e);
			e = e.browserEvent;
			
			function randNumber(digits){
				var out = '';
				for (var i = 0; i < digits; i++) {
					out += '' + Math.floor(Math.random() * 10);
				}
				return out;
			}
			
			var wait = new Ext.LoadMask(scope.win.getEl(), __('Uploading...'));
			
			if (e.dataTransfer && e.dataTransfer.files) {
				var file = e.dataTransfer.files[0];
				var reader = new FileReader();
				reader.onload = function(e) {
  					var bin = e.target.result;
					var xhr = new XMLHttpRequest();
					var header = '', footer = '';
					var lf = '\r\n';

					xhr.addEventListener('load', function(e){
						wait.hide();
						var result = Ext.decode(e.target.responseText);
						var action = {
							result: result
						};
						scope.uploadCallback.call(scope, null, action);
					}, false);

					var boundary = '---------------------------' + randNumber(13);

					xhr.open('POST', scope.uploadURL, true);
					xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
					xhr.setRequestHeader('Content-Length', file.fileSize);
					
					header += '--' + boundary + lf;
					header += 'Content-Disposition: form-data; name="file"; filename="' + file.fileName + '"' + lf + lf;
					footer = lf + '--' + boundary + '--' + lf; 
					
					xhr.sendAsBinary(header + '' + bin + '' +  footer);
					wait.show();
				};
				reader.readAsBinaryString(file);	
			}
			return false;
		}
		
		Ext.EventManager.on(el, 'dragenter', function(e){
			el.highlight();
			cancel(e);
		});
		Ext.EventManager.on(el, 'dragexit', cancel);
		Ext.EventManager.on(el, 'dragover', cancel);
		Ext.EventManager.on(el, 'drop', dropHandler);
	},
	
	/**
	 * Override
	 */
	onTriggerClick: function(){
		this.showUploadDialog();
	},
	
	/**
	 * Override, because MySQL null values != ''
	 */
	getValue: function(){
		var val = Ext.ux.form.UploadCombo.superclass.getValue.call(this);
		if(!val){
			val = null;
		}
		return val;
	},
	
	/**
	 * Init
	 */
	initComponent: function(){
		Ext.ux.form.UploadCombo.superclass.initComponent.call(this, arguments);
	}
});

Ext.reg('uploadcombo', Ext.ux.form.UploadCombo);

Ext.ns('Ext.ux.form');

Ext.ux.form.UploadField = Ext.extend(Ext.ux.form.FileUploadField, {
	/**
	 * Max surface area (example size 3000 x 2000)
	 */
	maxSurface: 6000000,

	/**
	 * @cfg uploadURL
	 */
	uploadURL: BASE + 'g/content/upload',
	
	/**
	 * @cfg supportedExtensions
	 */
	supportedExtensions: ['gif', 'jpg', 'jpeg', 'png'],
	
	/**
	 * Override, because MySQL null values != ''
	 */
	getValue: function(){
		var val = Ext.ux.form.UploadCombo.superclass.getValue.call(this);
		if (!val) {
			val = null;
		}
		return val;
	},
	
	/**
	 * Simple name based check
	 * @param {Object} fileName
	 */
	validateExtension: function(fileName){
		var extension = fileName.split('.');
		if (!extension) {
			return false;
		}
		extension = extension[extension.length - 1];
		var name = extension[0];
		if (!name.length) {
			return false; // also dont support files with an extension but no name 
		}
		return this.supportedExtensions.indexOf(extension.toLowerCase()) > -1;
	},

	/**
	 * Validate resolution
	 */
	validateResolution: function(file, callback) {
		// What to do for browsers with no FileReader support, such as IE9?
		// For now, let's just admit defeat and allow the upload.
		if (typeof FileReader !== 'function') {
			callback(true);
			return;
		}
		var fr = new FileReader();
		var scope = this;
		fr.onload = function() {   // onload fires after reading is complete
			var img = new Image();
			img.onload = function() {
				var surface = img.width * img.height;
				var success = surface <= scope.maxSurface;
				callback(success);
			};
			img.src = fr.result;
		};
		fr.readAsDataURL(file);    // begin reading
	},

	/**
	 * Drop Handler
	 * @param {Object} e
	 */
	handleFileDrop: function(e){
		this.wrap.removeClass('x-focus');
		if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length == 1) {
			this.performUpload(e.dataTransfer.files[0]);
		}
		return false;
	},
	
	/**
	 * Button Handler
	 */
	handleFileSelect: function(){
		this.performUpload(this.fileInput);
	},

	/**
	 * See if upload is image
	 */
	isImage: function(file) {
		var extension = file.name.split('.').pop();
		if (!extension) {
			return false;
		}

		var img_extensions = ['jpg', 'jpeg', 'png', 'gif'];
		for (var i = 0, ii = img_extensions.length; i < ii; ++i) {
			if (img_extensions[i] === extension) {
				return true;
			}
		}
		return false;
	},
	
	/**
	 * Check extension and go!
	 * @param {Object} fileInput field
	 */
	performUpload: function(fileInput){
		var scope = this;
		
		if (Ext.isIE) {
			
			var lm = new Ext.LoadMask(Ext.getBody(),{
				msg: __('Loading')
			});
			lm.show();
			var dh = Ext.DomHelper;
			var iframe = Ext.get(dh.insertHtml('beforeEnd', Ext.getBody().dom, '<iframe src="javscript:false;" name="uploadFrame" style="display:none;"></iframe>'));
			var form = Ext.get(dh.insertHtml('beforeEnd', Ext.getBody().dom, '<form method="post" target="uploadFrame" action="' + this.uploadURL + '" enctype="multipart/form-data"></form>'));
			Ext.get(fileInput).appendTo(form);
			iframe.on('load', function(){
				
				var result = Ext.decode(iframe.dom.contentDocument.body.innerHTML);
				if(!result || !result.success){
					//scope.setValue(scope.originalValue);
					Ext.Msg.alert(__('Garp'), __('Error uploading file.'));	
				} else {
					scope.setValue(result.filename);
					scope.fireEvent('change', scope, result.filename);
				}
				
				form.remove();
				iframe.remove();
				lm.hide();
				
				
			});
			form.dom.submit();				
			
		} else {
			var file;
			if (fileInput.dom && fileInput.dom.files) {
				file = fileInput.dom.files[0];
			} else {
				file = fileInput;//.dom.files[0];
			}
			if (!file || !file.name) {
				return;
			}

			var error = function(label, message) {
				scope.setValue(scope.originalValue);
				Ext.Msg.alert(label || __('Garp'), message || __('Error uploading file.'));
			};

			var proceedToUpload = function(success) {
				if (!success) {
					var readableMaxSurface = Ext.util.Format.number(scope.maxSurface, "1000.000/i");
					var exampleA = Math.floor(Math.sqrt(scope.maxSurface));
					// round to nearest 1000
					exampleA = Math.round((exampleA + 500) / 1000) * 1000;
					var exampleB = Math.floor(scope.maxSurface / exampleA);
					error(__('Error'), '<b>' + __('Resolution too high. ' + 
							'Please make sure the image\'s surface area does not exceed ' + readableMaxSurface) + 
							' pixels. <br>For instance: ' + exampleA + ' x ' + exampleB + ' pixels.</b>');

				} else if (!scope.validateExtension(file.name)) {

					error(__('Error'),
						'<b>' + __('Extension not supported') + '</b><br /><br />' +
						__('Supported extensions are:') + '<br /> ' + scope.supportedExtensions.join(' ')
					);
					
				} else {
					var fd = new FormData();
					var xhr = new XMLHttpRequest();
					scope.uploadDialog = Ext.Msg.progress(__('Upload'), __('Initializing upload'));
					
					fd.append('filename', file);
					
					xhr.addEventListener('load', function(e){
						var response = Ext.decode(xhr.responseText);
						scope.uploadDialog.hide();
						if (response.success) {
							scope.setValue(response.filename);
							scope.fireEvent('change', scope, response.filename);
						} else {
							error();
						}
					}, false);
					xhr.addEventListener('error', function(e){
						scope.uploadDialog.hide();
						error();
					}, false);
					xhr.upload.addEventListener('progress', function(e){
						if (e.lengthComputable) {
							scope.uploadDialog.updateProgress(e.loaded / e.total);
							scope.uploadDialog.updateText(__('Uploading') + ' ' + (Math.ceil(e.loaded / e.total * 100)) + '%');
						}
					}, false);
					
					xhr.open('POST', scope.uploadURL);
					scope.uploadDialog.updateText(__('Uploading&hellip;'));
					
					// we'll use a timeout to be sure that the dialog is ready, small downloads otherwise result in an ugly flashy UX
					setTimeout(function(){
						xhr.send(fd);
					}, 350);
					
				}
			};

			if (this.isImage(file)) {
				this.validateResolution(file, proceedToUpload);
			} else {
				proceedToUpload(true);
			}
		}
	},
	
	/**
	 * sets up Drag 'n Drop
	 */
	setupDnD: function(){
	
		var opts = {
			normalized: false,
			preventDefault: true,
			stopPropagation: true
		};
		
		this.wrap.on('dragenter', function(e){
			// unfortunately, we can't grab file extension here, so we'll present it as allowed. On drop we'll check extensions 
			this.wrap.addClass('x-focus');
		}, this, opts);
		
		this.wrap.on('dragexit', function(e){
			this.wrap.removeClass('x-focus');
		}, this, opts);
		
		this.wrap.on('dragover', function(e){
		}, this, opts);
		
		this.wrap.on('drop', function(e){
			this.handleFileDrop(e);
		}, this, opts);
	},
	
	onDestroy: function(){
		if (this.uploadDialog) {
			this.uploadDialog.hide();
		}
		Ext.ux.form.UploadField.superclass.onDestroy.call(this);
	},
	
	initComponent: function(){
		this.on('fileselected', this.handleFileSelect, this);
		Ext.ux.form.UploadField.superclass.initComponent.call(this, arguments);
		this.on('afterrender', this.setupDnD, this);
	}
});

Ext.reg('uploadfield', Ext.ux.form.UploadField);

/**
 * @class PagingSearchBar
 * 
 * PagingToolbar with searchfield and option menu
 * 
 * @extends Ext.PagingToolbar   
 * @author: Peter
 */

Ext.ns('Ext.ux');

Ext.ux.PagingSearchBar = Ext.extend(Ext.PagingToolbar, {

	/**
	 * @cfg height
	 * fixed to enable show/hide
	 *
	 * @TODO: Not sure why we need to hardcode this. Bug in Ext?
	 */
	height: 27,
	
	/**
	 * @cfg displayInfo
	 * override pagingtoolbar defaults:
	 */
	displayInfo: true,
	
	/**
	 * @cfg enableOverflow
	 * override pagingtoolbar defaults:
	 */
	enableOverflow: true,
	
	/**
	 * @cfg grid
	 * reference to the gridpanel this toolbar is bound to:
	 */
	grid: null,
	
	
	/**
	 * @function _setSearchFieldWidth
	 * @private
	 *
	 * sets the width of the searchfield
	 */
	_resizeSearchFieldWidth: function(){
		var w = this.getWidth();
		 
		if (this.searchField) {
			var margin = this.displayInfo ? 460 : 230;
			this.searchField.setWidth(w - margin);
			
			if(w< 320){
				this.searchoptionsbtn.hide();
			} else {
				this.searchoptionsbtn.show();	
			}
		}
	},
	
	/**
	 * @function makeQuery
	 * 
	 * preserves possible "Model.id" queryStrings for relatePanel
	 * 
	 * @param {Object} queryStr
	 */
	makeQuery: function(queryStr){
		var q = this.grid.store.baseParams.query;
		var dt = new Ext.util.MixedCollection();
		dt.addAll(Garp.dataTypes);
		var preserve = {};
		
		if(Ext.isObject(q)){
			dt.eachKey(function(key){
				key = key + '.id';
				if(q[key]){
					preserve[key] = q[key]; 
				}
			});
		}
		this.grid.store.baseParams.query = Ext.apply(this.convertQueryString(queryStr, this.getSelectedSearchFields()), preserve);
		this.moveFirst();
	},
	
	/**
	 * @function convertQueryString
	 * converts string to object
	 * @param {String} query
	 * @return {Object}
	 */
	convertQueryString: function(query, fields){
		if (query === '') {
			return {};
		}
		var q = '%' + query + '%';
		var obj = {};
		Ext.each(fields, function(f){
			obj[f + ' like'] = q;
		});
		return {
			'or': obj
		};
	},
	
	/**
	 * @function getSelectedSearchFields
	 * @return {Array} fields
	 */
	getSelectedSearchFields: function(){
		var fields = [];
		if (this.searchOptionsMenu) {
			Ext.each(this.searchOptionsMenu.items.items, function(item){
				if (item.xtype === 'menucheckitem' && item.checked && item._dataIndex) {
					fields.push(item._dataIndex);
				}
			});
		}
		return fields;
	},
	
	/**
	 * @function getAllSearchFields
	 * @return {Array} all fields searchable
	 */
	getAllSearchFields: function(){
		var fields = [];
		if(!this.grid) return;
		Ext.each(this.grid.getColumnModel().config, function(col){
			if (col.dataIndex !== 'relationMetadata') {
				fields.push(col);
			}
		});
		return fields;
	},
	
	/**
	 * searchOptionsMenu
	 * The search options menu (Placeholder. It will get rebuild later, when the grid finishes loading):
	 */
	searchOptionsMenu: new Ext.menu.Menu({
		items: {
			xtype: 'menutextitem',
			cls: 'garp-searchoptions-menu',
			text: Ext.PagingToolbar.prototype.emptyMsg
		}
	}),
	
	/**
	 * @function buildSearchOptionsMenu
	 */
	buildSearchOptionsMenu: function(){
		var fields = this.getAllSearchFields();
		var menuItems = [{
			xtype: 'menutextitem',
			cls: 'garp-searchoptions-menu',
			text: __('Zoeken in:')
		}, '-'];
		Ext.each(fields, function(f){
			menuItems.push({
				text: f.header,
				_dataIndex: f.dataIndex
			});
		});
		this.searchOptionsMenu = new Ext.menu.Menu({
			defaults: {
				xtype: 'menucheckitem',
				hideOnClick: false,
				checked: true
			},
			items: menuItems
		});
	},
	
	/**
	 * @function initComponent
	 */
	initComponent: function(){
		
		// Build the options menu, when the grid finishes loading its data:
		this.store.on({
			'load': {
				scope: this,
				single: true,
				fn: function(){
					if (!this.grid) {
						this.grid = this.ownerCt; // Can this be done in a better way?	
					}
					this.buildSearchOptionsMenu();
				}
			}
		});
		
		// Add menu and searchfield to the toolbar: 
		var scope = this;
		this.items = ['->', ' ', {
			xtype: 'tbbutton',
			ref: 'searchoptionsbtn',
			iconCls: 'icon-searchoptions',
			cls: 'garp-searchoptions',
			tooltip: __('Zoekopties'),
			scope: this,
			handler: function(btn){
				this.searchOptionsMenu.show(btn.el);
			}
		}, this.searchField = new Ext.ux.form.SearchField({
			xtype: 'twintrigger',
			style: 'paddingLeft: 22px;',
			store: this.store,
			value: this.store.baseParams.query,
			listeners:{
				'change': function(){
					var v = this.getValue();
					if(v.length <1){
						this.removeClass('has-search');
					} else {
						this.addClass('has-search')
					}
					
				}
			},
			onTrigger1Click: function(){
				if (this.hasSearch) {
					this.triggers[0].hide();
					this.el.dom.value = '';
					scope.makeQuery('');
				}
			},
			onTrigger2Click: function(){
				var v = this.getRawValue();
				if (v.length < 1) {
					this.onTrigger1Click();
					return;
				}
				this.triggers[0].show();
				this.hasSearch = true;
				scope.makeQuery(v);
				
			},
			width: 80
		})];
		
		
		/**
		 * listen to various events:
		 */
		// Resize searchField:
		
		this.on({
			'resize': this._resizeSearchFieldWidth,
			'afterlayout': this._resizeSearchFieldWidth
		}, this);
		
		
		// Hide when not necessary:
		// Disabled. See JIRA issue [GARP-40]
		
		/*
		this.on('change', function(){
			if (this.store.getTotalCount() < this.pageSize) {
				if (this.searchField && this.searchField.getValue() == '') {
					if (!this.hidden) {
						this.hide();
						this.doLayout(false, true);
					}
				} else {
					if (this.hidden) {
						this.show();
						this.doLayout(false, true);
					}
				}
			}
		}, this);
		*/
		Ext.ux.PagingSearchBar.superclass.initComponent.call(this);
	},
	
	/**
	 * @function blur
	 * Extended blur to cause searchField to blur as well
	 */
	blur: function(){
		this.searchField.blur();
		Ext.ux.PagingSearchBar.superclass.blur.call(this);
	},
	
	/**
	 * @function afterRender
	 */
	afterRender: function(){
		var kn = new Ext.KeyNav(this.getEl(), {
			'esc': function(){
				this.blur();
				this.fireEvent('defocus');
			},
			scope: this
		});
		Ext.ux.PagingSearchBar.superclass.afterRender.call(this);
	}
});
 
 // register the component to allow lazy instantiating:
Ext.reg('pagingsearchbar', Ext.ux.PagingSearchBar); 
/*!
 * Ext JS Library 3.1.0
 * Copyright(c) 2006-2009 Ext JS, LLC
 * licensing@extjs.com
 * http://www.extjs.com/license
 */
Ext.ns('Ext.ux.form');

Ext.ux.form.SearchField = Ext.extend(Ext.form.TwinTriggerField, {
    initComponent : function(){
        Ext.ux.form.SearchField.superclass.initComponent.call(this);
        this.on('specialkey', function(f, e){
            if(e.getKey() == e.ENTER){
                this.onTrigger2Click();
				e.stopEvent();
            }
        }, this);
    },
	xtype: 'twintrigger',
    validationEvent:false,
    validateOnBlur:false,
    trigger1Class:'x-form-clear-trigger',
    trigger2Class:'x-form-search-trigger',
    hideTrigger1:true,
    //width:180,
    hasSearch : false,
    paramName : 'query',

	blur: function(){
		this.getEl().removeClass('x-form-focus');
		Ext.ux.form.SearchField.superclass.blur.call(this);
	},

    onTrigger1Click : function(){
        if(this.hasSearch){
            this.el.dom.value = '';
            var o = {start: 0};
            this.store.baseParams = this.store.baseParams || {};
            this.store.baseParams[this.paramName] = '';
            this.store.reload({params:o});
            this.triggers[0].hide();
            this.hasSearch = false;
        }
    },

    onTrigger2Click : function(){
        var v = this.getRawValue();
        if(v.length < 1){
            this.onTrigger1Click();
            return;
        }
        var o = {start: 0};
        this.store.baseParams = this.store.baseParams || {};
        this.store.baseParams[this.paramName] = v;
        this.store.reload({params:o});
        this.hasSearch = true;
        this.triggers[0].show();
    }
});

Ext.reg('twintrigger', Ext.ux.form.SearchField);

Ext.ns('Ext.ux.form');
/**
 * RichTextEditor extends on Ext.form.HtmlEditor
 *
 * For IE basic RTE only
 *
 * @author: Peter Schilleman, Engelswoord for Grrr.nl
 *
 */

if (Ext.isIE) {

    // Lightweight variant:
    Ext.ux.form.RichTextEditor = Ext.extend(Ext.form.HtmlEditor,{
        enableAlignments: false,
        enableBlockQuote: true,
        enableColors: false,
        enableEmbed: true,
        enableFont: false,
        enableFontSize: false,
        enableFormat: true,
        enableHeading: true,
        enableLists: true,
        enableDefinitionList: true,
        enableMedia: true,
        enableLinks: true,
        enableUnderline: false,
        enableSourceEdit: true,
        defaultHeadingTag: 'h2',

        defaultValue: '<p>&#8203;</p>',

        /**
         *
         * @param {Object} val
         */
        setValue: function(val){
            if (!val) {
                val = this.defaultValue;
            }
            Ext.ux.form.RichTextEditor.superclass.setValue.call(this, val);
        },
        /*
         * Override functions:
         */
        isDirty: function(){
			if (this.disabled || !this.rendered || !this.isVisible() || !this.getWin()) {
                return false;
            }
            return String(this.getValue()) !== String(this.originalValue);
        },
        getDocMarkup: function(){
            return '<html><head><link rel="stylesheet" href="' + BASE + '/css/garp/garp-richtexteditor.css" type="text/css"></head><body style="padding:0 !important;"></body></html>';
        },

        onRender: function(ct, position){
            Ext.ux.form.RichTextEditor.superclass.onRender.call(this, ct, position);

            this.statusbar = new Ext.Component({
                renderTo: this.wrap.dom,
                cls: 'x-toolbar garp-richtexteditor-statusbar',
                html: __('Internet Explorer mode: Not all options are available')
            });
        },

        /**
         * custom 'blur' event
         * @param {Object} e Ext event object
         * @param {Object} t DOM target
         */
        blur: function(e, t){
            if (!this.initialized) {
                return;
            }

            if (!this.hasFocus) {
                return;
            }

            // MIDAS still holds 'editing' state, so updateToolbar doesn't work. We'll unpress the toolbar buttons manually:
            var tbar = this.getToolbar();
            tbar.items.each(function(item){
                if (item.toggle) {
                    item.toggle(false);
                }
            });

            // if the clicked element is within the RTE component or when there's a dialog on screen, we do nothing.
            // Otherwise, we fire our blur event now:
            // Added: The clicked element must be within the formpanel. See [GARP] Ticket #314

            if (!t || (!Ext.WindowMgr.getActive()) && this.getEl().parent('.garp-formpanel') && !this.getEl().parent().contains(Ext.get(t).dom.id)) {
                this.hasFocus = false;
                this.fireEvent('blur', this);
                this.wrap.removeClass('x-focus');
                this.cleanupHtml();
                this.hideMediaToolbar();
                this.updateStatusbar('');
                //if (e && e.stopEvent) {
                //  e.stopEvent();
                //}
            }
        },

        /**
         * function initComponent
         */
        initComponent: function(){
            this.addEvents('toolbarupdated');

            Ext.ux.form.RichTextEditor.superclass.initComponent.call(this);

            this.on('initialize', function(){
                this.execCmd('styleWithCSS', false);
                this.execCmd('insertBrOnReturn', false, false);
                this.execCmd('enableObjectResizing', false); // Doesn't work for IE
                this.updateStatusbar('');
                this.setupImageHandling();
                this.getDoc().body.style.backgroundColor = 'transparent';
            }, this);
            this.on('editmodechange', function(c, mode){
                if (mode) {
                    this.addClass('garp-richtexteditor-source-edit');
                } else {
                    this.removeClass('garp-richtexteditor-source-edit');
                }
            }, this);

        },

        /**
         * unregister event handlers and such:
         */
        destroy: function(){
            Ext.getBody().un('click', this.blur, this);
        },

        /**
         * Protected method that will not generally be called directly. Pushes the value of the textarea
         * into the iframe editor.
         */
        pushValue: function(){
            if (this.initialized) {
                var v = this.el.dom.value;
                if (!this.activated && v.length < 1) {
                    v = this.defaultValue;
                }
                // we don't want to push values into textarea if the user is editing the textarea instead of the iframe
                if (this.sourceEditMode) {
                    return;
                }

                /*
                 * @FIXME: Not sure why beforepush causes problems, but disabling the event test
                 *         fixes a major problem with syncing the component.   -- Peter 7-9-2010
                 */
                //if(this.fireEvent('beforepush', this, v) !== false){
                this.getEditorBody().innerHTML = v;

                /*
                 if(Ext.isGecko){
                 // Gecko hack, see: https://bugzilla.mozilla.org/show_bug.cgi?id=232791#c8
                 // fixed (see url)
                 // -- Peter 12-5-2011
                 this.setDesignMode(false);  //toggle off first
                 this.setDesignMode(true);
                 }*/
                this.fireEvent('push', this, v);
                //}
                Ext.EventManager.on(this.getDoc(), 'keydown', function(e){
                    if (e.getKey() == e.TAB) {
                        this.blur(e, false);
                        return false;
                    }
                }, this);

            }
        }
    });

// // // // // // // // // // // // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // //
// // // // // // // // // // // // // // // // // // // // // // // // // // //

} else {

    Ext.ux.form.RichTextEditor = Ext.extend(Ext.form.HtmlEditor, {
        /**
         * custom config defaults:
         */
        enableAlignments: false,
        enableBlockQuote: true,
        enableColors: false,
        enableEmbed: true,
        enableFont: false,
        enableFontSize: false,
        enableFormat: true,
        enableHeading: true,
        enableLists: true,
        enableDefinitionList: true,
        enableMedia: true,
        enableLinks: false, // Ext   //@TODO: refactor to resolve 'conflicting' name
        enableLink: true, // Garp  //@TODO: refactor to resolve 'conflicting' name
        enableUnderline: false,
        enableSourceEdit: true,
        defaultHeadingTag: 'h2',

        maxLength: null,

        iframePad: 5,
        height: 500,
        showStatusbar: true,
        showCharCount: true,

        // used by 'blur' and editorEvent
        hasFocus: false,

        /**
         * @cfg {String} defaultValue A default value to be put into the editor to resolve focus issues (defaults to &#160; (Non-breaking space) in Opera and IE6, &#8203; (Zero-width space) in all other browsers).
         */
        //defaultValue: '<p style="display:none!important;height:0!important;"></p><p>&#8203;</p>', // (Ext.isOpera || Ext.isIE6) ? '<p>&#160;</p>' : '<p>&#8203;</p>',
        defaultValue: '<p>&#8203;</p>',
        //defaultValue: '',

        /*
         * custom functions
         */

        /**
         * Override getValue for emptyness sake
         */
        getValue: function(){
            var v = Ext.ux.form.RichTextEditor.superclass.getValue.call(this);
            if (v == '<p>​</p>') {
                return null;
            }
            return v;
        },

        /**
         *
         * @param {Object} val
         */
        setValue: function(val){
            if (!val) {
                val = this.defaultValue;
            }
            Ext.ux.form.RichTextEditor.superclass.setValue.call(this, val);
        },

        /**
         * function getRange
         *
         * @experimental
         *
         * @return the current mouse selected range
         */
        getRange: function(){
            var range, sel, container;
            var win = this.getWin();
            var doc = this.getDoc();

            sel = win.getSelection();
            if (sel.getRangeAt) {
                if (sel.rangeCount > 0) {
                    range = sel.getRangeAt(0);
                }
            } else {
                // Old WebKit
                range = doc.createRange();
                range.setStart(sel.anchorNode, sel.anchorOffset);
                range.setEnd(sel.focusNode, sel.focusOffset);

                // Handle the case when the selection was selected backwards (from the end to the start in the document)
                if (range.collapsed !== sel.isCollapsed) {
                    range.setStart(sel.focusNode, sel.focusOffset);
                    range.setEnd(sel.anchorNode, sel.anchorOffset);
                }
            }
            return range;
        },


        /**
         * function getSelection(void)
         * @return current selected text as range
         */
        getSelection: function(){
            var win = this.getWin();
            var ds = (typeof win.selection !== 'undefined' ? win.selection.createRange().text : (typeof win.getSelection === 'function') ? win.getSelection() : false);

            return ds;
        },

        /**
         * function findNode(tagName): finds a node with a specified tag
         *
         * @experimental
         *
         * @return node or nothing
         * @param {Object} tagName
         */
        findNode: function(tagName){
            tagName = tagName.toUpperCase();
            var range = this.getRange();
            if (!range) {
                return;
            }
            var out = null;
            Ext.each(['commonAncestorContainer', 'startContainer', 'endContainer'], function(container){
                var node = range[container];
                if (node.tagName && node.tagName === tagName) {
                    out = node;
                    return;
                }
                if (node.parentNode && node.parentNode.tagName === tagName) {
                    out = node.parentNode;
                    return;
                }
                if (node.previousSibling && node.previousSibling.tagName === tagName) {
                    out = node.previousSibling;
                    return;
                }
                if (node.children) {
                    Ext.each(node.children, function(childNode){
                        if (childNode.tagName && childNode.tagName === tagName) {
                            out = childNode;
                            return;
                        }
                    });
                    if (out) {
                        return out;
                    }
                }
            });
            return out;
        },


        /**
         * @description
         * @param {Object} tagName
         */
        createOrRemoveTag: function(tagName){
            var range = this.getRange();
            var sel = this.getSelection();
            if (!range || !sel) {
                return;
            }
            var newNode;
            var search = this.findNode(tagName);
            if (!search) {
                newNode = this.getDoc().createElement(tagName);
                newNode.appendChild(range.extractContents());
                range.insertNode(newNode);
                range.selectNode(newNode);
            } else {
                range.selectNode(search);
                var text = range.toString();
                newNode = this.getDoc().createTextNode(text);
                range.deleteContents();
                range.insertNode(newNode);
                range.selectNodeContents(newNode);
            }
            sel.removeAllRanges();
            sel.addRange(range);
            this.focus.defer(20, this);
        },

        /**
         * function addHeading
         * @description add a heading tag, surrounding the current selection.
         * @parameter type heading level
         */
        addHeading: function(type){
            if (!type) {
                type = this.defaultHeadingTag;
            }
            type = type.toUpperCase();
            this.createOrRemoveTag(type);
        },

        /**
         *
         */
        addBlockQuote: function(){
            var sel = this.getSelection();
            var nodeList = this.filterTagsOnly(this.walk(sel.focusNode, true));
            var found = false;
            Ext.each(nodeList, function(node){
                if (node.tagName.toUpperCase() == 'BLOCKQUOTE') {
                    found = true;
                }
            });
            if (found) {
                this.relayCmd('outdent');
            } else {
                this.relayCmd('formatblock', 'blockquote');
            }
        },

        /**
         * function addLink
         * @description display prompt and creates link on current selected text
         * @return void
         */
        addLink: function(){
            var url = null, // the href attribute for the link
 target = null, // targe might be _blank
 title = null, // title attribute
 currentNode = false; // possible existing anchor node, false to create a new 'A' tag
            var selText = this.getSelection().toString(); // the selected Text
            // find if there's an 'a' selected, if so: get its attributes:
            var nodes = this.walk(this.getRange().endContainer, true);
            Ext.each(nodes, function(node){
                if (node.tagName == 'A') {
                    url = decodeURIComponent(node.href);
                    target = node.target !== '' ? true : null;
                    title = node.title;
                    if (!selText) {
                        selText = node.textContent;
                    }
                    currentNode = node;
                    return false; // stop searching
                }
            });

            // Dialog for the new link:
            var dialog = new Ext.Window({
                title: __('Add link'),
                iconCls: 'icon-richtext-add-link',
                width: 445,
                modal: true,
                height: 240,
                border: true,
                layout: 'fit',
                defaultButton: '_url', // defaultButton can focus anything ;-)
                items: [{
                    xtype: 'fieldset',
                    bodyCssClass: 'garp-dialog-fieldset',
                    labelWidth: 160,
                    items: [{
                        xtype: 'textfield',
                        fieldLabel: __('Url'),
                        name: 'url',
                        id: '_url',
                        vtype: 'mailtoOrUrl',
                        allowBlank: false,
                        plugins: [Garp.mailtoOrUrlPlugin],
                        value: url || ''
                    }, {
                        xtype: 'textfield',
                        fieldLabel: __('Title'),
                        name: 'title',
                        value: title
                    }, {
                        xtype: 'checkbox',
                        allowBlank: true,
                        fieldLabel: __('Open in new window'),
                        name: 'target',
                        checked: target !== true ? true : false
                    }]
                }],
                buttonAlign: 'right',
                buttons: [{
                    text: __('Cancel'),
                    handler: function(){
                        dialog.close();
                    }
                }, {
                    text: __('Ok'),
                    ref: '../ok',
                    handler: function(){
                        var url = dialog.find('name', 'url')[0].getValue(), title = dialog.find('name', 'title')[0].getValue(), target = dialog.find('name', 'target')[0].getValue() == '1';
                        if (url) {
                            //target == '1' ? target = 'target="_blank"' : target = '';
                            if (!selText) {
                                selText = url;
                            }
                            if (currentNode) {
                                currentNode.setAttribute('href', url);
                                if (target) {
                                    currentNode.setAttribute('target', '_blank');
                                } else {
                                    currentNode.removeAttribute('target');
                                }
                                currentNode.setAttribute('title', title);
                            } else {
                                var sel = this.getSelection();
                                var range = this.getRange();
                                var nwLink = this.getDoc().createElement('a');
                                nwLink.setAttribute('href', url);
                                if (target) {
                                    nwLink.setAttribute('target', '_blank');
                                }
                                nwLink.setAttribute('title', title);
                                nwLink.appendChild(this.getDoc().createTextNode(selText));
                                range.deleteContents();
                                range.insertNode(nwLink);
                                range.selectNodeContents(nwLink);
                                sel.removeAllRanges();
                                sel.addRange(range);
                                //var nwLink = '<a href="' + url + '" ' + target + ' title="' + title + '">' + selText + '</a>&nbsp;';
                                //this.insertAtCursor(nwLink);
                            }
                        }
                        dialog.close();
                    },
                    scope: this
                }]
            });
            dialog.show();
            dialog.items.get(0).items.get(0).clearInvalid();

            var map = new Ext.KeyMap([dialog.find('name', 'url')[0].getEl(), dialog.find('name', 'title')[0].getEl()], {
                key: [10, 13],
                fn: function(){
                    dialog.ok.handler.call(this);
                },
                scope: this
            });

            this.tb.items.map.createlink.toggle(false); // depress addLink button
        },

        /**
         * Removes the selected element, while preserving undo (CMD-Z) functionality
         * @param {Ext element} el
         */
        removeSelection: function(el){
            this.getWin().focus();

            var sel = this.getSelection();
            var range = this.getRange();
            if (!range) {
                range = this.getDoc().createRange();
            }
            range.selectNode(el.dom);
            sel.removeAllRanges();
            sel.addRange(range);
            this.execCmd('delete');
        },

        /**
         * shows the image/media Toolbar at the specified element
         * @param {DOM Element} elm
         */
        showMediaToolbar: function(elm){
            var el = Ext.get(elm);
            var editorEl = Ext.get(this.iframe);
            var containTop = Garp.viewport ? this.ownerCt.ownerCt.el.getTop() : 0;
            this.hideMediaToolbar();
            this.mediaToolbarLayer = new Ext.Layer({
                shadow: 'frame', // shadow at all sides
                shadowOffset: 4
            });
            var margin = 5;

            // Now calculate offsets. The iframe may be scrolled itself, but the containing formPanel may also be.
            // The mediaToolbarlayer is not aware of any of that, as it is positioned absolutely on the page.
            if (elm.nodeName == 'IFRAME' || elm.nodeName == 'OBJECT') {
                this.mediaToolbarLayer.setWidth((32 * 3) + 4); // 3 items in this toolbar (no edit button)
            } else {
                this.mediaToolbarLayer.setWidth((32 * 4) + 4); // 4 items in this toolbar and some space. @TODO: refine this 'formulae' if necessary
            }
            this.mediaToolbarLayer.setHeight(28); // fixed height
            this.mediaToolbarLayer.setX(Math.max(0, el.getX()) + Math.max(0, editorEl.getBox(false, false).x) + margin);
            this.mediaToolbarLayer.setY(Math.max(containTop, Math.max(0, el.getY()) + Math.max(0, editorEl.getBox(false, false).y) + margin)); // image Top + (possibly scrolled) editor's Top
            this.mediaToolbarLayer.show();

            // Simple 'align buttons' handler
            function setAlign(side){
                var nwStyle = el.getStyle('float') == side ? '' : side;
                el.setStyle('float', nwStyle);
                this.mediaToolbar.left.toggle(nwStyle == 'left');
                this.mediaToolbar.right.toggle(nwStyle == 'right');
            }

            var tbarItems = [];
            tbarItems.push({
                iconCls: 'icon-richtext-edit-image',
                tooltip: __('Edit image'),
                scope: this,
                hidden: elm.nodeName == 'IFRAME' || elm.nodeName == 'OBJECT',
                handler: this.hideMediaToolbar.createSequence(this.editImage.createDelegate(this, [el]))
            }, {
                iconCls: 'icon-richtext-remove-image',
                tooltip: __('Remove image'),
                scope: this,
                handler: this.hideMediaToolbar.createSequence(this.removeSelection.createDelegate(this, [el]))
            }, '-', {
                iconCls: 'icon-richtext-align-left',
                tooltip: 'Align left',
                pressed: el.getStyle('float') == 'left',
                enableToggle: true,
                ref: 'left',
                //disabled: elm.nodeName == 'IFRAME' || elm.nodeName == 'OBJECT',
                handler: setAlign.createDelegate(this, ['left'])
            }, {
                iconCls: 'icon-richtext-align-right',
                tooltip: 'Align right',
                pressed: el.getStyle('float') == 'right',
                enableToggle: true,
                ref: 'right',
                //disabled: elm.nodeName == 'IFRAME' || elm.nodeName == 'OBJECT',
                handler: setAlign.createDelegate(this, ['right'])
            });

            // Now setup the toolbar
            this.mediaToolbar = new Ext.Toolbar({
                renderTo: this.mediaToolbarLayer,
                items: [tbarItems]
            });

            this.mediaToolbar.show();

        },

        /**
         * Hides the imageToolbar
         */
        hideMediaToolbar: function(){
            if (this.mediaToolbarLayer) {
                this.mediaToolbarLayer.remove();
            }
            if (this.mediaToolbar) {
                this.mediaToolbar.destroy();
            }
        },

        /**
         * prevents the dragging of images when they have captions with them,
         * sets clickhandler
         */
        setupImageHandling: function(){
            var scope = this;

            // make images inside
            var imgs = Ext.DomQuery.select('dl.figure img, dl.figure dd', this.getDoc().body);
            Ext.each(imgs, function(img){
                img.draggable = false;
            });

            // Dragging:
            this.getWin().addEventListener('mousedown', function(e){
                if (e.target.nodeName == 'IMG') {
                    var repNode = e.target.parentNode.parentNode; // dl.figure ?
                    if (Ext.get(repNode).hasClass('figure')) {
                        var sel = scope.getSelection();
                        /*
                         if (sel.rangeCount > 0) { // check to see whether the image is within a selection
                         var range = sel.getRangeAt(0);
                         range.setStartBefore(repNode);
                         range.setEndAfter(repNode);
                         sel.removeRange(range);
                         sel.addRange(range);
                         } else {*/
                        sel.removeAllRanges();
                        var range = document.createRange();
                        range.selectNodeContents(repNode);
                        range.setStartBefore(repNode);
                        range.setEndAfter(repNode);
                        sel.addRange(range);
                        //}
                    }
                }
                return true;
            }, false);


            this.getWin().addEventListener('mouseover', function(e){
                if (e && e.target) {
                    var t = e.target;
                    if (t.className == 'figure' || t.nodeName == 'IFRAME' || t.nodeName == 'OBJECT') { // image
                        if (scope.getSelection().focusNode !== scope.getDoc().getElementsByTagName('body')[0]) { // do we have focus (selection != body) ? If not, we can't edit images. See Ticket #165
                            scope.showMediaToolbar(t);
                        }
                    } else if (t.parentNode && t.parentNode.parentNode && t.parentNode.parentNode.className == 'figure') { // image with caption
                        if (scope.getSelection().focusNode !== scope.getDoc().getElementsByTagName('body')[0]) { // do we have focus?
                            scope.showMediaToolbar(t.parentNode.parentNode);
                        }
                    } else {
                        scope.hideMediaToolbar();
                    }
                    return true;
                }
            }, false);
        },

        /**
         * Put's the selected image in the editor
         * Replaces old "this.execCmd('insertImage', selected.src);"
         * @param {Object} selected
         */
        putImage: function(selected){
            var tpl = Garp.imageTpl;

            // Create selection to be replace by the new image:
            var sel = this.getSelection();
            var start = sel.anchorNode;
            var startO = sel.anchorOffset;
            var end = sel.focusNode;
            var endO = sel.focusOffset;
            // Put image
            this.insertAtCursor(tpl.apply({
                path: selected.src,
                width: selected.template.get('w'),
                height: selected.template.get('h'),
                align: selected.align,
                caption: selected.caption || false
            }));

            // TODO: move to own special function "moveCaretToEndOfDOM" or something:
            var scope = this;
            setTimeout(function(){
                var f = Ext.select('.figure', null, scope.getDoc()).last().dom; // newly added figure
                var bElms = scope.getDoc().getElementsByTagName('body')[0].children; // body elements
                if (bElms[bElms.length - 1].isSameNode(f)) {
                    //console.log('we have the last element: insert an \'empty\' paragraph, to allow user to get cursor beyond this image');
                    //insertAtCursor seems to break FF

                    var p = document.createElement('p');
                    var t = document.createTextNode(' \u200B '); // Safari doesn't want to select empty stuff
                    p.appendChild(t);
                    scope.getDoc().getElementsByTagName('body')[0].appendChild(p);
                }

                setTimeout(function(){
                    var sel = scope.getSelection();
                    var l = scope.getDoc().body.children;
                    l = l[l.length - 1];

                    sel.removeAllRanges();//remove any selections already made
                    var range = scope.getDoc().createRange();
                    range.setStart(l, 0);
                    range.setStartBefore(l);//Select the entire contents of the last element
                    range.setEnd(l, 0);
                    range.setEndAfter(l);
                    range.collapse(false);//collapse the range to the end point
                    sel.addRange(range);//make the range you have just created the visible selection
                    sel.selectAllChildren(l); // select it all
                    sel.collapse(l, 1); // collapse selection to end
                }, 100);

            }, 100);
        },

        /**
         * function addImage
         */
        addImage: function(){
            var win = new Garp.ImagePickerWindow({});
            win.on('select', this.putImage, this);
            win.show();
        },

        /**
         * Replaces current image with a new one, or with different attributes (align, caption, size etc)
         * @param {Object} current
         */
        editImage: function(current){
            var path = current.child('img') ? current.child('img').getAttribute('src') : current.getAttribute('src');
            path = path.split('/');
            if (path[path.length - 1] === '') {
                path.splice(path.length - 1, 1); // remove last ,if it's a trailing slash
            }
            var fileId = path[path.length - 1];
            var tplName = path[path.length - 2];
            var align = current.getStyle('float');
            var caption = current.child('dd') ? current.child('dd').dom.innerHTML : null;
            var win = new Garp.ImagePickerWindow({
                imgGridQuery: {
                    id: fileId
                },
                cropTemplateName: tplName,
                captionValue: caption,
                alignValue: align == 'none' ? '' : align
            });

            win.on('select', function(selected){
                win.close();
                this.removeSelection(current);
                this.putImage(selected);
            }, this);
            win.show();
        },

        /**
         * Add a video
         */
        addVideo: function(){
            var win = new Garp.ModelPickerWindow({
                model: 'Video',
                listeners: {
                    'select': function(selected){
                        var video = selected.selected;
                        // We include two empty paragraphs, to make sure including is at a blocklevel
                        this.insertAtCursor('<p></p>' +
                        Garp.videoTpl.apply({
                            player: video.get('player'),
                            width: VIDEO_WIDTH,
                            height: VIDEO_HEIGHT
                        }) +
                        '<p></p>');
                    },
                    scope: this
                }
            });
            win.show();
        },

        /**
         * function pastePlainText
         */
        pastePlainText: function(){
            var textarea = new Ext.form.TextArea();
            var win = new Ext.Window({
                width: 480,
                height: 320,
                modal: true,
                layout: 'fit',
                title: __('Paste as plain text'),
                iconCls: 'icon-richtext-paste-plain-text',
                defaultButton: textarea,
                items: [textarea],
                buttons: [{
                    text: __('Cancel'),
                    ref: '../cancel',
                    scope: this,
                    handler: function(){
                        win.close();
                    }
                }, {
                    text: __('Ok'),
                    ref: '../ok',
                    scope: this,
                    handler: function(){
                        var val = textarea.getValue();
                        this.insertAtCursor(val);
                        win.close();
                    }
                }]
            });
            win.show();
            win.keymap = new Ext.KeyMap(win.getEl(), [{
                key: Ext.EventObject.ENTER,
                ctrl: true,
                scope: this,
                fn: function(e){
                    win.ok.handler.call(this);
                }
            }, {
                key: Ext.EventObject.ESC,
                scope: this,
                fn: function(e){
                    win.cancel.handler.call(this);
                    e.stopEvent();
                }
            }]);
            win.keymap.stopEvent = true;
        },

        addEmbed: function(){
            var textarea = new Ext.form.TextArea();
            var win = new Ext.Window({
                width: 480,
                height: 320,
                modal: true,
                layout: 'fit',
                title: __('Embed HTML'),
                iconCls: 'icon-richtext-add-embed',
                defaultButton: textarea,
                items: [textarea],
                buttons: [{
                    text: __('Ok'),
                    ref: '../ok',
                    scope: this,
                    handler: function(){
                        var val = textarea.getValue();
                        this.insertAtCursor('<p></p>'); // makes sure this goes not in a paragraph
                        this.execCmd('InsertHTML', val);
                        this.insertAtCursor('<p></p>');
                        win.close();
                    }
                }, {
                    text: __('Cancel'),
                    ref: '../cancel',
                    scope: this,
                    handler: function(){
                        win.close();
                    }
                }]
            });
            win.show();
            win.keymap = new Ext.KeyMap(win.getEl(), [{
                key: Ext.EventObject.ENTER,
                ctrl: true,
                scope: this,
                fn: function(e){
                    win.ok.handler.call(this);
                }
            }, {
                key: Ext.EventObject.ESC,
                scope: this,
                fn: function(e){
                    win.cancel.handler.call(this);
                    e.stopEvent();
                }
            }]);
            win.keymap.stopEvent = true;
        },

        /**
         * function walk. Walks the DOM
         * @param {Object} node (the node to walk from)
         * @param {Object} dir (true, move up, false move down)
         * @param {Object} list (private)
         */
        walk: function(node, dir, list){
            if (!list) {
                list = [];
            }
            if (!dir === false) {
                dir = true;
            }
            if (dir) {
                list.push(node);
                if (node && node.parentNode && node.nodeName !== 'HTML') { // move up
                    node = node.parentNode;
                    this.walk(node, dir, list);
                }
            } else {
                list.push(node);
                if (node && node.childNodes && node.childNodes[0]) { // move down
                    node = node.childNodes[0];
                    this.walk(node, dir, list);
                }
            }
            return list;
        },

        /**
         * filters out things that are not tags
         * @param {Object} arr
         */
        filterTagsOnly: function(arr){
            var out = [];
            for (var c = 0; c < arr.length; c++) {
                var item = arr[c];
                if (item.tagName) {
                    out.push(item);
                }
            }
            return out;
        },

        /**
         * @return the current tag Name, or, if current selection is a textnode, it gives its direct parent's tag Name
         */
        getCurrentTagName: function(){
            var node = this.getSelection().focusNode;
            if (!node) {
                return;
            }
            node = node.tagName ? node.tagName : (node.parentNode.tagName ? node.parentNode.tagName : '');
            return node.toLowerCase();
        },

        /**
         * @return the current tag's classList or, if current selection is a textnode, it gives its direct parent's classList
         */
        getCurrentClassList: function(){
            var node = this.getSelection().focusNode;
            if (!node) {
                return;
            }
            var list = node.className ? node.className : (node.parentNode.className ? node.parentNode.className : '');
            return list.toLowerCase();
        },



        /**
         * function buildStatusbar
         * builds a 'statusbar' like element (bbar)
         */
        buildStatusbar: function(){
            this.statusbar = new Ext.Component({
                renderTo: this.wrap.dom,
                cls: 'x-toolbar garp-richtexteditor-statusbar',
                html: '&nbsp;'
            });
            var highlightElm = null;
            this.statusbar.el.on('mouseover', function(e, t){
                var index = Number(t.className.substr(1, t.className.length));
                if (!isNaN(index)) {
                    var sel = this.getSelection();
                    var htmlPath = this.filterTagsOnly(this.walk(sel.focusNode, true).reverse());
                    highlightElm = htmlPath[index];
                    if (highlightElm) {
                        Ext.get(highlightElm).addClass('garp-richtexteditor-highlight');
                    }
                }
            }, this);
            this.statusbar.el.on('mouseout', function(e, t){
                if (highlightElm) {
                    Ext.get(highlightElm).removeClass('garp-richtexteditor-highlight');
                }
            }, this);
        },

        /**
         * function updateStatusbar: displays a message, or the dom tree
         * @param {Object} str
         */
        updateStatusbar: function(str){
            if (!this.statusbar) {
                return;
            }

            if (str !== '') {
                var sel = this.getSelection();
                if (!sel) {
                    return;
                }
                var htmlPath = this.walk(sel.focusNode, true).reverse();
                str = '';
                for (var c = 1, len = htmlPath.length; c < len; c++) { // skip first ( HTML)
                    var elm = htmlPath[c];
                    if (elm.tagName) {
                        str += '<span class="_' + c + '">' + elm.tagName + '</span> &gt; ';
                    } else {
                        str += '<span class="_' + c + '">"' + Ext.util.Format.ellipsis(elm.nodeValue, 20, true) + '"</span>';
                    }
                }
            } else {
                str = '&nbsp;';
            }

            if (this.maxLength) {
                str += '<span class="count">' + ((this.maxLength - this.getCharCount()) || '') + '</span>';
            } else if (this.showCharCount){
                str += '<span class="count">' + (this.getCharCount() || '') + '</span>';
            }

            this.statusbar.update(str);
        },


        /**
         * @return number of textual characters
         */
        getCharCount: function(){
            if (this.initialized && this.getDoc() && this.getDoc().body) {
                var textContent = this.getDoc().body.textContent;
                if (textContent.charCodeAt(0) == 8203) {
                    return textContent.length - 1;
                }
                return textContent.length;
            }
            return 0;
        },


        /**
         * maximum textual character validator
         */
        isValid: function(){
            if(this.maxLength && this.getCharCount() >= this.maxLength){
                //this.markInvalid(__('Too many characters'));
                this.wrap.addClass(this.invalidClass);
                return false;
            }
            if (this.wrap) {
                this.wrap.removeClass(this.invalidClass);
            }
            //this.clearInvalid();
            return true;
        },


        /*
         * Override functions:
         */
        isDirty: function(){
			if (this.disabled || !this.rendered || !this.isVisible() || !this.getWin()) {
                return false;
            }
            if ((String(this.originalValue) === '<p>&#8203;</p>') && this.getValue() === null) {
                return false;
            }
            return String(this.getValue()) !== String(this.originalValue);
        },


        /**
         * Override getDocMarkup for stylesheet inclusion
         * Protected method that will not generally be called directly. It
         * is called when the editor initializes the iframe with HTML contents. Override this method if you
         * want to change the initialization markup of the iframe (e.g. to add stylesheets).
         *
         * Note: IE8-Standards has unwanted scroller behavior, so the default meta tag forces IE7 compatibility
         */
        getDocMarkup: function(){
            return '<html><head><link rel="stylesheet" href="' + BASE + '/css/garp/garp-richtexteditor.css" type="text/css"></head><body></body></html>';
        },

        // private
        /**
         * ... but extended
         */
        onEditorEvent: function(e){
            this.execCmd('styleWithCSS', false); // seems to get "forgotten" not sure why. @TODO @FIXME
            this.hasFocus = true;
            this.wrap.addClass('x-focus');
            var sel = this.getSelection();
            if (!sel) {
                return;
            }
            /*
            var body = this.getDoc().body;
            var htmlPath = this.filterTagsOnly(this.walk(body, false));

            // check to see if there's at least one paragraph:
            var count = false;
            for (var i in htmlPath) {
                var t = htmlPath[i];
                if (t.tagName && (t.tagName == 'p ' || t.tagName == 'P')) {
                    count = true;
                    break;
                }
            }

            // otherwise: insert a paragraph:
            if ((sel.focusNode && sel.focusNode.nodeName && sel.focusNode.nodeName == 'DIV') || !count) {
                this.relayCmd('formatblock', 'p');
            }
            */

            // THE ABOVE USED TO CLEANUP THE DOM AS THE USER TYPED. IT CAUSED TOO MANY TROUBLES. (CREATING PARAGRAPHS WHERE IT SHOULDN'T)

            this.updateToolbar();
        },

        _insertTag: function(tag){
            var r = this.getRange();
            var elm = document.createElement(tag ? tag.toUpperCase() : 'DIV');
            return r.insertNode(elm);
        },

        addDefinitionList: function(){
            var t = this.getCurrentTagName().toLowerCase();
            switch (t) {
                case 'dl':
                    this.insertAtCursor('</dl><p>');
                    break;
                case 'dt':
                    this.insertAtCursor('</dt></dl><p>');
                    break;
                case 'dd':
                    if (Ext.isChrome || Ext.isWebkit) {
                        this.insertAtCursor('</dd><dt>&hellip;</dt><dd>&hellip;</dd>');
                    } else {
                        this.insertAtCursor('</dd><dt>');
                    }
                    break;
                default:
                    var sel = this.getSelection();
                    var id = Ext.id();
                    var txt = sel.toString() || '&hellip;';
                    var range = this.getRange();
                    range.deleteContents();
                    if (Ext.isChrome || Ext.isWebkit) {
                        this.insertAtCursor('<dl><dt id="' + id + '">' + txt + '</dt><dd>' + txt + '</dd></dl><p>&nbsp;</p>');
                    } else {
                        this.insertAtCursor('<dl><dt id="' + id + '">' + txt + '</dt>');
                    }
                    var elm = this.getDoc().getElementById(id);
                    range.selectNodeContents(elm);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    break;
            }
            this.deferFocus();
            this.updateToolbar.defer(100, this);
        },


        /**
         * function updateToolbar()
         * Protected method that will not generally be called directly. It triggers
         * a toolbar update by reading the markup state of the current selection in the editor.
         *
         * Overriden for heading and link
         */
        updateToolbar: function(){

            if (this.readOnly || !this.hasFocus) {
                return;
            }

            if (!this.activated && this.onFirstFocus) {
                this.onFirstFocus();
                return;
            }

            var btns = this.tb.items.map, doc = this.getDoc();

            if (this.enableFont && !Ext.isSafari2) {
                var name = (doc.queryCommandValue('FontName') || this.defaultFont).toLowerCase();
                if (name != this.fontSelect.dom.value) {
                    this.fontSelect.dom.value = name;
                }
            }
            if (this.enableFormat) {
                btns.bold.toggle(doc.queryCommandState('bold'));
                btns.italic.toggle(doc.queryCommandState('italic'));
                if (this.enableUnderline) {
                    btns.underline.toggle(doc.queryCommandState('underline'));
                }
            }
            if (this.enableAlignments) {
                btns.justifyleft.toggle(doc.queryCommandState('justifyleft'));
                btns.justifycenter.toggle(doc.queryCommandState('justifycenter'));
                btns.justifyright.toggle(doc.queryCommandState('justifyright'));
            }
            if (!Ext.isSafari2 && this.enableLists) {
                btns.insertorderedlist.toggle(doc.queryCommandState('insertorderedlist'));
                btns.insertunorderedlist.toggle(doc.queryCommandState('insertunorderedlist'));
            }

            var format = doc.queryCommandValue('formatblock');
            var h = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
            if (format && h.indexOf(format.toLowerCase()) > -1) {
                btns.addheading.toggle(true);
            } else {
                btns.addheading.toggle(false);
            }

            var t = this.getCurrentTagName();
            var l = this.getCurrentClassList();
            btns.createlink.toggle(t == 'a');
            if (l && l.indexOf && l.indexOf('figure') == -1) {
                btns.definitionlist.toggle(t == 'dl' || t == 'dt' || t == 'dd');
            }
            Ext.menu.MenuMgr.hideAll();

            if (this.statusbar) {
                this.updateStatusbar();
            }

            this.syncValue();
            this.fireEvent('toolbarupdated', this);
        },

        /**
         * function onRender
         * @param {Object} ct
         * @param {Object} position
         */
        onRender: function(ct, position){
            Ext.ux.form.RichTextEditor.superclass.onRender.call(this, ct, position);
            if (this.showStatusbar) {
                this.buildStatusbar();
            }
            // Sometimes, current state overrules clicks on tb buttons. We defer the newly desired state, as to fix the UI:
            Ext.each(['bold', 'italic', 'underline', 'insertorderedlist', 'insertunorderedlist', 'addheading', 'justifyleft', 'justifycenter', 'justifyright'], function(btn){
                if (this.tb.items.map[btn]) {
                    this.tb.items.map[btn].on('click', function(e){
                        if (this.pressed) {
                            this.toggle.defer(100, this, [true]);
                        }
                    });
                }
            }, this);
        },

        /**
         * afterRender
         */
        afterRender: function(){
            Ext.ux.form.RichTextEditor.superclass.afterRender.call(this);
            var tbar = this.getToolbar();

            if (!this.enableUnderline) {
                var u = tbar.find('itemId', 'underline')[0];
                tbar.remove(u);
            }
            if (this.enableLists && this.enableUnderline) {
                tbar.insert(3, '-');
            }

            tbar.insert(3, {
                tooltip: __('<b>Add Blockquote</b><br>Convert selected text into a blockquote.'),
                iconCls: 'icon-richtext-add-blockquote',
                hidden: !this.enableBlockQuote,
                itemId: 'addblockquote',
                handler: this.addBlockQuote.createDelegate(this),
                tabIndex: -1,
                scope: this
            });

            tbar.insert(4, {
                tooltip: __('<b>Add Heading</b><br>Convert selected text into a heading.'),
                iconCls: 'icon-richtext-add-heading',
                enableToggle: true,
                hidden: !this.enableHeading,
                itemId: 'addheading',
                handler: this.addHeading.createDelegate(this, [this.defaultHeadingTag]),
                tabIndex: -1,
                scope: this
            });

            tbar.insert(8, {
                tooltip: __('<b>Add Glossary</b><br>Creates a list of terms.'),
                iconCls: 'icon-richtext-add-dl',
                enableToggle: true,
                itemId: 'definitionlist',
                hidden: !this.enableDefinitionList,
                handler: this.addDefinitionList, // this.createLink
                tabIndex: -1,
                scope: this
            });

            tbar.insert(9, {
                tooltip: __('<b>Add Link</b><br>Convert selected text into a hyperlink.'),
                iconCls: 'icon-richtext-add-link',
                enableToggle: true,
                itemId: 'createlink',
                hidden: !this.enableLink,
                handler: this.addLink, // this.createLink
                tabIndex: -1,
                scope: this
            });

            tbar.insert(10, {
                tooltip: __('<b>Image</b><br>Insert image.'),
                iconCls: 'icon-richtext-add-image',
                itemId: 'addImage',
                hidden: !this.enableMedia,
                handler: this.addImage,
                tabIndex: -1,
                scope: this
            });

            tbar.insert(11, {
                tooltip: __('<b>Video</b><br>Insert a video.'),
                iconCls: 'icon-richtext-add-video',
                itemId: 'addVideo',
                hidden: !this.enableMedia,
                handler: this.addVideo,
                tabIndex: -1,
                scope: this
            });

            tbar.insert(12, '-');

            tbar.insert(13, {
                tooltip: __('<b>Paste as plain text</b><br>Removes styling.'),
                iconCls: 'icon-richtext-paste-plain-text',
                enableToggle: false,
                itemId: 'pastePlainText',
                handler: this.pastePlainText,
                tabIndex: -1,
                scope: this
            });

            tbar.insert(14, {
                tooltip: __('<b>Add Embed</b>'),
                iconCls: 'icon-richtext-add-embed',
                enableToggle: false,
                itemId: 'addEmbed',
                hidden: !this.enableEmbed,
                handler: this.addEmbed,
                tabIndex: -1,
                scope: this
            });

        },


        /**
         * function onResize
         *
         * override because of possible statusbar
         */
        onResize: function(w, h){
            Ext.form.HtmlEditor.superclass.onResize.apply(this, arguments);
            if (this.el && this.iframe) {
                if (Ext.isNumber(w)) {
                    var aw = w - this.wrap.getFrameWidth('lr');
                    this.el.setWidth(aw);
                    this.tb.setWidth(aw);
                    this.iframe.style.width = Math.max(aw, 0) + 'px';
                }
                if (Ext.isNumber(h)) {
                    var ah = h - this.wrap.getFrameWidth('tb') - this.tb.el.getHeight() - (this.statusbar ? this.statusbar.el.getHeight() : 0);
                    this.el.setHeight(ah);
                    this.iframe.style.height = Math.max(ah, 0) + 'px';
                    var bd = this.getEditorBody();
                    if (bd) {
                        bd.style.height = Math.max((ah - (this.iframePad * 2)), 0) + 'px';
                    }
                }
            }
        },

        /**
         * Unwraps a tag within a domFragment
         * @param {Object} tagName
         * @param {Object} fragment
         */
        unwrap: function(tagName, fragment){
            while (Ext.DomQuery.select(tagName, fragment).length > 0) {
                var elm = Ext.DomQuery.selectNode(tagName, fragment);
                elm.normalize();
                while (elm.childNodes.length > 0) {
                    var child = elm.childNodes[elm.childNodes.length - 1];
                    var clone = child.cloneNode(true);
                    elm.parentNode.insertBefore(clone, elm);
                    elm.removeChild(child);
                }
                elm.parentNode.removeChild(elm);
            }
        },

        /**
         * replaces Tags with something else or removes them if replaceWith is false
         * @param {Object} tagName
         * @param {Object} replaceWith
         * @param {Object} fragment
         */
        replaceTag: function(tagName, replaceWith, fragment){
            var search = Ext.DomQuery.select(tagName, fragment);
            Ext.DomHelper.useDom = false;
            Ext.each(search, function(s){
                var elm = Ext.get(s);
                if (replaceWith) {
                    var i = elm.dom.innerHTML;
                    Ext.DomHelper.insertBefore(s, {
                        tag: replaceWith,
                        html: i
                    });
                }
                elm.remove();
            });
        },

        /**
         * wrap a fragment
         * @param {Object} tagName
         * @param {Object} fragment
         */
        wrapFragment: function(tagName, fragment){
            var wrapper = fragment.ownerDocument.createElement(tagName);
            var inner = fragment.cloneNode(true);
            wrapper.appendChild(inner);
            fragment.parentNode.insertBefore(wrapper, fragment);
            fragment.parentNode.removeChild(fragment);
        },

        /**
         * DEPRECATED
         * makes sure inline elements are wrapped in a <p>
         * @param {Object} fragment
         */
        fixInlineElements: function(fragment){
            // inline elements need to get wrapped in a 'p'
            var inlineElms = ['#text', 'B', 'BIG', 'I', 'SMALL', 'TT', 'ABBR', 'ACRONYM', 'CITE', 'CODE', 'DFN', 'KBD', 'STRONG', 'SAMP', 'VAR', 'A', 'BDO', 'IMG', 'MAP', 'OBJECT', 'Q', 'SCRIPT', 'SPAN', 'SUB', 'SUP', 'BUTTON', 'INPUT', 'LABEL', 'SELECT', 'TEXTAREA'];

            var firstChild = false;
            var lastChilds = false;
            Ext.each(fragment.childNodes, function(child){
                if (inlineElms.indexOf(child.nodeName) > -1) {
                    if (!firstChild) {
                        firstChild = child;
                    }
                    lastChild = child;
                }
            }, this);
            if (firstChild) {
                var wrapper = fragment.ownerDocument.createElement('p');
                if (firstChild != lastChild) { // create a range if the wrapper should span more than one node
                    var range = fragment.ownerDocument.createRange();
                    range.setStart(firstChild, 0);
                    range.setEnd(lastChild, lastChild.length);
                    wrapper.appendChild(range.extractContents());
                } else { // otherwise, wrap just a clone of the original node
                    wrapper.appendChild(firstChild.cloneNode(true));
                }
                firstChild.parentNode.replaceChild(wrapper, firstChild);
            }
            fragment.normalize();
        },

        // DEPRECATED
        fixBrs: function(fragment){
            var elms = Ext.each(Ext.DomQuery.select('br', fragment), function(elm){
                var el = Ext.get(elm);
                //console.log(' ');
                //console.info(elm);

                if (el.parent('p') && el.parent('p').dom.childNodes[0] == elm) {
                    //console.log('first element in p is br');
                    el.remove();
                    return;
                }
                if (el.dom.nextSibling && el.dom.nextSibling.nodeName == 'BR') {
                    //console.log('next element is a br');
                    el.remove();
                    return;
                }
            });
        },

        /**
         * cleans the body from unwanted br's and stuff
         */
        cleanupHtml: function(){
            this.suspendEvents();
            //this.setDesignMode(false); //toggle off first
            var doc = this.getDoc();
            var body = doc.body;

            // change 'empty char. entities' into spaces:
            var entities = ['&nbsp;', '&#8203;'];
            var html = this.getValue();
            if (!html) {
                return true;
            }
            Ext.each(entities, function(entity){
                html = html.replace(entity, ' ');
            });
            this.setValue(html);

            // remove spans
            this.unwrap('span', body);
            this.unwrap('div', body);

            // replace strong into b & em into i:
            this.replaceTag('strong', 'b', body);
            this.replaceTag('em', 'i', body);

            // make sure every text node is within a paragraph
            body.normalize();
            //this.fixInlineElements(body);
            //this.fixBrs(body);

            // remove empty p's:
            /*
            Ext.get(Ext.DomQuery.select('p:empty', body)).remove();
            Ext.each(Ext.DomQuery.select('p', body), function(elm){
                if (entities.indexOf(elm.innerHTML) > -1) {
                    Ext.get(elm).remove();
                }
            });
            */
            // remove ID attributes
            var elms = Ext.DomQuery.jsSelect('[id]', body);
            Ext.each(elms, function(elm){
                elm.removeAttribute('id');
            }, this);

            //this.setDesignMode(true);
            this.resumeEvents();

            return true;
        },

        /**
         * cleans the body from unwanted br's and stuff
         * DEPRECATED
         */
        cleanupHtmlOld: function(){
            this.suspendEvents();
            var doc = this.getDoc();
            var body = doc.body;

            // unwrap span's, because WE DON'T WANT span's
            while (Ext.DomQuery.select('span', body).length > 0) {
                var elm = Ext.DomQuery.selectNode('span', body);
                elm.normalize();
                while (elm.childNodes.length > 0) {
                    var child = elm.childNodes[0];
                    var clone = child.cloneNode(true);
                    elm.parentNode.insertBefore(clone, elm);
                    elm.removeChild(child);
                }
                elm.parentNode.removeChild(elm);
            }
            body.normalize();
            // remove possible lonely BR
            if (body.children.length == 1 && body.children[0].tagName == 'BR') {
                body.removeChild(body.children[0]);
            }

            // change 'empty char. entities' into spaces:
            var entities = ['&nbsp;', '&#8203;'];
            var html = this.getValue();
            if (!html) {
                return true;
            }
            Ext.each(entities, function(entity){
                html = html.replace(entity, ' ');
            });

            this.setValue(html);

            // make sure every textNode is inside a paragraph.
            // this only checks for *direct children* of body.
            Ext.each(body.childNodes, function(elm){
                if (elm.nodeName == '#text' && elm.nodeValue) {
                    var p = doc.createElement('p');
                    var t = doc.createTextNode(elm.nodeValue);
                    p.appendChild(t);
                    body.insertBefore(p, elm);
                    body.removeChild(elm);
                }
            });

            var elms = Ext.each(Ext.DomQuery.select('br', body), function(elm){
                var el = Ext.get(elm);
                //console.log(' ');
                //console.info(elm);
                if (!el.parent('p')) {
                    //console.log('parent not p');
                    //el.remove();
                    return;
                }
                if (el.parent('p').dom.childNodes.length == 1) {
                    //console.log('parent only has br');
                    el.remove();
                    return;
                }
                if (el.parent('p').dom.childNodes[0] == elm) {
                    //console.log('first element in p is br');
                    el.remove();
                    return;
                }
                if (el.dom.nextSibling && el.dom.nextSibling.nodeName == 'BR') {
                    //console.log('next element is a br');
                    el.remove();
                    return;
                }
            });

            // remove empty p's:
            Ext.get(Ext.DomQuery.select('p:empty', body)).remove();
            Ext.each(Ext.DomQuery.select('p', body), function(elm){
                if (entities.indexOf(elm.innerHTML) > -1) {
                    Ext.get(elm).remove();
                }
            });

            // change strong's into b's:
            var strongs = Ext.DomQuery.select('strong', body);
            Ext.DomHelper.useDom = false;
            Ext.each(strongs, function(s){
                var elm = Ext.get(s);
                var i = elm.dom.innerHTML;
                Ext.DomHelper.insertBefore(s, {
                    tag: 'b',
                    html: i
                });
                elm.remove();
            });

            // change em's into i's:
            strongs = Ext.DomQuery.select('em', body);
            Ext.DomHelper.useDom = false;
            Ext.each(strongs, function(s){
                var elm = Ext.get(s);
                var i = elm.dom.innerHTML;
                Ext.DomHelper.insertBefore(s, {
                    tag: 'i',
                    html: i
                });
                elm.remove();
            });

            this.resumeEvents();

            return true;
        },

        /**
         * custom 'blur' event
         * @param {Object} e Ext event object
         * @param {Object} t DOM target
         */
        blur: function(e, t){

            if (!this.initialized) {
                return;
            }
            this.hideMediaToolbar();

            if (!this.hasFocus) {
                return;
            }

            // MIDAS still holds 'editing' state, so updateToolbar doesn't work. We'll unpress the toolbar buttons manually:
            var tbar = this.getToolbar();
            tbar.items.each(function(item){
                if (item.toggle) {
                    item.toggle(false);
                }
            });

            // if the clicked element is within the RTE component or when there's a dialog on screen, we do nothing.
            // Otherwise, we fire our blur event now:
            // Added: The clicked element must be within the formpanel. See [GARP] Ticket #314

            if (!t || (!Ext.WindowMgr.getActive()) && this.getEl().parent('.garp-formpanel') && !this.getEl().parent().contains(Ext.get(t).dom.id)) {
                this.updateStatusbar('');
                this.hasFocus = false;
                this.fireEvent('blur', this);
                this.wrap.removeClass('x-focus');
    this.cleanupHtml();
                if (e && e.stopEvent) {
                    e.stopEvent();
                }
            }
        },

        /**
         * function initComponent
         */
        initComponent: function(){
            this.addEvents('toolbarupdated');

            Ext.ux.form.RichTextEditor.superclass.initComponent.call(this);

            this.on('initialize', function(){
                this.execCmd('styleWithCSS', false);
                this.execCmd('insertBrOnReturn', false, false);
                this.execCmd('enableObjectResizing', false); // Doesn't work for IE
                this.updateStatusbar('');
                this.setupImageHandling();
                this.getDoc().body.style.backgroundColor = 'transparent';
            }, this);
            this.on('editmodechange', function(c, mode){
                if (mode) {
                    this.addClass('garp-richtexteditor-source-edit');
                } else {
                    this.removeClass('garp-richtexteditor-source-edit');
                }
            }, this);

            Ext.getBody().on('click', this.blur, this);

            this.on('push', function(){
                this.updateStatusbar('');
                //this.cleanupHtml();
            }, this);

        },

        /**
         * unregister event handlers and such:
         */
        destroy: function(){
            Ext.getBody().un('click', this.blur, this);
        },

        /**
         * Protected method that will not generally be called directly. Pushes the value of the textarea
         * into the iframe editor.
         */
        pushValue: function(){
            if (this.initialized) {
                var v = this.el.dom.value;
                if (!this.activated && v.length < 1) {
                    v = this.defaultValue;
                }
                // we don't want to push values into textarea if the user is editing the textarea instead of the iframe
                if (this.sourceEditMode) {
                    return;
                }

                /*
                 * @FIXME: Not sure why beforepush causes problems, but disabling the event test
                 *         fixes a major problem with syncing the component.   -- Peter 7-9-2010
                 */
                //if(this.fireEvent('beforepush', this, v) !== false){
                this.getEditorBody().innerHTML = v;

                /*
                 if(Ext.isGecko){
                 // Gecko hack, see: https://bugzilla.mozilla.org/show_bug.cgi?id=232791#c8
                 // fixed (see url)
                 // -- Peter 12-5-2011
                 this.setDesignMode(false);  //toggle off first
                 this.setDesignMode(true);
                 }*/
                this.fireEvent('push', this, v);
                //}
                Ext.EventManager.on(this.getDoc(), 'keydown', function(e){
                    if (e.getKey() == e.TAB) {
                        this.blur(e, false);
                        return false;
                    }
                }, this);
                var k = new Ext.KeyMap(this.getDoc().body, {
                    ctrl: true,
                    key: Ext.EventObject.ENTER,
                    fn: function(e){
                        var parentForm = this.findParentByType('garpformpanel');
                        if(!parentForm){
                            parentForm = this.findParentByType('formpanel');
                        }
                        if (parentForm) {
                            this.blur(e, false);
                            this.syncValue();
                            this.cleanupHtml();
                            parentForm.fireEvent('save-all');
                        }
                    },
                    scope: this
                });
                k.enable();
            }
        },

        fixKeys: function(){ // load time branching for fastest keydown performance
            //if (true || Ext.isWebkit) {
            return function(e){
                if (e.ctrlKey) {
                    var c = e.getCharCode(), cmd;
                    if (c > 0) {
                        c = String.fromCharCode(c);
                        switch (c.toLowerCase()) {
                            case 'b':
                                cmd = 'bold';
                                break;
                            case 'i':
                                cmd = 'italic';
                                break;
                            case 'u':
                                cmd = 'underline';
                                break;
                        }
                        if (cmd) {
                            this.win.focus();
                            this.execCmd(cmd);
                            this.deferFocus();
                            e.preventDefault();
                        }
                    }
                }
            };
            //}

            // to override standard Ext.form.HtmlEditor behavior:
            //return function(e){
            //};

            /*
             if(Ext.isIE){
             return function(e){
             var k = e.getKey(),
             doc = this.getDoc(),
             r;
             if(k == e.TAB){
             e.stopEvent();
             r = doc.selection.createRange();
             if(r){
             r.collapse(true);
             r.pasteHTML('&nbsp;&nbsp;&nbsp;&nbsp;');
             this.deferFocus();
             }
             }else if(k == e.ENTER){
             r = doc.selection.createRange();
             if(r){
             var target = r.parentElement();
             if(!target || target.tagName.toLowerCase() != 'li'){
             e.stopEvent();
             r.pasteHTML('<br />');
             r.collapse(false);
             r.select();
             }
             }
             }
             };
             }else if(Ext.isOpera){
             return function(e){
             var k = e.getKey();
             if(k == e.TAB){
             e.stopEvent();
             this.win.focus();
             this.execCmd('InsertHTML','&nbsp;&nbsp;&nbsp;&nbsp;');
             this.deferFocus();
             }
             };
             }else if(Ext.isWebKit){
             return function(e){
             var k = e.getKey();
             if(k == e.TAB){
             e.stopEvent();
             this.execCmd('InsertText','\t');
             this.deferFocus();
             }else if(k == e.ENTER){
             e.stopEvent();
             this.execCmd('InsertHtml','<br /><br />');
             this.deferFocus();
             }
             };
             }*/
        }()
    });

    /**
     * Plugin for ext.ux.form.richTextEditor
     */
    Garp.CodeEditor = function(){

        this.updateBtns = function(){
            var btns = this.getToolbar().items.map;
            btns.pre.toggle(this.getDoc().queryCommandValue('formatblock') == 'pre');

            var tag = this.getCurrentTagName();
            btns.code.toggle(tag === 'code');
            btns['var'].toggle(tag === 'var');
        };

        this.afterrender = function(){

            this.addVar = function(){
                if (this.getCurrentTagName() == 'var') {
                    this.relayCmd('removeformat');
                } else {
                    var selText = this.getSelection().toString(); // the selected Text
                    if (!selText) {
                        selText = '{var}';
                    }
                    this.insertAtCursor('<var>' + selText + '</var>');
                }
            };

            this.addCode = function(){
                if (this.getCurrentTagName() == 'code') {
                    this.relayCmd('removeformat');
                } else {
                    var selText = this.getSelection().toString(); // the selected Text
                    if (!selText) {
                        selText = '{code}';
                    }
                    this.insertAtCursor('<code>' + selText + '</code>');
                }
            };

            this.addPre = function(){
                if (this.getDoc().queryCommandValue('formatblock') == 'pre') {
                    this.relayCmd('formatblock', 'p');
                } else {
                    this.relayCmd('formatblock', 'pre');
                }
            };

            var tb = this.getToolbar();

            tb.add('-');
            tb.insert(5, {
                iconCls: 'icon-richtext-add-heading-menu',
                tabIndex: -1,
                menu: new Ext.menu.Menu({
                    defaults: {
                        handler: function(item){
                            this.addHeading(item.text);
                        },
                        scope: this
                    },
                    items: [{
                        text: 'H1'
                    }, {
                        text: 'H2'
                    }, {
                        text: 'H3'
                    }, {
                        text: 'H4'
                    }, {
                        text: 'H5'
                    }, {
                        text: 'H6'
                    }]
                })
            });

            tb.add({
                tooltip: __('Add &lt;var&gt;'),
                tabIndex: -1,
                handler: this.addVar,
                scope: this,
                itemId: 'var',
                enableToggle: true,
                iconCls: 'icon-richtext-add-var'
            });

            tb.add({
                tooltip: __('Add &lt;code&gt;'),
                tabIndex: -1,
                handler: this.addCode,
                scope: this,
                itemId: 'code',
                enableToggle: true,
                iconCls: 'icon-richtext-add-code'
            });

            tb.add({
                tooltip: __('Add &lt;pre&gt;'),
                tabIndex: -1,
                handler: this.addPre,
                scope: this,
                itemId: 'pre',
                iconCls: 'icon-richtext-add-pre',
                enableToggle: true
            });


            var old = tb.get('addheading');
            old.hide();
        };

        this.init = function(field){
            field.on('afterrender', this.afterrender);
            field.on('toolbarupdated', this.updateBtns);
        };
    };
}

Ext.reg('richtexteditor', Ext.ux.form.RichTextEditor);

/****************************************************
 *
 * CKEditor Extension
 *
 * Written by Larix Kortbeek for Grrr
 *
 *****************************************************/
Ext.form.CKEditor = function(config) {
    this.config = config;

    config.CKEditor = {
        // Allow only these tags (=true for all of them)
        allowedContent: true,
		customConfig: '',
        format_tags: 'p;h2;h3',

        // Available buttons
        toolbar: [
            ['Bold', 'Italic', '-', 'RemoveFormat'],
            ['Link', 'Unlink'],
            ['NumberedList','BulletedList', 'Format'],
            ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo', '-', 'Source', '-', 'CharCount']
        ],

        // Disable CKEditor's own image plugin
        removePlugins: 'image'
    };

    // Load the site's own styling
    if (window.WYSIWYG_CSS_URL) {
        config.CKEditor.contentsCss = window.WYSIWYG_CSS_URL;
    }

    config.CKEditor.height = "400px";
	config.CKEditor.maxLength = config.maxLength || 0;

	var extraPlugins = 'charcount,garpctrlenter';

    // Load the garp content plugins for richwyswig editor types
    if (config.rich) {
        // Always load the images picker
        extraPlugins += ",garpimages";
        var richButtons = ["Garpimage"];

        // Only load the video picker when a VIDEO_WIDTH template is defined
        if (typeof VIDEO_WIDTH !== 'undefined') {
            extraPlugins += ",garpvideos";
            richButtons.push("Garpvideo");
        }

        // Let the editor know
        config.CKEditor.toolbar.push(richButtons);
    }

    config.CKEditor.extraPlugins = extraPlugins;

    // Attach to Ext
    Ext.form.CKEditor.superclass.constructor.call(this, config);
};

Ext.extend(Ext.form.CKEditor, Ext.form.TextArea, {
    onRender: function(ct, position) {
        Ext.form.CKEditor.superclass.onRender.call(this, ct, position);

		var ckLoaded = function() {
        	this.editor = CKEDITOR.replace(this.id, this.config.CKEditor);

        	// Closure for quick access in the event listener
        	var that = this;
        	this.editor.on('dataReady', function() {
            	this.resetDirty();
            	that.waitingForSetData = false;
        	});
        	this.setValue(this.orgValue);
        };
		if (typeof CKEDITOR === 'undefined') {
			Ext.Loader.load([ASSET_URL + 'js/garp/ckeditor/ckeditor.js'], ckLoaded, this);
			return;
		}
		ckLoaded.call(this);
    },

	isValid: function(value) {
        var charCount = this.getCharCount();
		if (!this.editor) {
			return true;
		}

        if (!this.allowBlank && !charCount) {
            if (this.wasBlank) {
                return false;
            }
            this.wasBlank = true;
            this.editor.element.addClass('invalid');
            this.markInvalid(this.blankText);
            return false;
        }
        this.wasBlank = false;

		if (this.maxLength && charCount >= this.maxLength) {
            if (this.wasTooLong) {
                return false;
            }
            this.wasTooLong = true;
            this.editor.element.addClass('invalid');
            this.markInvalid(this.maxLengthText);
			return false;
		}
        this.wasTooLong = false;

        this.clearInvalid();
        return true;
	},

	// Get char count, stripped of HTML tags
	getCharCount: function() {
        var contentString = "";
		try {
            contentString = this.editor.document.getBody().getText();
		} catch(e) {
            contentString = this.getValue().replace(/(<([^>]+)>)/ig,"");
		}
        // Trim newlines and count
        return contentString.replace(/^\s+|\s+$/g, '').length;
	},

    setValue: function(value) {
        // Save the value as the elements original value
        this.orgValue = value;

        // Wait for an editor (the setValue function will be called on render)
        if (!this.editor) {
            return;
        }
        // Convert undefineds and nulls to empty string
        value = value || "";

        // Working around CKEditor's crazy-assync setData
        // (When setting data twice in short succession only the first data gets set)
        var that = this;

        function retrySetValue(event) {
            that.setValue(that.orgValue);
            that.waitingForSetData = false;
            event.removeListener();
        }
        if (this.waitingForSetData) {
            this.editor.on('dataReady', retrySetValue);
        }
        this.waitingForSetData = true;

        // Set CKEditor's content
        this.editor.setData(value);
    },

    getValue: function() {
        var val = this.orgValue;

        // If an editor is available and content has changed
        if (this.editor && this.editor.checkDirty()) {
            val = this.editor.getData();
        }

        // Convert falsy values to the empty string
        return val || "";
    },

    getRawValue: function() {
        return this.getValue();
    }
});

// Define "Rich CKEditor" (which allows for some more options such as image and video embeds)
Ext.form.RichCKEditor = function(config) {
    config.rich = true;
    Ext.form.RichCKEditor.superclass.constructor.call(this, config);
};
Ext.extend(Ext.form.RichCKEditor, Ext.form.CKEditor);

// Enable the CKEditor as default richtexteditor
Ext.reg('wysiwygeditor', Ext.form.CKEditor);
Ext.reg('richwysiwygeditor', Ext.form.RichCKEditor);

/**
 * 
 * i18nSource: a form field to contain values for referenced language fields;
 * it acts as a conduit for other fields in the form (they are grouped in i18nFieldsets).
 * e.g. on 'setValue' all referenced fields are 'setValue'd with their respective language value:
 *  
 *  field.name.setValue(obj) -->> field._name_nl.setValue(str); 
 *                                field._name_en.setValue(str);
 *  
 */
Garp.i18nSource = Ext.extend(Ext.form.Field, {

	ref: '../',
	style: 'display:none; height: 0; margin: 0; padding: 0;',
	hideLabel: true,
	
	originalValue: null,
	
	initComponent: function(ct){
		Garp.i18nSource.superclass.initComponent.call(this, ct);
		Garp.i18nSource.superclass.hide.call(this);
	},
	
	/**
	 * Get referenced field
	 * @param {String} lang
	 */
	getRefField: function(lang){
		return this.refOwner.find('name', ('_' + this.name + '_' + lang))[0];
	},
	
	setValue: function(v){
		Ext.each(LANGUAGES, function(lang){
			if (this.getRefField(lang)) {
				if (v !== null) {
					this.getRefField(lang).setValue(v[lang]);
				}
			}
		}, this);
		Garp.i18nSource.superclass.setValue.call(this, v);
	},
	
	setRawValue: function(v){
		return this.setValue(v);
	},
	
	getValue: function(v){
		var out = {};
		Ext.each(LANGUAGES, function(lang){
			field = this.getRefField(lang);
			if (field && field.isDirty()) {
				out[lang] = field.getValue() === '' ? null : field.getValue();
			}
		}, this);
		return out;
	},
	
	getRawValue: function(v){
		return this.getValue(v);
	},

	isDirty: function(v){
		var out = false;
		Ext.each(LANGUAGES, function(lang){
			if (this.getRefField(lang) && this.getRefField(lang).isDirty()) {
				out = true;
				return false;
			}
		}, this);
		return out;
	},
	
	/**
	 * Perform function on all referenced fields
	 * @param {String} function to perform
	 * @param {Object} [optional] param
	 * @param {Bool} skipSelf, do not perform the function on 'this'
	 */
	_setAll: function(func, param, skipSelf){
		Ext.each(LANGUAGES, function(lang){
			var f = this.getRefField(lang);
			if (f && f[func]) {
				f[func](param);
			}
		}, this);
		if (!skipSelf === true) {
			return Garp.i18nSource.superclass[func].call(this, param);
		}
	},
	
	setVisible: function(state){
		return this._setAll('setVisible', state, true);
	},
	setDisabled: function(state){
		return this._setAll('setDisabled', state);
	},
	show: function(state){
		return this._setAll('show', state, true);
	},
	hide: function(state){
		return this._setAll('hide', state, true);
	},
	enable: function(state){
		return this._setAll('enable', state);
	},
	disable: function(state){
		return this._setAll('disable', state);
	}	
	
});
Ext.reg('i18nsource', Garp.i18nSource);


/**
 * Simple Fieldset to hold i18n fields:
 */
Garp.i18nFieldSet = Ext.extend(Ext.form.FieldSet, {
	cls: 'i18n-fieldset',
	collapsed: true,
	initComponent: function(ct){
		Garp.i18nFieldSet.superclass.initComponent.call(this, ct);
	}
});
Ext.reg('i18nfieldset', Garp.i18nFieldSet);
Garp.WysiwygField = Ext.extend(Ext.form.TextField, {

	region: 'center',

	hideLabel: true,

	bodyStyle: 'overflow-y: auto',

	reset: function(){
		this.chapterct.removeAll(true);
		delete this.originalValue;
		if(!this.chapterct.items.length){
			this.chapterct.addWysiwygCt();
		}
	},

	hideMode: 'display',

	extraTypes: [],
	
	setValue: function(items){
		this.reset();
		var maxCols = this.maxCols;

		if (items && items.length) {
			this.chapterct.removeAll(true);
			Ext.each(items, function(item){
				if (!item) {
					item = {
						type: '',
						classes: []
					};
				}
				var currentWysiwygCt = this.chapterct.addWysiwygCt({
					type: item.type,
					_classes: item.classes
				}, this.chapterct.items ? this.chapterct.items.last() : null);
				if (!item.content) {
					// We used to remove empty containers. @see grrr.nl Ticket #158
					// 
					//if (item.remove) {
					//	item.remove();
					//}
					return;
				}
				Ext.each(item.content, function(node){
					if (!node.model) {
						//throw 'Model type not found. DB corrupted or silly developer at work...';
						if (console && console.dir) {
							console.dir(node);
							console.warn('Model type not found. DB corrupted or silly developer at work...');
						}
						if (node.remove) {
							node.remove();
						}
						return;
					}
					var box = new Garp.dataTypes[node.model].Wysiwyg({
						ct: currentWysiwygCt,
						_data: node.data,
						_classes: node.classes,
						model: node.model,
						type: node.type,
						col: 'grid-' + node.columns + '-' + maxCols,
						maxCols: maxCols
					});
					currentWysiwygCt.add(box);
					currentWysiwygCt.afterAdd();
				});
				
			}, this);
		}
	},
	
	getValue: function(){
		
		var output = [];
		this.chapterct.items.each(function(wysiwygct){
			var content = [];
			if (!wysiwygct.body.dom) {
				return;
			}
			Ext.each(wysiwygct.body.dom.childNodes, function(elm){
				var node = Ext.getCmp(elm.getAttribute('id'));
				if (node.getValue()) {
					var o = node.getValue();
					if(node.type){
						o.type = node.getType();
					}
					if (node.getClasses && node.getClasses()) {
						o.classes = node.getClasses();
					}
					content.push(o);
				}
			});
			if (content.length) {
				output.push({
					content: content,
					type: wysiwygct.getExtraType()
				});
			}
		}, this);
		return output;
	},
	
	isValid: function(){
		return true; // @TODO decide if this needs to go here!
	},
	
	isDirty: function(){
		if (this.getValue() && this.originalValue) {
			var f = Ext.util.JSON.encode;
			return f(this.getValue()) != f(this.originalValue);
		}
	},
	
	afterRender: function(){
		this.wrap = this.el.wrap();
	
		this.extraTypes = Garp.dataTypes.Chapter.getField('type').store;
	
		this.chapterct = new Garp.Chapterct({
			renderTo: this.wrap,
			ownerField: this,
			maxCols: this.maxCols,
			extraTypes: this.extraTypes
		});
		
		this.on('resize', function(){
			this.chapterct.setWidth(this.getWidth());
		}, this);
		
		this.el.hide();
		Garp.WysiwygField.superclass.afterRender.call(this);

	},
	
	initComponent: function(cfg){
		Garp.WysiwygField.superclass.initComponent.call(this, arguments);
	}
	
});
Ext.reg('wysiwygfield', Garp.WysiwygField);


/* * * */

Garp.Wysiwygct = Ext.extend(Ext.Panel,{

	cls: 'wysiwyg-ct',
	bodyCssClass: 'wysiwyg-body',
	
	bodyBorder: false,
	autoScroll: true,
	autoHeight: true,
	padding: '30',
	maxCols: null,
	extraTypes: null,
	
	moveChapter: function(dir){
		var ci = this.ct.getWysiwygIdx(this);
		if ((dir === 1 && ci === (this.ct.items.length - 1)) || (dir === -1 && ci === 0)) {
			return;
		}
		var data = this.ct.ownerField.getValue();
		var origV = data.slice(0);
		var thisItem = data[ci];
		var nextItem = data[ci + dir];
		var temp = nextItem;
		data[ci + dir] = thisItem;
		data[ci] = nextItem;
		var formPanelBody = Garp.formPanel.formcontent.get(0).body;
		var currentScroll = formPanelBody.getScroll().top;
		this.ct.ownerField.setValue(data);
		if (formPanelBody && currentScroll) {
			formPanelBody.scrollTo('top', currentScroll, false);
		}
		this.ct.ownerField.originalValue = origV; // @TODO find out why originalValue gets 'undefined' if we don't set it again.
	},
	
	getWysiwygDataTypes: function(){
		var dataTypes = [];
		for(var i in Garp.dataTypes){
			if(Garp.dataTypes[i].Wysiwyg){
				dataTypes.push(Garp.dataTypes[i]);
			}
		}
		return dataTypes;
	},
	
	setExtraType: function(){
		if (this.el) {
			var type = this.getTopToolbar().extraTypesMenu.getValue();
			var wrap = this.el.select('.wysiwyg-body');
			Ext.each(this.extraTypes, function(t){
				wrap.removeClass(t[0]);
			}, this);
			wrap.addClass(type);
			this.ownerCt.extraType = type;
		} 
	},
	
	getExtraType: function(){
		return this.getTopToolbar().extraTypesMenu.getValue();
	},
	
	
		/**
		 * function getRange
		 *
		 * @experimental
		 *
		 * @return the current mouse selected range
		 */
		getRange: function(){
			var range, sel, container;
			
			sel = window.getSelection();
			if (sel.getRangeAt) {
				if (sel.rangeCount > 0) {
					range = sel.getRangeAt(0);
				}
			} else {
				// Old WebKit
				range = document.createRange();
				range.setStart(sel.anchorNode, sel.anchorOffset);
				range.setEnd(sel.focusNode, sel.focusOffset);
				
				// Handle the case when the selection was selected backwards (from the end to the start in the document)
				if (range.collapsed !== sel.isCollapsed) {
					range.setStart(sel.focusNode, sel.focusOffset);
					range.setEnd(sel.anchorNode, sel.anchorOffset);
				}
			}
			return range;
		},
	
	setupTbar: function(){
		
		function addMenuFactory(){
			var menu = [{
				text: __('Add chapter'),
				iconCls: 'icon-wysiwyg-add-chapter',
				handler: function(){
					this.ownerCt.addWysiwygCt({
						type:''
					}, this);
				},
				scope: this
			},'-'];
			Ext.each(this.getWysiwygDataTypes(), function(model){
				menu.push({
					text: __(model.text),
					iconCls: model.iconCls,
					handler: function(){
						var box = new model.Wysiwyg({
							ct: this,
							maxCols: this.maxCols,
							_data: {}
						});
					},
					scope: this
				});
			}, this);
			return menu;
		}
		
		this.tbar = new Ext.Toolbar({
			cls: 'garp-formpanel-toolbar',
			padding: '0 10 0 10',
			width: '100%', // @FIXME: width doesnt seem to work
			defaults: {
				xtype: 'button',
				scope: this
			},
			items: [{
				iconCls: 'icon-new',
				text: __('Add'),
				ref: 'addBtn',
				menu: addMenuFactory.call(this)
			}, ' ', {
				xtype: 'combo',
				editable: false,
				forceSelection: true,
				triggerAction: 'all',
				ref: 'extraTypesMenu',
				store: this.extraTypes,
				value: '',
				listeners: {
					select: function(menu, v){
						this.ownerCt.ownerCt.setExtraType();
						this.blur();
						return true;
					}
				}
			}, ' ', ' ', {
				iconCls: 'icon-wysiwyg-bold',
				ref: 'boldBtn',
				clickEvent: 'mousedown',
				enableToggle: true,
				handler: function(b, e){
					e.preventDefault();
					document.execCommand('Bold', false, null);
				}
			}, {
				iconCls: 'icon-wysiwyg-italic',
				ref: 'italicBtn',
				clickEvent: 'mousedown',
				enableToggle: true,
				handler: function(b, e){
					e.preventDefault();
					document.execCommand('Italic', false, null);
				}
			}, {
				iconCls: 'icon-wysiwyg-orderedlist',
				ref: 'insertorderedlistBtn',
				clickEvent: 'mousedown',
				enableToggle: true,
				handler: function(b, e){
					e.preventDefault();
					document.execCommand('Insertorderedlist', false, null);
				}
			}, {
				iconCls: 'icon-wysiwyg-unorderedlist',
				ref: 'insertunorderedlistBtn',
				clickEvent: 'mousedown',
				enableToggle: true,
				handler: function(b, e){
					e.preventDefault();
					document.execCommand('Insertunorderedlist', false, null);
				}
			}, {
				iconCls: 'icon-wysiwyg-createlink',
				ref: 'createlinkBtn',
				clickEvent: 'mousedown',
				enableToggle: true,
				handler: function(b, e){
					e.preventDefault();
					
					var scope = this;
					
					function isAlreadyLink(){
						var isLink = false;
						if (scope.getCurrentTagName() == 'A') { // now select node contents:
							scope.getRange().selectNodeContents(scope.getRange().endContainer);
							return true;
						}
						Ext.each(scope.getRange().endContainer.childNodes, function(node){
							if (node.nodeName && node.nodeName == 'A') {
								isLink = true;
								return false;
							}
						});
						return isLink;
					}
					
					
					if (isAlreadyLink()) {
						document.execCommand('Unlink', false, null);
					} else {
						var sel = this.getSelection();
						var txt = sel.toString();
						if (txt) {
							var range = scope.getRange();
							
							var dialog = new Ext.Window({
								title: __('Add link'),
								iconCls: 'icon-richtext-add-link',
								width: 445,
								modal: true,
								height: 240,
								border: true,
								layout: 'fit',
								defaultButton: '_url',
								items: [{
									xtype: 'fieldset',
									bodyCssClass: 'garp-dialog-fieldset',
									labelWidth: 160,
									items: [{
										xtype: 'textfield',
										fieldLabel: __('Url'),
										name: 'url',
										id: '_url',
										vtype: 'mailtoOrUrl',
										allowBlank: false,
										plugins: [Garp.mailtoOrUrlPlugin],
										value: ''
									}, {
										xtype: 'textfield',
										fieldLabel: __('Title'),
										name: 'title',
										value: ''
									}, {
										xtype: 'checkbox',
										allowBlank: true,
										fieldLabel: __('Open in new window'),
										name: 'target',
										checked: ''
									}]
								}],
								buttonAlign: 'right',
								buttons: [{
									text: __('Cancel'),
									handler: function(){
										dialog.close();
									}
								}, {
									text: __('Ok'),
									ref: '../ok',
									handler: function(){
										var url = dialog.find('name', 'url')[0].getValue(), title = dialog.find('name', 'title')[0].getValue(), target = dialog.find('name', 'target')[0].getValue() == '1';
										
										var nwLink = document.createElement('a');
										
										nwLink.setAttribute('href', url);
										if (target) {
											nwLink.setAttribute('target', '_blank');
										}
										nwLink.setAttribute('title', title);
										nwLink.appendChild(document.createTextNode(txt));
										
										range.deleteContents();
										range.insertNode(nwLink);
										range.selectNodeContents(nwLink);
										sel.removeAllRanges();
										sel.addRange(range);
										
										
										dialog.close();
									},
									scope: this
								}]
							});
							dialog.show();
							dialog.items.get(0).items.get(0).clearInvalid();
							
							var map = new Ext.KeyMap([dialog.find('name', 'url')[0].getEl(), dialog.find('name', 'title')[0].getEl()], {
								key: [10, 13],
								fn: function(){
									dialog.ok.handler.call(this);
								},
								scope: this
							});
							
						}
					}
					
				}
			}, '->', {
				iconCls: 'icon-wysiwyg-move-up',
				tooltip: __('Move chapter up'),
				handler: this.moveChapter.createDelegate(this, [-1])
			}, {
				iconCls: 'icon-wysiwyg-move-down',
				tooltip: __('Move chapter down'),
				handler: this.moveChapter.createDelegate(this, [1])
			}, {
				text: __('Delete'),
				iconCls: 'icon-wysiwyg-remove-chapter',
				handler: function(){
					if (this.ownerCt.items.length > 1) {
						this.ownerCt.remove(this);
					} else {
						this.ownerCt.addWysiwygCt();
						this.ownerCt.remove(this);
					}
				}
			}]
		});
	},
	
	getSelection: function(){
		var ds = (typeof document.selection !== 'undefined' ? document.selection.createRange().text : (typeof document.getSelection === 'function') ? document.getSelection() : false);
		return ds;
	},
	
	getCurrentTagName: function(){
		var node = this.getSelection().focusNode;
		if (!node) {
			return;
		}
		return node.tagName ? node.tagName : (node.parentNode.tagName ? node.parentNode.tagName : '');
	},
	
	
	setupTbarWatcher: function(){
		var states = ['bold','italic','insertorderedlist','insertunorderedlist'];
		var scope = this;
		this.tbWatcherInterval = setInterval(function(){
			var tbar = scope.getTopToolbar();
			if(!tbar || Ext.select('.wysiwyg-box').elements.length === 0) {
				return;
			}
			
			tbar.createlinkBtn.toggle(scope.getCurrentTagName() == 'A', false);

			for(var c=0, l = states.length; c<l; c++){
				var state = states[c];
				try {
					tbar[state + 'Btn'].toggle(document.queryCommandState(state), false);
				} catch(e){
					// querycommandstate doesnt always want to run.
					// @TODO find solution??
				}
			}
		}, 100);
	},
	
	setupKeyboardHandling: function(){
		Ext.EventManager.on(document, 'keypress', function(e){
			if (e.ctrlKey) {
				var c = e.getCharCode(), cmd;
				if (c > 0) {
					c = String.fromCharCode(c);
					switch (c) {
						case 'b':
							cmd = 'Bold';
							break;
						case 'i':
							cmd = 'Italic';
							break;
					}
					if(cmd && this.body.dom && this.body.dom.execCommand){
						this.body.dom.execCommand(cmd, false, null);
						e.preventDefault();
					}
				}
			}
		}, this);
	},
	
	afterAdd: function(){
		this.doLayout();
		this.setupDD();
	},
	
	removeWysiwygBox: function(box){
		this.remove(box.id);
		this.doLayout();
	},
	
	/**
	 * ColClasses be gone
	 * @param {Object} el
	 */
	removeColClasses: function(el){
		if (!el) {
			return;
		}
		for (var i = 1; i <= this.maxCols; i++) {
			Ext.get(el).removeClass('grid-' + i + '-' + this.maxCols);
		}
	},
	
	/**
	 * What width does this item have?
	 * @param {Object} el
	 */
	getCurrentColCount: function(el){
		for (var i = this.maxCols; i > 0; i--) {
			if (el.hasClass('grid-' + i + '-' + this.maxCols)) {
				return i;
			}
		}
		return this.maxCols;
	},
	
	/**
	 * Setup Drag 'n Drop handlers & Ext resizer for all 'boxes'
	 */
	setupDD: function(){
	
		var wysiwygct = this;
		var dragables = Ext.query('.wysiwyg-box');
		this.getEl().addClass('disabled-targets');
		
		Ext.dd.ScrollManager.register(this.body);
		Ext.apply(Ext.dd.ScrollManager, {
	        vthresh: 50,
	        hthresh: -1,
	        animate: false, // important! Otherwise positioning will remain; resulting in off-set wysiwyg's
	        increment: 200
	    });
		
		Ext.each(dragables, function(elm){
		
			if (elm.resizer) {
				elm.resizer.destroy();
			}
			
			var w = null;
			var currentSize;
			
			// set up resizer:
			elm.resizer = new Ext.Resizable(elm.id, {
				handles: 'e',
				dynamic: true,
				transparent: true,
				listeners: {
					'beforeresize': function(){
						w = this.getEl().getWidth();
					},
					'resize': function(){
						var el = this.getEl();
						var nw = el.getWidth();
						var count = wysiwygct.getCurrentColCount(el);
						var newCol = Math.ceil(wysiwygct.maxCols / (wysiwygct.getWidth() / nw));
						if (newCol < 1) {
							newCol = 1;
						}
						if (w < nw) {
							if (count >= wysiwygct.maxCols) {
								newCol = wysiwygct.maxCols;
							}
							wysiwygct.removeColClasses(el);
							el.addClass('grid-' + (newCol) + '-' + wysiwygct.maxCols);
						} else {
							if (count <= 1) {
								newCol = 1;
							}
							wysiwygct.removeColClasses(el);
							el.addClass('grid-' + (newCol) + '-' + wysiwygct.maxCols);
						}
						el.setWidth('');
						el.setHeight('');
						Ext.getCmp(el.id).fireEvent('user-resize', w, nw, 'grid-' + newCol + '-' + wysiwygct.maxCols);
					}
				}
			});
			
			var dd = new Ext.dd.DD(elm, 'wysiwyg-dragables-group', {
				isTarget: false,
				ignoreSelf: true,
				scroll: true
			});
			
			Ext.apply(dd, {
			
				wysiwygct: wysiwygct,
				
				possibleSuspect: null,
				
				b4Drag: function(){
					if(!this.el){
						return;
					}
				},
				
				b4StartDrag: function(){
					if (!this.el) {
						this.el = Ext.get(this.getEl());
					}
					this.el.addClass('in-drag');
					this.originalXY = this.el.getXY();
				},
				
				startDrag: function(){
					this.wysiwygct.getEl().removeClass('disabled-targets');
				},
				
				onInvalidDrop: function(){
					this.invalidDrop = true;
				},
				
				removeDropHiglight: function(){
					Ext.select('.wysiwyg-box .active').each(function(el){
						el.removeClass('active');
					});
					delete this.possibleSuspect;
				},
				
				onDragOver: function(e, id){
					var possible = Ext.get(id);
					if (possible.parent('#' + this.el.id)) {
						return; // Don't allow DD on self!
					}
					this.removeDropHiglight();
					possible.addClass('active');
					this.possibleSuspect = possible;
				},
				
				onDragOut: function(e, id){
					this.removeDropHiglight();
				},
				
				endDrag: function(e, id){

					this.el.removeClass('in-drag');
					this.wysiwygct.getEl().addClass('disabled-targets');
					
					if (this.possibleSuspect) {
					
						var p = Ext.get(this.possibleSuspect);
						var top = p.hasClass('top');
						var bottom = p.hasClass('bottom');
						var left = p.hasClass('left');
						var right = p.hasClass('right');
						
						p = p.findParent('.wysiwyg-box');
					
						if (top || left) {
							this.el.insertBefore(p);
						} else {
							this.el.insertAfter(p);
						}
						this.el.frame(null,1);
						
					} else {
						this.el.moveTo(this.originalXY[0], this.originalXY[1]);
						delete this.invalidDrop;
					}
					
					this.removeDropHiglight();
					wysiwygct.setupDD();
					this.el.clearPositioning();
					this.el.setStyle('position','relative');
				}
				
			});
			var el = Ext.get(elm);
			var handle = el.child('.dd-handle').id;
			dd.setHandleElId(handle);
			
			var targetTop = new Ext.dd.DDTarget(el.child('.top').id, 'wysiwyg-dragables-group', {});
			var targetRight = new Ext.dd.DDTarget(el.child('.right').id, 'wysiwyg-dragables-group', {});
			var targetBottom = new Ext.dd.DDTarget(el.child('.bottom').id, 'wysiwyg-dragables-group', {});
			var targetLeft = new Ext.dd.DDTarget(el.child('.left').id, 'wysiwyg-dragables-group', {});
		});
		
		this.getEl().addClass('disabled-targets');
		if(this.extraType){
			this.getTopToolbar().extraTypesMenu.setValue(this.extraType).fireEvent('select');
		}
	},
	
	/**
	 * Utility function for vertical align
	 */
	verticalCenter: function(){
		this.el.select('.vertical-center').each(function(el){
			el.setHeight(el.parent().getHeight());
		});
	},
	
	/**
	 * I.N.I.T.
	 * @param {Object} ct
	 */
	initComponent: function(){
		
		this.setupTbar();
		this.setupTbarWatcher();
		this.setupKeyboardHandling();
		
		Garp.Wysiwygct.superclass.initComponent.call(this, arguments);
		
		this.on('afterlayout', this.setupDD, this, {
			single: true
		});
		
		this.on('afterrender', function(){
			this.body.wrap({
				tag: 'div',
				cls: 'wysiwyg-wrap'
			});
			this.verticalCenter();
		}, this);
		
		this.on('add', function(scope, comp){
			
			scope.verticalCenter();
			
			comp.on('showsettings', function(cmp, e){
				
				// @TODO: decide if this needs to go to wysiwyg box ?
				if (Garp.dataTypes.ContentNode.getField('type').store) {
					var items;
					var menuItems = [];
					
					
					items = cmp.getMenuOptions ? cmp.getMenuOptions() : false;
					if (items) {
						menuItems = items;
						menuItems.push('-');
					}
					
					items = Garp.dataTypes.ContentNode.getField('type').store;
					if (items) {
						Ext.each(items, function(cl){
							var item = {
								text: cl[1],
								val: cl[0]
							};
							if (cmp.el.hasClass(cl[0])) {
								item.checked = true;
							}
							menuItems.push(item);
						});
					}
					var menu = new Ext.menu.Menu({
						defaults: {
							group: 'type',
							handler: function(v){
								Ext.each(items, function(cl){
									this.el.removeClass(cl[0]);
								}, this);
								this.el.addClass(v.val);
								this.type = v.val;
								scope.verticalCenter();
								if(this.onSettingsMenu){
									this.onSettingsMenu(v);
								}
							},
							scope: this
						},
						items: menuItems
					});
					menu.showAt(e.getXY());
				}
			});
		});
	},
	
	onDestroy: function(ct){
		if (this.tbWatcherInterval) {
			clearInterval(this.tbWatcherInterval);
		}
	}
	
});
Ext.reg('wysiwygct', Garp.Wysiwygct);

/* * * * */
Garp.Chapterct = Ext.extend(Ext.Panel,{

	autoScroll: true,
	autoHeight: true,
	border: false,
	bodyBorder: false,
	cls: 'chapter-ct',
	maxCols: null,
	
	extraTypes: null,
	
	getWysiwygIdx: function(wysiwyg){
		var idx = 0;
		if (wysiwyg) {
			this.items.each(function(i,c){ // find index of caller to find inserting position
				if(i == wysiwyg){
					idx = c;
					return false;
				}
			});
		} 
		return idx;
	},
	
	addWysiwygCt: function(cfg, callerWysiwyg){
		var ct;
		
		this.insert(this.getWysiwygIdx(callerWysiwyg) + 1, ct = new Garp.Wysiwygct({
			ct: this,
			extraTypes: this.extraTypes,
			extraType: cfg && cfg.type ? cfg.type : '',
			maxCols: this.maxCols
		}));
			
		this.doLayout();
		
		return ct;
	},
	
	/*
	bbar: new Ext.Toolbar({
		width: '100%',
		style: 'border: 0',
		items: ['->',{
			text: __('Add'),
			iconCls: 'icon-wysiwyg-add-chapter',
			handler: function(){
				this.ownerCt.ownerCt.addWysiwygCt();
			}
		}]
	}),*/
		
	/**
	 * I.N.I.T.
	 * @param {Object} ct
	 */
	initComponent: function(ct){
		Garp.Chapterct.superclass.initComponent.call(this, arguments);
	},
	
	afterRender: function(){
		this.on('resize', function(){
			this.items.each(function(i){
				i.setWidth(this.getWidth());
			}, this);
		}, this);
		this.addWysiwygCt();
		Garp.Chapterct.superclass.afterRender.call(this, arguments);
	}
	
});
Ext.reg('chapterct', Garp.Chapterct);
/**
 * Wysiwyg Abstract Class
 */
Garp.WysiwygAbstract = Ext.extend(Ext.BoxComponent, {
	
	/**
	 * Reference to wysiwygct 
	 */
	ct: null,
	
	/**
	 * Whether or not to show a settingsMenu
	 */
	settingsMenu: true,
	
	/**
	 * Reference to Garp.dataType
	 */
	model: 'Text',
	
	data :{},
	_data: {},
	_classes: null,
	
	/**
	 * Retrieve contents
	 */
	getValue: function(){
		if (this.getData()) {
			return {
				columns: this.col ? this.col.split('-')[1] : null,
				data: this.getData(),
				model: this.model,
				type: '',
				classes: this.getClasses()
			};
		}
		return null;
	},
	
	/**
	 * innerHTML
	 */
	html: 
		'<div class="dd-handle icon-move"></div>' + 
		'<div class="dd-handle icon-delete"></div>' +
		'<div class="dd-handle icon-settings"></div>' + 
		'<div class="target top"></div>' +
		'<div class="target right"></div>' +
		'<div class="target bottom"></div>' + 
		'<div class="target left"></div>',
	
	/**
	 * Shortcut reference, wil get set on init
	 */	
	contentEditableEl: null,
	
	/**
	 * Default Col class
	 */
	col: null,
	
	/**
	 * Get innerHtml data
	 */
	getData: function(){
		return {
			description: this.contentEditable ? this.contentEditableEl.dom.innerHTML : ''
		};
	},
	
	/**
	 * 
	 */
	getType: function(){
		return this.type || '';
	},

	/**
	 * Overridable
	 * @param {Object} component (this)
	 * @param {Object} evt
	 */
	showSettingsMenu: function(cmp,e){
		this.fireEvent('showsettings', cmp, e);
	},

	showAnimClassesDialog: function(cmp, e){
		Ext.Msg.prompt(__('Garp'), __('Enter animation classes'), function(btn, classes){
			if (btn === 'ok') {
				this.setClasses(classes);
			}
		}, this, true, this.getClasses() || 'ani-');
	},
	
	getClasses: function(){
		return this._classes;
	},

	setClasses: function(classes){
		this._classes = classes;
	},

	/**
	 * 
	 * @param {Object} ct
	 */
	afterRender: function(ct){
		Garp.WysiwygAbstract.superclass.afterRender.call(this, arguments);
		this.el.select('.dd-handle.icon-delete').on('click', function(){
			if (this.ownerCt) {
				this.ownerCt.removeWysiwygBox(this);
			}
		}, this);
		if (this.settingsMenu) {
			this.el.select('.dd-handle.icon-settings').on('click', function(e){
				this.showSettingsMenu(this, e);
			}, this);
		} else {
			this.el.select('.dd-handle.icon-settings').hide();
		}
	},
	
	/**
	 * Override beforeInit to add setup -> callback
	 */
	beforeInit: false,
	
	/**
	 * Aferinit gets called as callback after setup if beforeInit is overridden 
	 */
	afterInit: function(){
		if (!this.col) {
			this.col = 'grid-' + this.maxCols + '-' + this.maxCols;
			this.addClass(this.col);
		}
		this.ct.add(this);
		this.ct.afterAdd();
	},
	
	/**
	 * 
	 */
	initComponent: function(){
		Garp.WysiwygAbstract.superclass.initComponent.call(this, arguments);
		
		if(this.beforeInit){
			this.beforeInit(this.afterInit);
		} else {
			this.afterInit();
		}
		this.on('user-resize', function(w, nw, nwCol){
			this.col = nwCol;
		}, this);
	}
});
/**
 * @class Garp.FilterMenu
 * @plugin Ext.PagingToolbar
 * @author Peter
 *
 * Creates a menu button for the paging toolbar, with basic filter options
 *
 */
Garp.FilterMenu = function(){
	
	this.init = function(tb){
		
		/**
		 * Reference to the toolbar
		 */
		this.tb = tb;
		
		this.defaultFilter = {
			text: __('All'),
			ref: 'all'
		};
		
		/**
		 * Resets the button and the menu. (Provides only visual feedback: no filter applied)
		 */
		this.resetUI = function(){
			this.tb.filterBtn.setIconClass('icon-filter-off');
			this.tb.filterBtn.menu.all.setChecked(true);
			this.tb.filterStatus.hide();
			this.tb.filterStatus.update('');
		};
		
		/**
		 * Checks the model for possible fields to filter on. If it's not in the model, we can't put it as a filter option in the menu
		 */
		this.buildMenu = function(){
			
			var menuOptions = [];
			if(Garp.dataTypes[Garp.currentModel].filterMenu){
				Ext.each(Garp.dataTypes[Garp.currentModel].filterMenu, function(i){
					menuOptions.push(i);
				});
			}
			var model = Garp.dataTypes[Garp.currentModel];
			menuOptions.push(this.defaultFilter);
			if(model.getColumn('published')){
				menuOptions.push({
					text: __('Drafts'),
					ref: 'drafts'
				},{
					text: __('Published'),
					ref: 'published'
				});
			}
			if (model.getColumn('author_id')) {
				menuOptions.push({
					text: __('My items'),
					ref: 'my'
				});
			}
			
			Ext.each(menuOptions, function(option){
				if(typeof option.isDefault !== 'undefined' && option.isDefault){
					this.defaultFilter = option;
					return false;
				}
			}, this);
			
			return menuOptions;
		};
		
		/**
		 * Applies the selected filter and reflects the UI
		 * @param {Object} menu item
		 */
		function applyFilter(item){
			
			var grid = tb.ownerCt;
			var storeParams = grid.getStore().baseParams;
			
			if (!storeParams.query) {
				storeParams.query = {};
			}
			
			delete storeParams.query.online_status;
			delete storeParams.query.author_id;
			
			if(typeof Garp.dataTypes[Garp.currentModel].clearFilters == 'function'){
				Garp.dataTypes[Garp.currentModel].clearFilters();
			} else if (item.ref == 'all'){
				storeParams.query = {};
			}
			
			switch (item.ref) {
				case 'published':
					Ext.apply(storeParams.query, {
						online_status: '1'
					});
					break;
				case 'drafts':
					Ext.apply(storeParams.query, {
						online_status: '0'
					});
					break;
				case 'my':
					Ext.apply(storeParams.query, {
						author_id: Garp.localUser.id
					});
					break;
				default:
					break;
			}
			grid.getStore().reload();
			return true;
		}
		
		/**
		 * Build the menu 
		 */
		this.filterMenu = this.buildMenu();
		
		this.filterStatus = tb.add({
			ref: 'filterStatus',
			text: this.defaultFilter.ref !== 'all' ? this.defaultFilter.text : '',
			xtype: 'tbtext',
			hidden: (this.defaultFilter.ref === 'all')
		});
		
		/**
		 * Create the button
		 */
		this.filterBtn = tb.add({
			ref: 'filterBtn',
			tooltip: 'Filter',
			iconCls: (this.defaultFilter.ref == 'all' ? 'icon-filter-off' : 'icon-filter-on'),
			hidden: (this.filterMenu.length <= 1),
			menu: {
				defaultType: 'menucheckitem',
				defaults: {
					group: 'filter',
					handler: applyFilter,
					scope: this
				},
				items: this.filterMenu
			}
		});
		
		// Set default as checked:
		this.filterBtn.menu.find('text', this.defaultFilter.text)[0].setChecked(true);
		
		// Reflect UI on menu changes:
		this.filterBtn.menu.on('itemclick', function(item, evt){
			if(item.ref === 'all'){
				this.filterStatus.update('');
				this.filterStatus.hide();
				this.filterBtn.setIconClass('icon-filter-off');
				return;
			} else if (item.text) {
				this.filterStatus.update(item.text);
			}
			this.filterStatus.show();
			this.filterBtn.setIconClass('icon-filter-on');
		}, this);
		
		// Make sure we don't end up with an "No items to display" AND a filter Status text: 
		this.tb.on('change', function(tb){
			if(tb.store.getCount() === 0){
				this.filterStatus.hide();
			} else {
				this.filterStatus.show();
			}
		});
	};
};

Ext.ns('Garp');

Garp.TweetWindow = Ext.extend(Ext.util.Observable,{
	
	urlPart: '',
	width: 550,
	height: 460,
	x: 320,
	y: 120,
	bodyBorder: false,
	url: 'https://twitter.com/intent/tweet?',
	
	constructor: function(config){
		Ext.apply(this, config);
		this.winId = 'tweet-' + Ext.id();
		var opts = new Ext.Template('chrome=no,menubar=no,toolbar=no,scrollbars=no,width={width},height={height},left={left},top={top}');
		opts = opts.apply({
			width: this.width,
			height: this.height,
			left: this.x,
			top: this.y
		});
		this.win = window.open(this.url + this.urlPart, 'tweet-' + this.winId, opts);
		this.win.focus();
		Garp.TweetWindow.superclass.constructor.call(this, config);
	}
});

/**
 * Garp TweetField. Simple extension with default handlers.
 */
Garp.TweetField = Ext.extend(Ext.Panel,{
	border:false,
	layout:'hbox',
	fieldLabel: __('Twitter description'),
	showTW: true,
	showFB: true,
	showIN: true,
	
	loadScript: function(src, load){
		var s = document.createElement('script');
		if (load) {
			s.src = src;
		} else {
			s.innerHtml = src;
		}
		Ext.select('head').first().dom.appendChild(s);
	},
	
	initComponent: function(ct){
		
		this.loadScript('http://platform.linkedin.com/in.js', true);
		this.loadScript('http://connect.facebook.net/en_US/all.js', true);
		this.loadScript("if(typeof FB != 'undefined' && FB.init){FB.init({ appId: FB_APP_ID,cookie:true, status:true, xfbml:true});}");
		
		this.twitterExcerpt = new Ext.form.TextArea({
			name:'twitter_description',
			messageTarget: 'side',
			maxLength: 119,
			countBox: 'twitterCount',
			flex: 1,
			margins: '0 5 0 0',
			ref: '../../../../twitterExcerpt',
			allowBlank: true
		});
		
		this.items = [this.twitterExcerpt, {
			xtype: 'button',
			name: 'tweetBtn',
			margins: '0 5 0 0',
			hidden: !this.showTW,
			ref: '../../../../tweetBtn',
			width: 32,
			handler: function(b, e){
				var fp = this.refOwner;
				if (!fp) {
					return;
				}
				if (fp.bitly_url.getValue()) {
					var msg = fp.twitterExcerpt.getValue();
					msg += ' ';
					msg += fp.bitly_url.getValue();
					var win = new Garp.TweetWindow({
						urlPart: Ext.urlEncode({
							'text': msg
						}),
						x: e.getPageX(),
						y: e.getPageY()
					});
				} else {
					Ext.Msg.alert('Garp', __('In order to tweet, you need to save your data first.'));
				}
			},
			iconCls: 'icon-twitter'
		}, {
			xtype: 'button',
			margins: '0 5 0 0',
			hidden: !this.showFB,
			name: 'fbBtn',
			ref: '../../../../fbBtn',
			width: 32,
			handler: function(b, e){
				var fp = this.refOwner;
				if (!fp) {
					return;
				}
				if (fp.bitly_url.getValue()) {
					var msg = fp.twitterExcerpt.getValue();
					msg += ' ';
					msg += fp.bitly_url.getValue();
					var lm = new Ext.LoadMask(Ext.getBody(), {
						text: __('Please wait')
					});
					lm.show();
					FB.ui({
						method: 'feed',
						description: fp.twitterExcerpt.getValue(),
						link: fp.bitly_url.getValue(),
						show_error: true
					}, function(response){
						lm.hide();
					});
				} else {
					Ext.Msg.alert('Garp', __('In order to FB, you need to save your data first.'));
				}
			},
			iconCls: 'icon-fb'
		}, {
			xtype: 'button',
			hidden: !this.showIN,
			name: 'inBtn',
			ref: '../../../../inBtn',
			width: 32,
			handler: function(b, e){
				var fp = this.refOwner;
				if (!fp) {
					return;
				}
				
				function confirmStatusUpdate(){
					if (fp.bitly_url.getValue()) {
						var msg = fp.twitterExcerpt.getValue();
						var link = fp.bitly_url.getValue();
						msg.replace('"', '\"');
						msg += ' ';
						msg += '<a href=\"' + link + '\">' + link + '</a>';
					}
					Ext.MessageBox.confirm(__('Garp'), __('Do you want to update your linkedIn status? <br>') + msg, function(btn){
						if (btn == 'yes') {
						
							var lm = new Ext.LoadMask(Ext.getBody(), {
								text: __('Please wait')
							});
							lm.show();
							updateURL = "/people/~/person-activities";
							IN.API.Raw(updateURL).method("POST").body('{"contentType":"linkedin-html","body":"' + msg + '"}').result(function(r){
								lm.hide();
							}).error(function(error){
								lm.hide();
								Ext.MessageBox.alert(__('Garp'), __('Something went wrong while updating your status'));
								//console.log(error);
							});
						}
					});
				}
				
				if (IN.User.isAuthorized()) {
					confirmStatusUpdate();
				} else {
					IN.User.authorize(confirmStatusUpdate, this);
				}
			},
			iconCls: 'icon-linkedin'
		}, {
			xtype: 'box',
			ref: '../../../../twitterCount',
			width: 60,
			cls: 'garp-countbox'
		}];
		
		Garp.TweetField.superclass.initComponent.call(this, ct);
	}
});
Ext.reg('tweetfield',Garp.TweetField);

Ext.ns('Garp');

Garp.ImageEditor = Ext.extend(Ext.Panel,{

//
//	id: 'imageEditor',
//
	layout:'fit',
	border: false,
	bodyStyle: 'backgroundColor: #888',

	updateOutline: function(){
		var crop = Ext.get(this.crop);
		var img = Ext.get(this.img);
		
		var x = img.getX() - crop.getX();
		var y = img.getY() - crop.getY();
	//	var w = crop.getWidth();
	//	var h = crop.getHeight();
		
		//var aspectRatio = 9/16;
		
		//crop.setHeight(w * aspectRatio);
		
		var tl = x + 'px ' + y + 'px';
		crop.setStyle({'background-position':tl});
		this.dd.constrainTo(this.img);
		return true;
	},
	
	setupEditor: function(){
		var scope = this;
		var i = new Image();
		Ext.get(i).on({
			'load': function(){
				this.img = Ext.DomHelper.append(scope.body, {
					tag: 'img',
					src: i.src,
					cls: 'imageeditor-subject',
					width: i.width,
					height: i.height
				});
				
				Ext.get(this.img).center(this.body);
				
				this.crop = Ext.DomHelper.insertAfter(this.img, {
					tag: 'div',
					cls: 'imageeditor-cropoutline',
					children: [{
						'tag': 'div',
						cls: 'imageeditor-cropoutline-mq',
						children: [{
							tag: 'div',
							cls: 'left'
						}, {
							tag: 'div',
							cls: 'right'
						}, {
							tag: 'div',
							cls: 'top'
						}, {
							tag: 'div',
							cls: 'bottom'
						}]
					}],
					style: {
						width: i.width + 'px',
						height: i.height + 'px',
						background: 'url(' + i.src + ')',
						'background-repeat': 'no-repeat'
					}
				});
				
				this.resizer = new Ext.Resizable(this.crop, {
					handles: 'all',
					transparent: true,
					constrainTo: this.img,
					dynamic: false,
					width: 200,
					height: 200 * (9/16),
					preserveRatio: true,
					
					listeners: {
						'resize' :this.updateOutline.createDelegate(this)
					}
				});
				
				Ext.get(this.crop).center(this.body);
				this.dd = Ext.get(this.crop).initDD(null,null,{
					onDrag: this.updateOutline.createDelegate(this)
				});
				this.dd.constrainTo(this.img);
				
				var cropEl = Ext.get(this.crop);
				var img = Ext.get(this.img);
				cropEl.setTop(img.getTop(true) + 10),
				cropEl.setLeft(img.getLeft(true) + 30),
				
				this.updateOutline();
				
			},
			'error': function(){
				//@TODO: implement
			},
			scope: this
		},this);
		 
		i.src = this.image;
	},
	
	initComponent: function(){
		
		this.addEvents('done');
		
		this.buttonAlign = 'left';
		this.buttons = [{
			xtype: 'box',
			html: __('Drag the selection, or drag the corners to resize the selection.')
		}, '->' ,{
			text: __('Ok'),
			scope: this,
			handler: function(){
				this.fireEvent('done', [this.image]);
			}
		}];

		Garp.ImageEditor.superclass.initComponent.call(this);
		this.on('afterrender', this.setupEditor.createDelegate(this));
	}
});
Ext.ns('Garp');

Garp.ImagePickerWindow = Ext.extend(Ext.Window, {

	/**
	 * @cfg image grid query, to instantiate the grid with (search for current images' id for example)
	 */
	imgGridQuery: null,

	/**
	 * @cfg the current image caption value
	 */
	captionValue: null,

	/**
	 * @cfg the current image align value
	 */
	alignValue: '',

	/**
	 * @cfg curent crop template value
	 */
	cropTemplateName: null,

	/**
	 * @cfg hide the wizard text
	 */
	hideWizardText: false,

	/**
	 * @cfg model reference. Usefull for extending imagePickerWindow for other datatypes
	 */
	model: 'Image',

	/**
	 * @cfg Title for dialog
	 */
	title: __('Image'),

	/**
	 * @cfg Icon for dialog
	 */
	iconCls: 'icon-image',

	// 'prviate' :
	layout: 'card',
	activeItem: 0,
	width: 640,
	height: 500,
	border: false,
	modal: true,
	buttonAlign: 'left',
	resizable: false,
	defaults: {
		border: false
	},

	/**
	 * pageHandler navigates to page
	 * @param {Number} direction (-1 = previous / 1 = next)
	 */
	navHandler: function(dir){
		var page = this.getLayout().activeItem.id;
		page = parseInt(page.substr(5, page.length), 10);
		page += dir;
		if(page <= 0){
			page = 0;
		}
		switch(page){
			case 1:

				this.tplGrid.getStore().on({

					load: {
						single: true,
						scope: this,
						fn: function(){
							if (!this.cropTemplateName) {
								this.tplGrid.getSelectionModel().selectFirstRow();
							} else {
								var rec = this.tplGrid.getStore().getAt(this.tplGrid.getStore().find('name', this.cropTemplateName));
								this.tplGrid.getSelectionModel().selectRecords([rec]);
							}
							if (!this.captionValue) {
								var caption = this.imgGrid.getSelectionModel().getSelected().get('caption');
								if (caption && CURRENT_LANGUAGE && caption.hasOwnProperty(CURRENT_LANGUAGE)) {
									caption = caption[CURRENT_LANGUAGE];
								}
								this.caption.getForm().findField('caption').setValue(caption);
							}
						}
					}
				});
				this.tplGrid.getStore().load();
				this.prevBtn.enable();
				this.nextBtn.setText(__('Ok'));

			break;
			case 2:
				var img = this.imgGrid.getSelectionModel().getSelected();
				var tpl = this.tplGrid.getSelectionModel().getSelected();
				this.fireEvent('select', {
					image: img,
					template: tpl,
					src: IMAGES_CDN + 'scaled/' + tpl.get('name') + '/' +  img.get('id'),
					align: this.alignment.getForm().getValues().align,
					caption: this.caption.getForm().getValues().caption
				});

				this.close();
			break;
			//case 0:
			default:
				this.prevBtn.disable();
				this.nextBtn.setDisabled( this.imgGrid.getSelectionModel().getCount() < 1 );
				this.nextBtn.setText(__('Next'));
			break;
		}

		this.getLayout().setActiveItem('page-' + page);
	},

	/**
	 * @function getStoreCfg
	 * @return store Cfg object
	 */
	getStoreCfg: function(){
		return {
			autoLoad: false,
			autoSave: false,
			remoteSort: true,
			restful: true,
			autoDestroy: true,
			root: 'rows',
			idProperty: 'id',
			fields: Garp.dataTypes[this.model].getStoreFieldsFromColumnModel(),
			totalProperty: 'total',
			sortInfo: Garp.dataTypes[this.model].sortInfo || null,
			baseParams: {
				start: 0,
				limit: Garp.pageSize,
				query: this.query || null
			},
			api: {
				create: Ext.emptyFn,
				read: Garp[this.model].fetch || Ext.emptyFn,
				update: Ext.emptyFn,
				destroy: Ext.emptyFn
			}
		};
	},

	/**
	 * @function getGridCfg
	 * @param hideHeader
	 * @return defaultGridObj
	 */
	getGridCfg: function(hideHeaders){
		return {
			border: true,
			region: 'center',
			hideHeaders: hideHeaders,
			enableDragDrop: false,
			//ddGroup: 'dd',
			sm: new Ext.grid.RowSelectionModel({
				singleSelect: true
			}),
			cm: new Ext.grid.ColumnModel({
				defaults:{
					sortable: true
				},
				columns: (function(){
					var cols = [];
					var cmClone = Garp.dataTypes[this.model].columnModel;
					for (var c = 0, l = cmClone.length; c < l; c++) {
						var col = Ext.apply({},cmClone[c]);
						cols.push(col);
					}
					return cols;
				}).call(this)
			}),
			pageSize: Garp.pageSize,
			viewConfig: {
				scrollOffset: -1, // No reserved space for scrollbar. Share it with last column
				forceFit: true,
				autoFill: true
			}
		};
	},

	/**
	 * update Preview panel
	 */
	updatePreview: function(){
		var tpl = this.tplGrid.getSelectionModel().getSelected().get('name');
		var w = 170;
		var h = 170;
		var id = this.imgGrid.getSelectionModel().getSelected().get('id');
		this.previewpanel.update({
			IMAGES_CDN: IMAGES_CDN,
			BASE: BASE,
			tpl: tpl,
			id: id,
			width: w,
			height: h,
			'float': this.alignment.getForm().getValues().align
		});

	},

	/**
	 * clears a current selection
	 */
	clearSelection: function(){
		this.fireEvent('select', {
			selected: null
		});
		this.close();
	},

	/**
	 * initComponent
	 */
	initComponent: function(){
		this.addEvents('select');

		this.imgStore = new Ext.data.DirectStore(Ext.apply({}, {
			writer: new Ext.data.JsonWriter({
				paramsAsHash: false,
				writeAllFields: true,
				encode: false
			}),
			api: {
				create: Ext.emptyFn,
				read: Garp[this.model].fetch,
				update: Ext.emptyFn,
				destroy: Ext.emptyFn
			}
		}, this.getStoreCfg()));

		this.imgGrid = new Ext.grid.GridPanel(Ext.apply({}, {
			region: 'center',
			title: __('Available'),
			itemId: 'imgPanel',
			margins: '15 15 15 15',
			store: this.imgStore,
			bbar: new Ext.PagingToolbar({
				pageSize: Garp.pageSize,
				store: this.imgStore,
				beforePageText: '',
				displayInfo: false
			}),
			tbar: new Ext.ux.Searchbar({
				xtype: 'searchbar',
				store: this.imgStore
			}),
			listeners: {
				'rowdblclick': this.navHandler.createDelegate(this, [1])
			}
		}, this.getGridCfg(true)));

		this.tplGrid = new Ext.grid.GridPanel({
			itemId: 'tplPanel',
			margins: '15 15 0 15',
			title: __('Crop'),
			region: 'center',
			hideHeaders: true,
			store: new Ext.data.DirectStore({
				autoLoad: true,
				autoSave: false,
				autoDestroy: true,
				remoteSort: true,
				restful: true,
				root: 'rows',
				idProperty: 'id',
				fields: [{
					name: 'name'
				}, {
					name: 'w'
				}, {
					name: 'h'
				}],
				api: {
					create: Ext.emptyFn,
					read: Garp.CropTemplate.fetch,
					update: Ext.emptyFn,
					destroy: Ext.emptyFn
				}
			}),
			sm: new Ext.grid.RowSelectionModel({
				singleSelect: true,
				listeners: {
					'rowselect': this.updatePreview,
					scope: this
				}
			}),
			cm: new Ext.grid.ColumnModel({
				defaults: {
					sortable: true
				},
				columns: [{
					id: 'name',
					dataIndex: 'name',
					header: __('Name'),
					width: 200
				}, {
					id: 'w',
					dataIndex: 'w',
					header: __('Width')
				},{
					id: 'h',
					dataIndex: 'h',
					header: __('Height')
				}, {
					id: 'preview',
					dataIndex: 'name',
					header: __('Preview'),
					renderer: Garp.renderers.cropPreviewRenderer
				}]
			}),
			viewConfig: {
				scrollOffset: -1, // No reserved space for scrollbar. Share it with last column
				forceFit: true,
				autoFill: true
			},
			listeners: {
				'rowdblclick': this.navHandler.createDelegate(this, [1])
			}
		});

		// "validate" upon selection:
		this.imgGrid.getSelectionModel().on('selectionchange', this.navHandler.createDelegate(this,[0]));
		this.tplGrid.getSelectionModel().on('selectionchange', function(){
			this.nextBtn.setDisabled(this.tplGrid.getSelectionModel().getCount() === 0 );
		}, this);

		var headerTpl = new Ext.Template('<h2>',__('Step'),' {step} ', __('of'), ' 2</h2><p>{description}</p>');

		this.items = [{
			id: 'page-0',
			layout: 'border',
			bodyBorder: true,
			border: true,
			split: false,
			items: [{
				region: 'north',
				ref: '../northpanel',
				border: false,
				html: this.hideWizardText ? '' : headerTpl.apply({
					description: __('Specify an image or add new one'),
					step: 1
				}),
				margins: '10 15 0 15',
				bodyBorder: false,
				bbar: new Ext.Toolbar({
					style: 'border:0; margin-top: 10px;',
					border: false,
					items: [{
						iconCls: 'icon-new',
						ref: 'newBtn',
						hidden: !Garp.dataTypes[this.model].quickCreatable,
						text: __('New ' + Garp.dataTypes[this.model].text),
						handler: function(){
							var win = new Garp.RelateCreateWindow({
								model: this.model,
								iconCls: this.iconCls,
								title: this.title,
								listeners: {
									scope: this,
									'aftersave': function(rcwin, rec){
										this.imgStore.insert(0, rec);
										this.imgGrid.getSelectionModel().selectRecords([rec], true);
										this.imgStore.reload();
									}
								}
							});
							win.show();
						},
						scope: this
					}]
				})
			}, this.imgGrid]
		},{
			id: 'page-1',
			layout: 'border',
			bodyBorder: true,
			border: true,
			split: false,
			items: [{
				region: 'north',
				border: false,
				margins: '10 15 0 15',
				html: headerTpl.apply({
					description: __('Specify a crop template, set aligning and/or add a caption'),
					step: 2
				})
			},this.tplGrid, {
				region: 'east',
				margins: '15 15 0 0',
				ref: '../previewpanel',
				width: 260,
				bodyStyle: 'background:#e0e0e0;',
				title: __('Preview'),
				tpl: '<p style="font-size:9px;"><img src="{IMAGES_CDN}scaled/{tpl}/{id}" style="float: {float};max-width: {width}px; max-height: {height}px; border: 1px #ddd solid; margin: 3px;" />Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>'
			},{
				region: 'south',
				border: false,
				bodyBorder: false,
				height: 145,
				margins: '15 15 15 15',
				bodyStyle: 'background-color: #eee',
				layout: 'border',
				defaults: {
					xtype: 'form',
					layout: 'form',
					labelWidth: 180,
					labelSeparator: '',
					border: true,
					bodyStyle: 'padding: 5px 0 0 5px'
				},
				items: [{
					title: __('Caption'),
					region: 'center',
					ref: '../../caption',
					bodyStyle: 'margin:0; padding:0;',
					items: [{
						border: false,
						fieldLabel: __('Caption'),
						hideLabel: true,
						xtype: 'textarea',
						style: 'border: 0;',
						height: 118,
						anchor: '100%',
						name: 'caption',
						value: this.captionValue
					}]
				},{
					title: __('Alignment'),
					region: 'east',
					width: 260,
					margins: '0 0 0 15',
					bodyStyle: 'padding: 10px',
					ref: '../../alignment',
					defaults:{
						handler: this.updatePreview,
						scope: this
					},
					items: [{
						fieldLabel: __('No alignment'),
						xtype: 'radio',
						name: 'align',
						checked: this.alignValue === '',
						inputValue: ''
					}, {
						fieldLabel: __('Align left'),
						xtype: 'radio',
						name: 'align',
						checked: this.alignValue == 'left',
						inputValue: 'left'
					}, {
						fieldLabel: __('Align right'),
						xtype: 'radio',
						name: 'align',
						checked: this.alignValue == 'right',
						inputValue: 'right'
					}]
				}]
			}]
		}];

		this.buttons = [{
			text: __('Previous'),
			ref: '../prevBtn',
			handler: this.navHandler.createDelegate(this, [-1])
		}, '->',{
			text: __('Cancel'),
			handler: function(){
				this.close();
			},
			scope: this
		},{
			text: __('Clear selection'),
			ref: '../clearBtn',
			hidden: true,
			handler: this.clearSelection.createDelegate(this)
		},{
			text: __('Next'),
			ref: '../nextBtn',
			handler: this.navHandler.createDelegate(this, [1])
		}];

		if(this.imgGridQuery){
			this.imgGrid.getStore().setBaseParam('query', this.imgGridQuery);
			this.imgGrid.getStore().on({
				load: {
					single: true,
					scope: this,
					fn: function(){
						this.imgGrid.getSelectionModel().selectFirstRow();
						this.navHandler(1); // go to page-2
					}
				}
			});
			var f = this.imgGrid.getTopToolbar().searchField;
			f.setValue(this.imgGridQuery.id);
			f.hasSearch = true;
			f.fireEvent('change');

		}

		Garp.ImagePickerWindow.superclass.initComponent.call(this);
		this.on('show', function(){
			this.navHandler(-1);
			if(!this.imgGridQuery){
				var keyNav = new Ext.KeyNav(this.imgGrid.getEl(), {
					'enter': this.navHandler.createDelegate(this, [1])
				});
			}
			this.imgStore.load();
			if(this.allowBlank){
				this.clearBtn.show();
			}
		},this);
	}
});

Ext.ns('Garp');

/**
 * Simple extension upon image picker window. We need 'half' it's functionality
 */
Garp.ModelPickerWindow = Ext.extend(Garp.ImagePickerWindow, {
	
	/**
	 * @cfg model: name of the model to pick from:
	 */
	model: null,
	
	/**
	 * @cfg: hide the default wizard text above
	 */
	hideWizardText: true,
	
	/**
	 * @cfg: allow grid deselect; no item will be returned on 'Ok'
	 */
	allowBlank: false,
	
	// 'private' :
	activeItem: 0,
	
	/**
	 * Override default navigation 
	 * @param {Object} dir
	 */
	navHandler: function(dir){
		var page = this.getLayout().activeItem.id;
		page = parseInt(page.substr(5, page.length), 10);
		page += dir;
		if(page <= 0){
			page = 0;
		}
		
		switch(page){
			case 1:
				var selected = this.imgGrid.getSelectionModel().getSelected();
				this.fireEvent('select', {
					selected: selected || null
				});
				this.close();
			break;
			//case 0:
			default:
				if (!this.allowBlank) {
					var sm =this.imgGrid.getSelectionModel();
					sm.on('selectionchange', function(){
						this.nextBtn.setDisabled(sm.getCount() != 1);
					}, this);
				}
				this.prevBtn.disable();
				this.nextBtn.setText(__('Ok'));
				this.nextBtn.setDisabled(!this.allowBlank);
			break;
			
		}
		
		this.getLayout().setActiveItem('page-' + page);
	},
	
	initComponent: function(){
		var m = Garp.dataTypes[this.model];
		this.setTitle(__(m.text));
		this.setIconClass(m.iconCls);
		Garp.ModelPickerWindow.superclass.initComponent.call(this);
	}
	
});
/**
 * Quick Create: RelateCreateWindow; simple form in a popup window to create a new record
 */
Ext.ns('Garp');

Garp.RelateCreateWindow = Ext.extend(Ext.Window,{

	model: '',
	iconCls: '',
	title: '',
	cls: 'relate-create-window',
	modal: true,
	width: 640,
	border: true,
	preventBodyReset: false,
	autoScroll: true,
	
	rec: null,
	
	quickCreatableInit: Ext.emptyFn,
	
	initComponent: function(){
	
		if (!this.iconCls) {
			this.setIconClass(Garp.dataTypes[this.model].iconCls);
		}
		if (!this.title) {
			this.setTitle(Garp.dataTypes[this.model].text);
		}
		this.addEvents('aftersave', 'afterinit');
		
		this.writer = new Ext.data.JsonWriter({
			paramsAsHash: false,
			encode: false
		});
		var fields = [];
		var cm = Garp.dataTypes[this.model].columnModel;
		Ext.each(cm, function(c){
			fields.push(c.dataIndex);
		});
		
		this.store = new Ext.data.DirectStore({
			fields: fields,
			autoLoad: false,
			autoSave: false,
			pruneModifiedRecords: true,
			remoteSort: true,
			restful: true,
			autoDestroy: true,
			root: 'rows',
			idProperty: 'id',
			sortInfo: Garp.dataTypes[this.model].sortInfo || null,
			baseParams: {
				start: 0,
				limit: Garp.pageSize
			},
			api: {
				create: Garp[this.model].create || Ext.emptyFn,
				read: Garp[this.model].fetch || Ext.emptyFn,
				update: Garp[this.model].update || Ext.emptyFn,
				destroy: Garp[this.model].destroy || Ext.emptyFn
			},
			writer: this.writer
		});
		
		var items = Ext.apply({}, Garp.dataTypes[this.model].formConfig[0].items[0]);
		var listeners = Ext.apply({}, Garp.dataTypes[this.model].formConfig[0].listeners);
		items = {
			ref: '../formcontent',
			items: [items],
			listeners: listeners,
			bodyCssClass: 'garp-formpanel',
			border: false
		};

		// Collapse fieldsets, to save some room (window is tiny as it is)
		for (var j = 0; j < items.items[0].items.length; ++j) {
			if ('collapsed' in items.items[0].items[j]) {
				items.items[0].items[j].collapsed = true;
			}
		}
		
		// Now hide disabled items, they have no function when adding a new item. It may otherwise confuse users:
		// Also: if the field is not in the columnModel, it has no place here in this window
		this.items = [{
			border: false,
			xtype: 'form',
			layout: 'form',
			ref: 'form',
			defaults: {
				autoWidth: true,
				border: false,
				bodyCssClass: 'garp-formpanel' // visual styling
			},
			items: items
		}];
		
		if (!this.buttons) {
			this.buttons = [];
		}
		this.buttons.push([{
			text: __('Cancel'),
			ref: '../cancelBtn',
			handler: function(){
				this.close();
			},
			scope: this
		}, {
			text: __('Ok'),
			ref: '../okBtn',
			handler: function(){
				this.saveAll(true);
			},
			scope: this
		}]);
		
		Garp.RelateCreateWindow.superclass.initComponent.call(this);
	},
	
	saveAll: function(doClose){
		if (!this.form.getForm().isValid()) {
			this.form.getForm().items.each(function(){
				this.isValid(); // marks the field also visually invalid if needed
			});
			return;
		}
		this.form.getForm().updateRecord(this.rec);
		this.store.on({
			'save': {
				fn: function(){
					this.rec = this.store.getAt(0);
					if (this.formcontent) {
						this.formcontent.fireEvent('loaddata', this.rec, this);
					}
					this.fireEvent('aftersave', this, this.rec);
					this.loadMask.hide();
					if (doClose) {
						this.close();
					}
				},
				single: true,
				scope: this
			}
		});
		if(this.store.save() !== -1){
			this.loadMask = new Ext.LoadMask(this.getEl());
			this.loadMask.show();
		}
	},
	
	afterRender: function(){
		Garp.RelateCreateWindow.superclass.afterRender.call(this);
		this.form.getForm().setValues(Garp.dataTypes[this.model].defaultData);
		if (this.onShow) {
			this.onShow.call(this);
		}
		var rec = new this.store.recordType(Ext.apply({}, Garp.dataTypes[this.model].defaultData));
		this.rec = rec;
		this.store.insert(0, rec);
		
		this.getForm = function(){
			return this.form.getForm();
		};
		
		this.on('save-all', this.saveAll, this);
		
		this.on('show', function(){
			this.formcontent.fireEvent('loaddata', rec, this);
			this.quickCreatableInit();
			this.getForm().clearInvalid();
			if (this.quickCreateReference) {
				var id = this.parentId || Garp.gridPanel.getSelectionModel().getSelected().get('id');
				this.getForm().findField(this.quickCreateReference).store.on('load', function(){
					this.getForm().findField(this.quickCreateReference).setValue(id);
				}, this, {
					single: true
				});
				this.getForm().findField(this.quickCreateReference).store.load();
				this.getForm().findField(this.quickCreateReference).hide();

				// this is dumb... have to reset the height after hiding the field
				this.setHeight(this.getHeight());
				this.center();
			}
			window.weenerdog = this;
			this.keymap = new Ext.KeyMap(this.formcontent.getEl(), [{
				key: Ext.EventObject.ENTER,
				ctrl: true,
				scope: this,
				handler: function(e){
					this.form.getForm().items.each(function(){
						this.fireEvent('blur', this);
					});
					this.okBtn.handler.call(this);
					return false;
				}
			}]);
			this.keymap.stopEvent = true; // prevents browser key handling.
			this.fireEvent('afterinit', this);
		}, this);
	}
});

/**
 * InlineRelator class
 */
Garp.InlineRelator = Ext.extend(Ext.Panel, {

	model: '',
	rule: null,
	rule2: null,
	unrelateExisting: true,
	localId: null,

	border: false,
	bodyBorder: false,
	autoHeight: true,
	autoScroll: true,

	getEmptyRecord: function(){
		return new this.relationStore.recordType();
	},

	setupStore: function(){
		var fields = Garp.dataTypes[this.model].getStoreFieldsFromColumnModel();
		/**
		 * For regular relationPanels we only fetch listFields. For this thingie we need 'em all,
		 * so grab 'em here to pass into the query.
		 */
		var fieldsForQuery = (function() {
			var out = [];
			for (var i = 0; i < fields.length; ++i) {
				out.push(fields[i].name);
			}
			return out;
		})();

		this.writer = new Ext.data.JsonWriter({
			paramsAsHash: false,
			encode: false
		});

		this.relationStore = new Ext.data.DirectStore({
			fields: fields,
			autoLoad: false,
			autoSave: false,
			pruneModifiedRecords: true,
			remoteSort: true,
			restful: true,
			autoDestroy: true,
			root: 'rows',
			idProperty: 'id',
			sortInfo: Garp.dataTypes[this.model].sortInfo || null,
			baseParams: {
				start: 0,
				limit: Garp.pageSize,
				fields: fieldsForQuery,
				query: ''
			},
			api: {
				create: Garp[this.model].create || Ext.emptyFn,
				read: Garp[this.model].fetch || Ext.emptyFn,
				update: Garp[this.model].update || Ext.emptyFn,
				destroy: Garp[this.model].destroy || Ext.emptyFn
			},
			writer: this.writer,
			listeners: {
				'beforeload': {
					fn: function(){
						if (!this.localId) { // new records have no id so we can't load it's relations; there are none
							return false;
						}
						return true;
					},
					scope: this
				},
				'load': {
					fn: function(){
						this.addInlineForms();
						if (this.relationStore.getCount() === 0 && !this.addBtn) {
							this.addAddBtn();
						}
					},
					scope: this
				}
			}
		});
	},

	addAddBtn: function(){
		this.add({
			xtype: 'button',
			ref: 'addBtn',
			iconCls: 'icon-new',
			text: __(Garp.dataTypes[this.model].text),
			handler: function(btn){
				this.remove(btn);
				this.addForm();
			},
			scope: this
		});
		this.doLayout();
	},

	addInlineForms: function(){
		this.relationStore.each(function(rec){
			this.add({
				xtype: 'inlineform',
				rec: rec,
				model: this.model,
				inlineRelator: this
			});
		}, this);
		this.doLayout();
	},

	addForm: function(prevForm){
		var idx = 0;
		if (prevForm) {
			idx = this.relationStore.findBy(function(r){
				if (r == prevForm.rec) {
					return true;
				}
			}) +
			1;
		} else {
			idx = this.relationStore.getCount();
		}

		var newRec = this.getEmptyRecord();
		this.relationStore.insert(idx, newRec);

		this.insert(idx, {
			xtype: 'inlineform',
			rec: newRec,
			model: this.model,
			inlineRelator: this
		});
		this.doLayout();
		this.items.last().items.each(function(){
			if(!this.hidden && !this.disabled && this.focus){
				this.focus();
				return false;
			}
		});
	},

	/**
	 * Relates the owning form ID with our records
	 */
	relate: function(){
		var data = {
			model: this.model,
			unrelateExisting: this.unrelateExisting,
			primaryKey: this.localId,
			foreignKeys: (function(){
				var records = [];
				this.relationStore.each(function(rec){
					records.push({
						key: rec.data.id,
						relationMetadata: rec.data.relationMetadata ? rec.data.relationMetadata[Garp.currentModel] : []
					});
				});
				records.reverse();
				return records;
			}).call(this)
		};
		if (this.rule) {
			data.rule = this.rule;
		}
		if (this.rule2) {
			data.rule2 = this.rule2;
		}

		var scope = this;
		Garp[Garp.currentModel].relate(data, function(res){
			if (res) {
				scope.relationStore.removeAll(true);
				scope.items.each(function(item){
					scope.remove(item);
				});
				scope.relationStore.reload();
			}
		});

	},

	saveAll: function(){
		this.relationStore.on({
			save: {
				fn: this.relate,
				scope: this
			}
		});
		this.relationStore.save();
	},

	removeForm: function(form){
		this.relationStore.remove(form.rec);
		this.remove(form);
		this.doLayout();
		this.relate();
	},

	initComponent: function(ct){
		Garp.InlineRelator.superclass.initComponent.call(this, ct);

		this.ownerForm = this.ownerCt.ownerCt;
		this.setupStore();

		this.ownerForm.on('loaddata', function(rec,fp){

			this.localId = rec.get('id');

			// first remove all "previous" items:
			this.items.each(function(item){
				this.remove(item);
			}, this);
			this.relationStore.removeAll(true);

			var q = {};
			q[Garp.currentModel + '.id'] = this.localId;
			this.relationStore.setBaseParam('query', q);
			this.relationStore.reload();
		}, this);

		Garp.eventManager.on('save-all', function(){
			this.items.each(function(){
				if (this.updateRecord) {
					this.updateRecord(this.rec);
				}
			});
			this.saveAll();
		}, this);

	}

});
Ext.reg('inlinerelator',Garp.InlineRelator);

/**
 * InlineRelator uses InlineForm
 */
Garp.InlineForm = Ext.extend(Ext.Panel, {

	rec: null,
	inlineRelator: '',

	border: false,
	bodyBorder: false,
	hideBorders: true,
	style:'padding-bottom: 2px;',

	border: false,
	bodyBorder: false,
	layout:'hbox',
	hideLabel: true,
	xtype:'inlineform',

	/**
	 * Converts standard formConfig fieldset to a panel with fields
	 * @param {Object} items
	 */
	morphFields: function(items){

		var copy = items.items.slice(0);

		copy.push({
				iconCls: 'icon-new',
				xtype: 'button',
				width: 31,
				margins: '0 0 0 1',
				flex: 0,
				handler: function(){
					this.inlineRelator.addForm(this);
				},
				scope: this
			},{
				iconCls: 'icon-delete',
				xtype: 'button',
				width: 31,
				margins: '0 0 0 1',
				flex: 0,
				handler: function(){
					this.inlineRelator.removeForm(this);
				},
				scope: this
			});

		Ext.each(copy, function(item){
			if (!item.hasOwnProperty('flex')) {
				item.flex = 1;
			}
			// Uitgecomment door Harmen @ 4 maart 2014, omdat
			// we textarea's nodig hadden voor Filmhuis Den Haag!
			//if (item.xtype == 'textarea') {
				//item.xtype = 'textfield';
			//}
			item.margins = '0 0 0 1';
		});
		return copy;
	},

	loadRecord: function(rec){
		this.items.each(function(i){
			if(i.name && rec.get(i.name) && i.setValue){
				i.setValue(rec.get(i.name));
			}
		});
	},

	updateRecord: function(){
		this.items.each(function(i){
			if (i.name && i.getValue()) {
				this.rec.set(i.name, i.getValue());
			}
		}, this);
	},

	initComponent: function(ct){
		this.items = this.morphFields(Ext.apply({}, Garp.dataTypes[this.model].formConfig[0].items[0])); // better copy
		Garp.InlineForm.superclass.initComponent.call(this);
		if (this.rec) {
			this.loadRecord(this.rec);
			//this.getForm().loadRecord(this.rec);
		}
	}
});
Ext.reg('inlineform', Garp.InlineForm);

/**
 * Simple labels to be used in conjunction with inlineRelator
 */
Garp.InlineRelatorLabels = Ext.extend(Ext.Panel, {

	model: null,

	layout: 'hbox',
	border: false,
	hideLabel: true,
	style:'margin-bottom: 5px;font-weight: bold;',
	defaults: {
		flex: 1,
		xtype: 'label'
	},

	initComponent: function(ct){
		var fields = Garp.dataTypes[this.model].formConfig[0].items[0].items.slice(0);
		var labels = [];
		Ext.each(fields, function(f){
			if (!f.disabled && !f.hidden && f.fieldLabel) {
				labels.push({
					text: __(f.fieldLabel)
				});
			}
		});
		labels.push({
			width: 65,
			text: ' ',
			flex: 0
		});
		this.items = labels;
		Garp.InlineRelatorLabels.superclass.initComponent.call(this, ct);
	}

});
Ext.reg('inlinerelatorlabels', Garp.InlineRelatorLabels);

window.onYouTubeIframeAPIReady = null; // = that's YouTube being ugly here!

Garp.YouTubeUploadWindow = Ext.extend(Ext.Window,{

	modal: true,
	title: __('YouTube Upload'),
	width: 610,
	height: 435,
	resizable: false,
	html: '<div id="widget"></div>',
	scriptTagId : 'youtubeuploadwindow',
	
	_lm: new Ext.LoadMask(Ext.getBody(), {
		msg: __('Waiting for YouTube. This might take a while&hellip;')
	}),
	
	initComponent: function(arg){
		this.addEvents(['uploadcomplete']);
		Garp.YouTubeUploadWindow.superclass.initComponent.call(this, arg);
	},
	
	afterRender: function(arg){
		Garp.YouTubeUploadWindow.superclass.afterRender.call(this, arg);		
		this.on('beforeclose',  function(){
			this._lm.hide();
		}, this);
		
		this._lm.show();
		
		var alreadyLoaded = (document.getElementById(this.scriptTagId) || false);
		var tag = document.createElement('script');
			tag.src = '//www.youtube.com/iframe_api';
			tag.id = this.scriptTagId;
		var s = document.getElementsByTagName('script')[0];
			s.parentNode.insertBefore(tag, s);
		
		var scope = this;

		function createWidget(){
			var widget = new YT.UploadWidget('widget', {
				webcamOnly: false,
				width: 600,
				events: {
					'onApiReady': function(){
						scope._lm.hide();
					},
					'onUploadSuccess': function(){
						scope._lm.show();
					},
					'onProcessingComplete': function(event){
						scope._lm.hide();
						scope.fireEvent('uploadcomplete', event);
					}
				}
			});
			scope.el.select('iframe').first().show();
		}
		
		if (alreadyLoaded) {
			createWidget();
		} else {
			window.onYouTubeIframeAPIReady = createWidget;
		}
	}
});
/**
 * Ext.ux
 * RelationField / JoinedRelationField / BindedField
 * 
 * @TODO: move out of extux into Garp
 */

Ext.ns('Ext.ux');

Ext.ux.RelationField = Ext.extend(Ext.form.ComboBox,{
	/**
	 * @cfg model
	 */
	model: null,
	allowBlank: false,
	autoLoad: true,
	editable: false,
	triggerAction: 'all',
	typeAhead: false,
	mode: 'remote',
	valueField: 'id',
	displayField: 'name',
	disableCreate: false,
	emptyText: __('(empty)'),
	trigger1Class: 'relation-open-button',
	cls: 'relation-field',
	allQuery: '',
	lastQuery: '',
	baseParams: {
		start: 0,
		limit: Garp.pageSize
	},

	/**
	 * Gets called when the RelationPickerWindow is closed;
	 * @param {Object} selected
	 */	
	selectCallback: function(selected){
		var v = this.getValue();
		if (selected && selected.hasOwnProperty('selected')) {
			if (selected.selected === null) {
				this.setValue(null);
			} else {
				// set it to the value retrieved from the modelpicker:
				this.setValue(selected.selected.get(this.displayField) || selected.selected.get('id'));
				this.disable();
				// ...then reload to get the 'real' value from the server:
				// the reason we reload, is that the displayfield might not get passed from the picker (it just might not be there)
				
				this.store.on({
					load: function(){
						this.setValue(selected.selected.get('id'));
						this.enable();
						if (this.assertValue) {
							this.assertValue();
						}
						this.el.focus(true);
						this.collapse.defer(200, this);
					},
					single: true,
					scope: this
				});
				this.store.load();
			}
			
			this.originalValue = v;
			this.win.destroy();
			this.fireEvent('select', selected);
			return;
		} 
		this.win.destroy();
	},
	
	triggerFn: function(){
		this.win = new Garp.ModelPickerWindow({
			model: this.model,
			query: this.allQuery || null,
			allowBlank: this.allowBlank
		});
		this.win.on('select', this.selectCallback, this);
		this.win.on('close', this.selectCallback, this);
		this.win.show();
	},
	
	createRelationUrl: function(){
		if (this.getValue()) {
			return BASE + 'admin?' +
			Ext.urlEncode({
				model: this.model,
				id: this.getValue()
			});
		}
		return false;
	},
	
	onRelationOpenTriggerClick: function(){
		if (this.tip) {
			if (this.tip.isVisible()) {
				this.tip.hide();
			} else {
				this.tip.show();
			}
		} else {
			var url = this.createRelationUrl();
			if (url) {
				var win = window.open(url);
			}
		}
	},
	
	// override, to allow for null values (or "unrelate", so to say)
	getValue: function(){
		var value = Ext.ux.RelationField.superclass.getValue.call(this);
		if(value === '' || value == this.emptyText){
			value = null;
		}
		return value;
	},
	
	setValue: function(v){
		this.el.removeClass('x-form-invalid');
		if (v) {
			if (this.store.find('id', v) < 0) {
				this.disable();
				this.el.addClass('loading');
				this.store.load({
					add: true,
					single: true,
					params: {
						query: {
							'id': v
						}
					},
					callback: function(data, opts, success){
						this.enable();
						this.el.removeClass('loading');
						if (data && data.length) {
							this.assertValue();
							this.collapse();
						} else {
							// value not found! DB Integrity issue! 
							this.store.clearFilter();
							this.el.addClass('x-form-invalid');
						}
					},
					scope: this
				});
			}
		}
		if(v){
			this.getTrigger(0).removeClass('no-relation');
		} else {
			this.getTrigger(0).addClass('no-relation');
		}
		Ext.ux.RelationField.superclass.setValue.call(this, v);
	},
	
	initComponent: function(){
		this.store = new Ext.data.DirectStore({
			autoLoad: false,
			autoSave: false,
			pruneModifiedRecords: true,
			remoteSort: true,
			restful: true,
			autoDestroy: true,
			root: 'rows',
			idProperty: 'id',
			fields: Garp.dataTypes[this.model] ? Garp.dataTypes[this.model].getStoreFieldsFromColumnModel() : [],
			totalProperty: 'total',
			sortInfo: Garp.dataTypes[this.model] && Garp.dataTypes[this.model].sortInfo ? Garp.dataTypes[this.model].sortInfo : null,
			baseParams: this.baseParams,
			api: {
				create: Ext.emptyFn,
				read: Garp[this.model].fetch || Ext.emptyFn,
				update: Ext.emptyFn,
				destroy: Ext.emptyFn
			}
		});
		
		this.store.on({
			'load': {
				single: true,
				scope: this,
				fn: function(){
					var clear = {
						id: 0
					};
					clear[this.displayField] = this.emptyText;
					var rec = new this.store.recordType(clear, 0);
					this.store.add(rec);
					this.assertValue();
				}
			}
		});
		
		if (this.triggerFn) {
			this.onTriggerClick = this.triggerFn;
		} else {
			this.store.load();
		}
		
		
		Ext.ux.RelationField.superclass.initComponent.call(this);
		this.triggerConfig = {
			tag: 'span',
			cls: 'x-form-twin-triggers',
			cn: [{
				tag: "img",
				src: Ext.BLANK_IMAGE_URL,
				alt: '',
				title: __('Open in new window'),
				cls: "x-form-trigger " + this.trigger1Class
			}, {
				tag: "img",
				src: Ext.BLANK_IMAGE_URL,
				alt: "",
				cls: "x-form-trigger " + this.trigger2Class
			}]
		};
		if (!Garp.dataTypes[this.model]) {
			this.disable();
		}
		
	},
	
	getTrigger : function(index){
        return this.triggers[index];
    },
    
    afterRender: function(){
		Ext.form.TwinTriggerField.superclass.afterRender.call(this);
		var triggers = this.triggers, i = 0, len = triggers.length;
		
		for (; i < len; ++i) {
			if (this['hideTrigger' + (i + 1)]) {
				triggers[i].hide();
			}
		}
		
		if (Garp.dataTypes[this.model].previewItems && Garp.dataTypes[this.model].previewItems.length) {
			this.tip = new Ext.ToolTip({
				target: this.el,
				html: '',
				anchor: 'top',
				anchorOffset: 5,
				closable: true,
				showDelay: 1000,
				hideDelay: 3500,
				listeners: {
					'show': function(tip){
						var idx = this.store.find('id', this.getValue());
						var items = Garp.dataTypes[this.model].previewItems;
						if (idx > -1) {
							var data = this.store.getAt(idx).data;
							var str = '<ul>';
							Ext.each(items, function(item){
								var value = data[item] || '';
								str += '<li>' + __(item) + ': <b>' + value + '</b></li>';
							});
							str += '</ul>';
							str += '<a target="_blank" href="' + BASE + 'admin/?model=' + this.model + '&id=' + data.id + '">' + __('Open in new window') + '</a>';
							tip.update(str);
						} else {
							tip.hide();
						}
					},
					scope: this
				},
				scope: this
			});
		}
	},

    initTrigger : function(){
        var ts = this.trigger.select('.x-form-trigger', true),
            triggerField = this;
            
        ts.each(function(t, all, index){
            var triggerIndex = 'Trigger'+(index+1);
            t.hide = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = 'none';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                triggerField['hidden' + triggerIndex] = true;
            };
            t.show = function(){
                var w = triggerField.wrap.getWidth();
                this.dom.style.display = '';
                triggerField.el.setWidth(w-triggerField.trigger.getWidth());
                triggerField['hidden' + triggerIndex] = false;
            };
			if (index === 0) {
				this.mon(t, 'click', this.onRelationOpenTriggerClick, this, {
					preventDefault: true
				});
			} else {
				this.mon(t, 'click', this.onTriggerClick, this, {
					preventDefault: true
				});
			}
            t.addClassOnOver('x-form-trigger-over');
            t.addClassOnClick('x-form-trigger-click');
        }, this);
        this.triggers = ts.elements;
    },

    getTriggerWidth: function(){
        var tw = 0;
        Ext.each(this.triggers, function(t, index){
            var triggerIndex = 'Trigger' + (index + 1),
                w = t.getWidth();
            if(w === 0 && !this['hidden' + triggerIndex]){
                tw += this.defaultTriggerWidth;
            }else{
                tw += w;
            }
        }, this);
        return tw;
    },

    // private
    onDestroy : function() {
        Ext.destroy(this.triggers);
        Ext.form.TwinTriggerField.superclass.onDestroy.call(this);
    },
	
	/**
     * The function that should handle the trigger's click event.  This method does nothing by default
     * until overridden by an implementing function. See {@link Ext.form.TriggerField#onTriggerClick}
     * for additional information.
     * @method
     * @param {EventObject} e
     */
    onTrigger1Click : Ext.emptyFn,
    /**
     * The function that should handle the trigger's click event.  This method does nothing by default
     * until overridden by an implementing function. See {@link Ext.form.TriggerField#onTriggerClick}
     * for additional information.
     * @method
     * @param {EventObject} e
     */
    onTrigger2Click : Ext.emptyFn

});


/**
 * Joined RelationFields are pre-filled relations sent from the server. If we want to change it, 
 * we need to update the bindedField referenced field. The server then joins again.
 * Untill then, we use the referenced model's displayFieldRederer
 */
Ext.ux.JoinedRelationField = Ext.extend(Ext.ux.RelationField, {
	
	bindedField: null,
	
	selectCallback: function(selected){
		var val, disp;
		if(selected && typeof selected.selected !== 'undefined'){
			if (selected.selected) {
				val = selected.selected.get('id');
				disp = Garp.dataTypes[this.model].displayFieldRenderer(selected.selected);
			} else{
				val = null;
				disp = null;
			}
			this.form.findField(this.bindedField).setValue(val);
			this.setValue(disp);
			this.fireEvent('select', selected);
		}
	},
	
	// joinedRelation saves data in it's bindedField. The field itself must not get send!
	isDirty: function(){
		return false;
	},
	
	// joinedRelation saves data in it's bindedField. The field itself must not get send!
	getValue: function(){
		return null;
	},
	
	createRelationUrl: function(){
		var id = this.form.findField(this.bindedField).getValue();
		if (id) {
			return BASE + 'admin?' +
			Ext.urlEncode({
				model: this.model,
				id: id
			});
		}
		return false;
	},
	
	setValue: function(v){
		Ext.ux.RelationField.superclass.setValue.call(this, v);
		return this;
	}
});

/**
 * Glue component; this field holds the ID value for a joinedRelationField 
 */
Ext.ux.BindedField = Ext.extend(Ext.form.TextField, {
	bindedField: null,
	initComponent: function(v){
		this.hidden = true;
		this.hideFieldLabel = true;
		Ext.ux.BindedField.superclass.initComponent.call(this, v);
	},
	
	// allow null values:
	getValue: function(){
		var val = Ext.ux.BindedField.superclass.getValue.call(this);
		if(val === ''){
			return null;
		}
		return val;
	}
	
});

// xtypes
Ext.reg('relationfield', Ext.ux.RelationField);
Ext.reg('joinedrelationfield', Ext.ux.JoinedRelationField);
Ext.reg('bindedfield', Ext.ux.BindedField);

Ext.ns('Ext.ux');
/**
 * RelationPanel extends on Ext.Panel
 *
 * @author: Peter Schilleman, Engelswoord for Grrr.nl
 *
 */
Ext.ux.RelationPanel = Ext.extend(Ext.Panel, {
	layout: 'border',
	bodyBorder: false,
	border: true,
	forceLayout:true,

	monitorValid: false,

	/**
	 * @cfg: If set, we merely create a view tab; the only interactions possible are to open existing relations or quickCreate a new relation
	 */
	minimalUI: false,

	/**
	 * @cfg: Whether we want one long list (false) or paginate (true) the related items
	 */
	paginated: false,

	/**
	 * @cfg: whether or not we allow users to create a new instance
	 */
	quickCreatable: false,

	/**
	 * @cfg: fieldReference to give to the quickCreate window
	 */
	quickCreateReference: null,

	/**
	 * @cfg: get to hold the Id of the selected row
	 */
	localId : null,

	/**
	 * @cfg: Whether or not to unrelate existing items on the server first
	 */
	unrelateExisting: true,

	/**
	 * @cfg: model: specifies the relatable model for this panel
	 */
	model: null,

	/**
	 * @cfg: whether or not we can sort on the client
	 */
	weighable: false,

	/**
	 * @cfg: rules: defines rules for "self" relations (modelA - modelA relations)
	 */
	rule: null,
	rule2: null,

	/**
	 * @cfg: the bindingmodel to use with habtm relations
	 */
	bindingModel: null,

	/**
	 * @cfg: wether to save homophyllic relationships bidirectionally
	 */
	bidirectional: true,

	foreignKey: 'id',

	/**
	 * @cfg: override columnModel
	 */
	columns: null,

	/**
	 * @cfg: title: specifies the title
	 */
	title: '',

	/**
	 * @cfg: quickCreateReference: used for the "New Something" button label
	 */
	quickCreateBtnLabel: '',

	/**
	 * @cfg: iconCls: specifies the icon
	 */
	//iconCls: null,

	/**
	 * @cfg: maxItems
	 */
	maxItems: null,

	/**
	 * @cfg: metaDataEditors: editors to use in metaDataPanel
	 */
	metaDataEditors: null,
	metaDataRenderers: null,
	metaDataValidator: function(){return true;},

	/**
	 * For fine-grained control over the metaDataPanel, models
	 * can configure a full configuration object.
	 * @see http://docs.sencha.com/extjs/3.4.0/#!/api/Ext.grid.PropertyGrid for
	 * available options.
	 */
	metaDataConfig: {},

	dirty: function(){
		this.fireEvent('dirty');

		if (this.metaDataPanel) {
			var valid = this.metaDataValidator(this.metaDataPanel.getSource(), this.relateePanel.store.data);
		}
		if (valid) {
			this.getTopToolbar().saveBtn.enable();
		}
		this.getTopToolbar().cancelBtn.enable();
		this.ownerCt.items.each(function(i){
			if(i!=this){
				i.disable();
			}
		}, this);
	},

	undirty: function(){
		this.fireEvent('undirty');
		this.getTopToolbar().saveBtn.disable();
		this.getTopToolbar().cancelBtn.disable();
		this.ownerCt.items.each(function(i){
			if(i!=this){
				i.enable();
			}
		}, this);
	},


	/**
	 * @function getRowIndex
	 * gives the rowIndex of the D'n D drop on grid operation
	 *
	 * @param {Object} elm
	 * @param {Object} e
	 */
	getRowIndex: function(elm, e){
		return elm.getView().findRowIndex(Ext.lib.Event.getTarget(e));
	},

	/**
	 * @function highlight
	 * Highlights or unhiglihts the row for dnd operations
	 * @param {Object} el
	 */
	highlight: function(el){
		if (this.highlightEl) {
			this.highlightEl.removeClass('garp-dnd-over');
		}
		if (el) {
			this.highlightEl = Ext.get(el);
			this.highlightEl.addClass('garp-dnd-over');
		}
	},

	/**
	 * @function setupDD
	 * sets up the D'n D targets
	 */
	setupDD: function(){
		var scope = this;

		new Ext.dd.DropTarget(this.relatePanel.getView().el, {
			ddGroup: 'dd',
			copy: true,
			notifyOut: function(){
				scope.highlight(false);
			},
			notifyOver: function(ddSource, e, data){
				if (ddSource.dragData.grid.itemId == 'relatePanel') {
					// do not allow relatePanel items to be dropped in relatePanel
					return Ext.dd.DropZone.prototype.dropNotAllowed;
				} else {
					scope.highlight(scope.relatePanel.getView().getRow(scope.getRowIndex(scope.relatePanel, e)), this.highlight);
					return Ext.dd.DropZone.prototype.dropAllowed;
				}
			},
			notifyDrop: function(ddSource, e, data){
				scope.highlight(false);
				if (ddSource.dragData.grid.itemId == 'relatePanel') {
					return false;
				} else {
					var records = ddSource.dragData.selections;
					var index = scope.getRowIndex(scope.relateePanel, e);
					scope.moveRecords(ddSource.grid, scope.relatePanel, records, index);
					return true;
				}
			}
		});
		/* @FIXME:
		 * Used to work better, but didn't allow for moving outside of "items already there"
		 *
		new Ext.dd.DropTarget(this.relateePanel.getView().mainBody, {
			ddGroup: 'dd',
			copy: true,
			notifyOut: function(){
				scope.highlight(false);
			},
			notifyOver: function(ddSource, e, data){
				scope.highlight(scope.relateePanel.getView().getRow(scope.getRowIndex(scope.relateePanel, e)), this.highlight);

				if (scope.maxItems && scope.relateeStore.getCount() >= scope.maxItems) {
					return Ext.dd.DropZone.prototype.dropNotAllowed;
				} else {
					return Ext.dd.DropZone.prototype.dropAllowed;
				}

			},
			notifyDrop: function(ddSource, e, data){
				scope.highlight(false);
				var records = ddSource.dragData.selections;
				var index = scope.getRowIndex(scope.relateePanel, e);
				scope.moveRecords(ddSource.grid, scope.relateePanel, records, index);

				return !(scope.maxItems && scope.relateeStore.getCount() >= scope.maxItems)
			}
		});
		*/
		new Ext.dd.DropTarget(this.relateePanel.getView().el, {
			ddGroup: 'dd',
			copy: true,
			notifyOut: function(){
				scope.highlight(false);
			},
			notifyOver: function(ddSource, e, data){
				scope.highlight(scope.relateePanel.getView().getRow(scope.getRowIndex(scope.relateePanel, e)), this.highlight);
				if (!scope.weighable && ddSource.dragData.grid.itemId == 'relateePanel') {
					return Ext.dd.DropZone.prototype.dropNotAllowed;
				}
				if (ddSource.dragData.grid.itemId == 'relateePanel') {
					return Ext.dd.DropZone.prototype.dropAllowed;
				}
				if (scope.maxItems && scope.relateeStore.getCount() >= scope.maxItems) {
					return Ext.dd.DropZone.prototype.dropNotAllowed;
				} else {
					return Ext.dd.DropZone.prototype.dropAllowed;
				}

			},
			notifyDrop: function(ddSource, e, data){
				if (!scope.weighable && ddSource.dragData.grid.itemId == 'relateePanel') {
					return false;
				}
				scope.highlight(false);
				var records = ddSource.dragData.selections;
				var index = scope.getRowIndex(scope.relateePanel, e);
				scope.moveRecords(ddSource.grid, scope.relateePanel, records, index);

				return !(scope.maxItems && scope.relateeStore.getCount() >= scope.maxItems);
			}
		});
	},

	/**
	 * @function moveRecords
	 * moves Records from grid one to the other
	 * @param {Object} source
	 * @param {Object} target
	 * @param {Object} records (optional)
	 * @param {Number} index (optional)
	 */
	moveRecords: function(source, target, records, index){

		// Reordering is not yet implemented on the server. disabled for now
		//index = null; // @TODO: remove this line, when it gets supported.

		// see if we may proceed with moving:
		if(this.maxItems && this.relateeStore.getCount() >= this.maxItems && target == this.relateePanel){
			// re-ordering within the same region should however be possible:
			if (source !== target) {
				return;
			}
		}
		if (!records) {
			records = source.getSelectionModel().getSelections();
		}
		if (this.maxItems && (this.relateeStore.getCount() + records.length) > this.maxItems && source == this.relatePanel) {
			return;
		}

		// @TODO: Possibly check for duplicate items (decide later):
		// if(!Ext.isDefined(target.store.getById(source.store.find('id'))))
		Ext.each(records, function(rec, i){

			var nr = new source.store.recordType(rec.data);
			if (Ext.isNumber(index)) {
				target.store.insert(index, nr);
			} else {
				index = target.store.getCount();
				target.store.add(nr);
			}
			source.store.remove(rec);
		});

		Ext.each([source, target], function(grid){
			grid.getSelectionModel().clearSelections();
			grid.getView().refresh();
		});

		this.dirty();
		if(!this.weighable){
			target.store.remoteSort = false;
			target.store.sort(Garp.dataTypes[this.model].sortInfo.field, Garp.dataTypes[this.model].sortInfo.direction);
			target.store.remoteSort = true;
		}

		var rec = records[0];
		var idx = target.store.find('id', rec.data.id);
		target.getSelectionModel().selectRow(idx || 0);

	},

	/**
	 * @function getStoreCfg
	 * @return default store Cfg object
	 */
	getStoreCfg: function(){
		return {
			autoLoad: false,
			autoSave: false,
			remoteSort: true,
			restful: true,
			autoDestroy: true,
			pruneModifiedRecords: true,
			root: 'rows',
			idProperty: 'id',
			fields: (function(){
				var out = Garp.dataTypes[this.model].getStoreFieldsFromColumnModel();
				out.push({
					dataIndex: 'relationMetadata',
					header: false,
					searchable: false,
					hidden: true
				});
				return out;
			}).call(this),
			totalProperty: 'total',
			sortInfo: Garp.dataTypes[this.model].sortInfo || null,
			baseParams: (function(){
				var out = {
					start: 0,
					limit: Garp.pageSize
				};
				if(this.rule){
					out.rule = this.rule;
				}
				if(this.rule2){
					out.rule2 = this.rule2;
				}
				if(this.bindingModel){
					out.bindingModel = this.bindingModel;
				}
				out.bidirectional = this.bidirectional;
				return out;
			}).call(this),
			api: {
				create: Ext.emptyFn,
				read: Garp[this.model].fetch || Ext.emptyFn,
				update: Ext.emptyFn,
				destroy: Ext.emptyFn
			}
		};
	},

	/**
	 * @function getGridCfg
	 * @param hideHeader
	 * @return defaultGridObj
	 */
	getGridCfg: function(hideHeaders){
		return {
			border: true,
			region: 'center',
			hideHeaders: hideHeaders,
			enableDragDrop: true,
			ddGroup: 'dd',
			cm: new Ext.grid.ColumnModel({
				defaults:{
					sortable: true
				},
				columns: (function(){
					var cols = [], cmClone, c, l;
					if (this.columns) {
						cmClone = Garp.dataTypes[this.model].columnModel;
						var shown = 0;
						for (c = 0, l = cmClone.length; c < l; c++) {
							// Skip hidden columns to keep it simple in the relationPanel
							if (typeof cmClone[c].hidden === 'boolean' && cmClone[c].hidden) {
								continue;
							}
							col = Ext.apply({}, cmClone[c]);
							col.hidden = this.columns.indexOf(col.dataIndex) == -1;
							cols.push(col);
						}
						return cols;
					} else {
						cmClone = Garp.dataTypes[this.model].columnModel;
						for (c = 0, l = cmClone.length; c < l; c++) {
							// Skip hidden columns to keep it simple in the relationPanel
							if (typeof cmClone[c].hidden === 'boolean' && cmClone[c].hidden) {
								continue;
							}
							col = Ext.apply({}, cmClone[c]);
							cols.push(col);
						}
						return cols;
					}
				}).call(this)
			}),
			pageSize: Garp.pageSize,
			title: __('Available'),
			iconCls: this.iconCls,
			viewConfig: {
				scrollOffset: -1, // No reserved space for scrollbar. Share it with last column
				forceFit: true,
				autoFill: true
			}
		};
	},

	/**
	 * @function getButtonPanel
	 * @return defaultButtonPanelObj
	 */
	getButtonPanel: function(){
		return {
			border: false,
			xtype: 'container',
			bodyBorder: false,
			region: 'east',
			width: 50,
			margins: '0 0 0 20',
			bodyCssClass: 'garp-relatepanel-buttons',
			layout: 'vbox',
			layoutConfig: {
				align: 'stretch',
				pack: 'center',
				defaultMargins: {
					top: 5,
					left: 5,
					right: 5,
					bottom: 5
				}
			},
			items: [{
				xtype: 'button',
				iconCls: 'icon-relatepanel-relate',
				ref: '../../relateBtn',
				tooltip: __('Relate selected item(s)'),
				handler: this.moveRecords.createDelegate(this, [this.relatePanel, this.relateePanel, false, false])
			}, {
				xtype: 'button',
				iconCls: 'icon-relatepanel-unrelate',
				ref: '../../unrelateBtn',
				tooltip: __('Unrelate selected item(s)'),
				handler: this.moveRecords.createDelegate(this, [this.relateePanel, this.relatePanel, false, false])
			}]
		};
	},

	/**
	 * @function saveRelations
	 * @param options {Object}
	 *
	 * Use options.force = true to disable dirty check and save anyway
	 */
	saveRelations: function(options){
		if(!Garp[Garp.currentModel].relate){
			return;
		}
		if(typeof options == 'undefined'){
			options = {};
		}

		if (!this.relateeStore) {
			return;
		}
		if (!options.force) {
			// check to see if there are any pending changes
			if (this.relateeStore.getModifiedRecords().length === 0 && this.relateStore.getModifiedRecords().length === 0) {
				return;
			}
		}

		this.loadMask = new Ext.LoadMask(this.getEl(), {
			msg: __('Relating&hellip;')
		});
		this.loadMask.show();

		var data = {
			model: this.model,
			unrelateExisting: this.unrelateExisting,
			primaryKey: this.localId,
			foreignKeys: (function(){
				var records = [];
				this.relateeStore.each(function(rec){
					records.push({
						key: rec.data.id,
						relationMetadata: rec.data.relationMetadata ? rec.data.relationMetadata[Garp.currentModel] : []
					});
				});
				records.reverse();
				return records;
			}).call(this)
		};
		if(this.rule){
			data.rule = this.rule;
		}
		if(this.rule2){
			data.rule2 = this.rule2;
		}
		if(this.bindingModel){
			data.bindingModel = this.bindingModel;
		}
		data.bidirectional = this.bidirectional;

		Garp[Garp.currentModel].relate(data, function(res) {
			this.loadMask.hide();
			if(res){

				if (this.model == Garp.currentModel) {
					// on homophile relations, refetch parent to get the right ID first:
					var gpStore = Garp.gridPanel.getStore();
					this.relateStore.rejectChanges();
					this.relateeStore.rejectChanges();
					gpStore.on({
						load: {
							fn: function(){
								var sm = Garp.gridPanel.getSelectionModel();
								this._selectionChange(sm);
								this.relateStore.reload();
								this.relateeStore.reload();
							},
							scope: this,
							buffer: 100,
							single: true
						}
					});
					gpStore.reload();
				} else {
					// it doesn't matter, the parent ID doesn't change, fetch easily:
					this.relateStore.reload();
					this.relateeStore.reload();
				}
			}
		}, this);
	},

	/**
	 * @function checkDirty
	 */
	checkDirty: function(continueAction){
		if(typeof continueAction != 'function') {
			continueAction = Ext.emptyFn;
		}

		if (this.relateStore.getModifiedRecords().length == 0 && this.relateeStore.getModifiedRecords().length == 0) {
			return true;
		}
		Ext.Msg.show({
			animEl: Garp.viewport.getEl(),
			icon: Ext.MessageBox.QUESTION,
			title: __('Garp'),
			msg: __('Would you like to save your changes?'),
			buttons: Ext.Msg.YESNOCANCEL,
			scope: this,
			fn: function(btn){
				switch (btn) {
					case 'yes':
						this.saveRelations();
						var c = 2;
						function async(){
							c--;
							if(c === 0){
								this.relateStore.rejectChanges();
								this.relateeStore.rejectChanges();
								continueAction();
							}
						}

						this.relateeStore.on({
							'load': {
								fn: async,
								scope: this,
								single: true
							}
						});
						this.relateStore.on({
							'load': {
								fn: async,
								scope: this,
								single: true
							}
						});
						break;
					case 'no':
						this.relateStore.rejectChanges();
						this.relateeStore.rejectChanges();
						continueAction();
					//case 'cancel':
					//default:
						break;
				}
			}
		});
		return false;
	},

	/**
	 * @function _selectionChange
	 *
	 * binds a new query (model:[id]) to relate/relatee store
	 */
	_selectionChange: function(sm){
		this.setDisabled(sm.getCount() !== 1);

		if (sm.getCount() !== 1) {
			if (this.ownerCt && this.ownerCt.setActiveTab) {
				this.ownerCt.setActiveTab(0);
			}
			return;
		}

		var id = sm.getSelected().get(this.foreignKey);
		if (!id) {
			this.localId = sm.getSelected().get('id');
			if (this.localId === null) {
				this.setDisabled(true);
				this.ownerCt.setActiveTab(0);
			}
		} else {
			this.localId = id;
		}

		/// TODO: REFACTOR DUPLICATES BELOW!

		var q;
		q = {};
		if (typeof this.filterColumn === 'undefined') {
			q[Garp.currentModel + '.id <>'] = id;
		} else {
			q[this.filterColumn+' <>'] = id;
		}
		var baseParams = Ext.apply(this.relateStore.baseParams, {
			query: q,
			rule: this.rule
		});
		if(this.rule2){
			baseParams.rule2 = this.rule2;
		}
		if(this.bindingModel){
			baseParams.bindingModel = this.bindingModel;
		}
		baseParams.bidirectional = this.bidirectional;

		this.relateStore.setBaseParam(baseParams);

		q = {};
		if (typeof this.filterColumn === 'undefined') {
			q[Garp.currentModel + '.id'] = id;
		} else {
			q[this.filterColumn] = id;
		}
		baseParams = Ext.apply(this.relateeStore.baseParams, {
			query: q,
			rule: this.rule
		});
		if(this.rule2){
			baseParams.rule2 = this.rule2;
		}
		if(this.bindingModel) {
			baseParams.bindingModel = this.bindingModel;
		}
		baseParams.bidirectional = this.bidirectional;
		this.relateeStore.setBaseParam(baseParams);
		this.searchbar.setBaseParams();
		if(!this.hidden && this.rendered) {
			this.relateePanel.getSelectionModel().clearSelections(true);
			if (this.metaDataPanel) {
				this.metaDataPanel.hide();
				this.metaDataPanel.ownerCt.doLayout();
			}
			this.relateStore.reload();
			this.relateeStore.reload();
		}
	},

	/**
	 * @function _onActivate
	 */
	_onActivate: function(){
		if (!this._onActivate.isLoaded) {
			if (!this.minimalUI) {
				this.relateStore.on({
					'load': {
						scope: this,
						single: true,
						fn: this.setupDD
					}
				});
			}
			this.relateStore.load();
			this.relateeStore.load();
			this._onActivate.isLoaded = true;
			this.relatePanel.doLayout();
		}
	},

	/**
	 * @function updateOnNewWindow
	 *
	 */
	updateOpenNewWindow: function(){
		function xor(a,b){
			return !a != !b;
		}
		if(xor(this.relatePanel.getSelectionModel().getCount() == 1, this.relateePanel.getSelectionModel().getCount() == 1)){
			this.getTopToolbar().buttonopennewwindow.show();
		} else {
			this.getTopToolbar().buttonopennewwindow.hide();
		}
	},

	/**
	 * @function initComponent
	 */
	initComponent: function(){
		if (Garp.dataTypes[this.model]) {
			var RELATEESTORE_LIMIT = null;
			if (!this.iconCls) {
				this.setIconClass(Garp.dataTypes[this.model].iconCls);
			}
			if (!this.title) {
				this.setTitle(__(Garp.dataTypes[this.model].text));
			}
			if (!this.quickCreateBtnLabel) {
				this.quickCreateBtnLabel = this.title;
			}
			this.bodyCssClass = 'garp-relatepanel-buttons';

			this.relateStore = new Ext.data.DirectStore(Ext.apply({}, {
				listeners: {
					load: {
						scope: this,
						single: true,
						fn: function(){
							this.relateeStore.load();
						}
					}
				},
				api: {
					create: Ext.emptyFn,
					read: Garp[this.model].fetch || Ext.emptyFn,
					//read: Garp[this.model].fetch_unrelated,
					update: Ext.emptyFn,
					destroy: Ext.emptyFn
				}
			}, this.getStoreCfg()));

			function checkCount(store){
				if (this.maxItems !== null) {
					if (store.getCount() == this.maxItems) {
						this.relateBtn.disable();
					} else {
						this.relateBtn.enable();
					}
				}
				this.relateStore.filter([{
					scope: this,
					fn: function(rec){
						return !(this.relateeStore.getById(rec.get('id')));
					}
				}]);
			}

			this.relateeStore = new Ext.data.DirectStore(Ext.apply({}, {
				baseParams: {
					limit: this.paginated ? Garp.pageSize : RELATEESTORE_LIMIT
				},
				writer: new Ext.data.JsonWriter({
					paramsAsHash: false,
					writeAllFields: true,
					encode: false
				}),
				listeners: {
					'load': checkCount.createSequence(this.undirty),
					'add': checkCount,
					'remove': checkCount,
					'save': checkCount,
					'update': checkCount,
					scope: this
				}
			}, this.getStoreCfg()));

			this.relatePanel = new Ext.grid.GridPanel(Ext.apply({}, {
				itemId: 'relatePanel',
				store: this.relateStore,
				bbar: new Ext.PagingToolbar({
					pageSize: Garp.pageSize,
					store: this.relateStore,
					beforePageText: '',
					displayInfo: false
				}),
				tbar: this.searchbar = new Ext.ux.Searchbar({
					xtype: 'searchbar',
					store: this.relateStore
				}),
				listeners: {
					'rowdblclick': function(){
						this.moveRecords(this.relatePanel, this.relateePanel, false, false);
					},
					scope: this
				}
			}, this.getGridCfg(false)));

			var relateePanelCfg = Ext.apply({}, {
				itemId: 'relateePanel',
				title: __('Related'),
				iconCls: 'icon-relatepanel-related',
				store: this.relateeStore,
				tbar: (this.maxItems !== null ? new Ext.Toolbar({
					items: [{
						xtype: 'tbtext',
						text: this.maxItems + __(' item(s) maximum')
					}]
				}) : null),
				monitorResize: true,
				layout: 'fit',
				pageSize: RELATEESTORE_LIMIT,
				listeners: (this.minimalUI ? {} : {
					'rowdblclick': function(){
						this.moveRecords(this.relateePanel, this.relatePanel, false, false);
					},
					scope: this
				})
			}, this.getGridCfg(this.maxItems !== null));
			if (this.paginated) {
				relateePanelCfg.pageSize = Garp.pageSize;
				relateePanelCfg.bbar = new Ext.PagingToolbar({
					pageSize: Garp.pageSize,
					store: this.relateeStore,
					beforePageText: '',
					displayInfo: false
				});
			}
			this.relateePanel = new Ext.grid.GridPanel(relateePanelCfg);

			if (this.minimalUI) {
				this.items = [{
					xtype: 'container',
					layout: 'border',
					border: false,
					margins: '20 20 20 20',
					region: 'center',
					items: this.relateePanel
				}];
			} else {

				var scope = this;
				function validateMetaPanel(){
					if (scope.rendered && scope.isVisible()) {
						if (scope.metaDataValidator(scope.metaDataPanel.getSource(), scope.relateePanel.store.data)) {
							//scope.undirty();
							scope.getTopToolbar().saveBtn.enable();
						} else {
							//scope.dirty();
							scope.getTopToolbar().saveBtn.disable();
						}
					}
				}

				var metaDataPanelConfig = {
					split: true,
					__relationPanel: this,
					layout: 'fit',
					region: 'south',
					minHeight: 250,
					height: 200,
					collapsed: false,
					customEditors: this.metaDataEditors,
					customRenderers: this.metaDataRenderers,
					customConverters: {},
					forceValidation: true,
					hidden: true,
					collapsible: false,
					source: this.source || {},
					listeners:{
						propertychange: validateMetaPanel
					}
				};
				Ext.apply(metaDataPanelConfig, this.metaDataConfig);
				this.metaDataPanel = new Ext.grid.PropertyGrid(metaDataPanelConfig);
				this.metaDataPanel.store.on('load', validateMetaPanel, this);

				this.items = [{
					xtype: 'container',
					layout: 'border',
					border: false,
					width: '50%',
					margins: '15 15 20 15',
					region: 'center',
					items: [this.relatePanel, this.getButtonPanel()]
				}, {
					xtype: 'container',
					layout: 'border',
					width: '50%',
					region: 'east',
					margins: '15 15 20 5',
					border: false,
					bodyCssClass: 'garp-relatepanel-buttons',
					items: [this.relateePanel, this.metaDataPanel]
				}];
			}

			this.tbar = new Ext.Toolbar({
				style: 'border:0; padding: 15px 15px 0 15px;',
				border: false,
				items: [{
					iconCls: 'icon-save',
					text: __('Save'),
					ref: 'saveBtn',
					disabled: true,
					hidden: this.minimalUI,
					handler: function(){
						this.saveRelations();
					},
					scope: this
				}, {
					iconCls: 'icon-cancel',
					text: __('Cancel'),
					ref: 'cancelBtn',
					hidden: this.minimalUI,
					disabled: true,
					handler: function(){
						//this.relateStore.reload();
						this.relateeStore.reload();
						this.metaDataPanel.hide();
						this.metaDataPanel.setSource(this.source || {});
						this.relateePanel.getSelectionModel().selectRange(-1,-1);
					},
					scope: this
				}, (Garp.dataTypes[this.model].quickCreatable ? {
					iconCls: 'icon-new',
					text: __('New ' + this.quickCreateBtnLabel),
					handler: function(){
						var cfg = {
							model: this.model,
							iconCls: this.iconCls,
							title: this.title,
							quickCreateReference: this.quickCreateReference
						};
						if (this.quickCreateConfig) {
							cfg = Ext.apply(cfg, this.quickCreateConfig);
						}
						var win = new Garp.RelateCreateWindow(cfg);

						win.show();
						win.on('aftersave', function(rcwin, rec){
							this.relateeStore.add(rec);
							this.saveRelations({
								force: true
							});
						}, this);
					},
					scope: this
				} : {
					hidden: true
				}), ' ',{
					iconCls: 'icon-open-new-window',
					hidden: true,
					ref: 'buttonopennewwindow',
					text: __('Open in new window'),

					handler: function(){
						var selected;
						if (this.relatePanel.getSelectionModel().getCount() > 0) {
							selected = this.relatePanel.getSelectionModel().getSelected();
							Garp.eventManager.on('external-relation-save', function(){
								this.relatePanel.getStore().reload();
							}, this);
						} else {
							selected = this.relateePanel.getSelectionModel().getSelected();
							Garp.eventManager.on('external-relation-save', function(){
								this.relateePanel.getStore().reload();
							}, this);
						}
						if (selected) {
							var id = selected.get('id');
							var url = BASE + 'admin?model=' + this.model + '&id=' + id;

							var win = window.open(url);
						}
					},
					scope: this
				}, '->', {
					text: __('Export'),
					iconCls: 'icon-export',
					hidden: false,
					handler: function(){
						var win = new Garp.ExportWindow();
						win.show();
					}
				}, ' ', {
					iconCls: 'icon-help',
					text: __('How does this work?'),
					hidden: this.minimalUI,
					handler: function(){
						var tt = new Ext.ToolTip({
							target: this.getEl(),
							anchor: 'top',
							preventBodyReset: true,
							bodyCssClass: 'garp-tooltip',
							//@TODO : style this:
							html: __('Relate or reorder items by dragging them around, or use the arrow buttons in the middle.'),
							autoHide: true
						});
						tt.show();
					}
				}]
			});

			/**
		 	 *  Event handling:
		 	 */
			//this.on('afterlayout', this._onActivate, this); // was bugy, caused weired layout issues sometimes, changed event order...
			this.on('activate', this._onActivate, this); // @TODO: refactor method names to cope with new event names
			this.on('hide', function(){
				this._onActivate.isLoaded = false;
			}, this);

			this.on('deactivate', this.checkDirty, this);

			this.relatePanel.getSelectionModel().on({
				'selectionchange': {
					scope: this,
					buffer: 25,
					fn: this.updateOpenNewWindow
				}
			});
//TEMP = this;
			this.relateePanel.getSelectionModel().on({
				'selectionchange': {
					scope: this,
					buffer: 25,
					fn: function(sm){

						this.updateOpenNewWindow();
						if (!this.metaDataPanel) {
							return;
						}
						var hasSource = false;
						for(var i in this.metaDataPanel.getSource()){
							hasSource = true;
							break;
						}
						if (!sm || sm.getCount() != 1 || !hasSource) {
							this.metaDataPanel.hide();
							this.metaDataPanel.ownerCt.doLayout();

						} else if (sm && sm.getCount() == 1 && this.relateeStore && this.relateeStore.fields.containsKey('relationMetadata')) {
							this.metaDataPanel.show();
							this.metaDataPanel.ownerCt.doLayout();
							//this.metaDataPanel.startEditing(0, 1);
						}
					}
				},
				'rowselect': {
					scope: this,
					buffer: 20,
					fn: function(sm, ri, rec){
						if (!this.metaDataPanel) {
							return;
						}
						if (sm.getCount() == 1) {
							if (rec.data.relationMetadata && rec.data.relationMetadata[Garp.currentModel]) {
								this.metaDataPanel._recordRef = rec.id;
								var r = rec.data.relationMetadata[Garp.currentModel];
								var converters = this.metaDataConfig.customConverters;
								// null values don't get shown in propertygrid. Make it empty strings
								// @TODO: check to see if this is Ok.
								for (var i in r) {
									if(r[i] === null){
										r[i] = '';
									}
									if (converters && converters.hasOwnProperty(i)) {
										r[i] = converters[i](r[i], r);
									}
								}
								this.metaDataPanel.setSource(r);
							}
						} else {
							this.metaDataPanel.hide();
							this.metaDataPanel.ownerCt.doLayout();
						}
					}
				}
			});

			if (this.metaDataPanel) {
				this.metaDataPanel.on('propertychange', function(source, recId, val, oldVal){
					if (val != oldVal) {
						//this.dirty();
						var rec = this.relateeStore.getById(this.metaDataPanel._recordRef);
						if (!rec) {
							return;
						}
						rec.beginEdit();
						var k = rec.data.relationMetadata[Garp.currentModel];
						rec.set({
							k: source
						});
						rec.markDirty();
						rec.endEdit();
						this.relateePanel.getView().refresh();
					}
				}, this);
			}

			if (Garp.eventManager) { // Test environment doesn't include Garp.eventManager
				Garp.eventManager.on({
					'after-save': {
						scope: this,
						fn: this._selectionChange
					},
					'selectionchange': {
						scope: this,
						fn: this._selectionChange,
						buffer: 400
					},
					'save-all': {
						scope: this,
						fn: function(){
							this.saveRelations();
						}
					},
					'beforerowselect': {
						scope: this,
						fn: function(sm, ri){
							return this.checkDirty(function(){
								sm.selectRow(ri);
							});
						}
					}
				});
			}
		} else {
			this.ownerCt.on('afterrender', function(){
				this.destroy();
			}, this);
		}
		Ext.ux.RelationPanel.superclass.initComponent.call(this);
	},

	/**
	 * @function onDestroy
	 */
	onDestroy: function(){
		this.un('activate', this._onActivate, this);
		if (Garp.eventManager) {
			Garp.eventManager.un('save-all', this.saveRelations, this);
			Garp.eventManager.un('selectionchange', this._selectionChange, this);
			Garp.eventManager.un('after-save', this._selectionChange, this);
		}
		Ext.ux.RelationPanel.superclass.onDestroy.call(this);
		this._onActivate.isLoaded = false;
	}
});
Ext.reg('relationpanel',Ext.ux.RelationPanel);

Ext.namespace('Ext.ux.form');

/**
 * <p>SuperBoxSelect is an extension of the ComboBox component that displays selected items as labelled boxes within the form field. As seen on facebook, hotmail and other sites.</p>
 * <p>The SuperBoxSelect component was inspired by the BoxSelect component found here: http://efattal.fr/en/extjs/extuxboxselect/</p>
 * 
 * @author <a href="mailto:dan.humphrey@technomedia.co.uk">Dan Humphrey</a>
 * @class Ext.ux.form.SuperBoxSelect
 * @extends Ext.form.ComboBox
 * @constructor
 * @component
 * @version 1.0
 * @license TBA (To be announced)
 * 
 */
// PATCHED AND EXTENDED BY PP FOR GARP 3

Ext.ux.form.SuperBoxSelect = function(config) {
    Ext.ux.form.SuperBoxSelect.superclass.constructor.call(this,config);
    this.addEvents(
        /**
         * Fires before an item is added to the component via user interaction. Return false from the callback function to prevent the item from being added.
         * @event beforeadditem
         * @memberOf Ext.ux.form.SuperBoxSelect
         * @param {SuperBoxSelect} this
         * @param {Mixed} value The value of the item to be added
         */
        'beforeadditem',

        /**
         * Fires after a new item is added to the component.
         * @event additem
         * @memberOf Ext.ux.form.SuperBoxSelect
         * @param {SuperBoxSelect} this
         * @param {Mixed} value The value of the item which was added
         * @param {Record} record The store record which was added
         */
        'additem',

        /**
         * Fires when the allowAddNewData config is set to true, and a user attempts to add an item that is not in the data store.
         * @event newitem
         * @memberOf Ext.ux.form.SuperBoxSelect
         * @param {SuperBoxSelect} this
         * @param {Mixed} value The new item's value
         */
        'newitem',

        /**
         * Fires when an item's remove button is clicked. Return false from the callback function to prevent the item from being removed.
         * @event beforeremoveitem
         * @memberOf Ext.ux.form.SuperBoxSelect
         * @param {SuperBoxSelect} this
         * @param {Mixed} value The value of the item to be removed
         */
        'beforeremoveitem',

        /**
         * Fires after an item has been removed.
         * @event removeitem
         * @memberOf Ext.ux.form.SuperBoxSelect
         * @param {SuperBoxSelect} this
         * @param {Mixed} value The value of the item which was removed
         * @param {Record} record The store record which was removed
         */
        'removeitem',
        /**
         * Fires after the component values have been cleared.
         * @event clear
         * @memberOf Ext.ux.form.SuperBoxSelect
         * @param {SuperBoxSelect} this
         */
        'clear'
    );
    
};
/**
 * @private hide from doc gen
 */
Ext.ux.form.SuperBoxSelect = Ext.extend(Ext.ux.form.SuperBoxSelect,Ext.form.ComboBox,{
    /**
     * @cfg {Boolean} allowAddNewData When set to true, allows items to be added (via the setValueEx and addItem methods) that do not already exist in the data store. Defaults to false.
     */
    allowAddNewData: false,

    /**
     * @cfg {Boolean} backspaceDeletesLastItem When set to false, the BACKSPACE key will focus the last selected item. When set to true, the last item will be immediately deleted. Defaults to true.
     */
    backspaceDeletesLastItem: true,

    /**
     * @cfg {String} classField The underlying data field that will be used to supply an additional class to each item.
     */
    classField: null,

    /**
     * @cfg {String} clearBtnCls An additional class to add to the in-field clear button.
     */
    clearBtnCls: '',

    /**
     * @cfg {String/XTemplate} displayFieldTpl A template for rendering the displayField in each selected item. Defaults to null.
     */
    displayFieldTpl: null,

    /**
     * @cfg {String} extraItemCls An additional css class to apply to each item.
     */
    extraItemCls: '',

    /**
     * @cfg {String/Object/Function} extraItemStyle Additional css style(s) to apply to each item. Should be a valid argument to Ext.Element.applyStyles.
     */
    extraItemStyle: '',

    /**
     * @cfg {String} expandBtnCls An additional class to add to the in-field expand button.
     */
    expandBtnCls: '',

    /**
     * @cfg {Boolean} fixFocusOnTabSelect When set to true, the component will not lose focus when a list item is selected with the TAB key. Defaults to true.
     */
    fixFocusOnTabSelect: true,
    
     /**
     * @cfg {Boolean} forceFormValue When set to true, the component will always return a value to the parent form getValues method, and when the parent form is submitted manually. Defaults to false, meaning the component will only be included in the parent form submission (or getValues) if at least 1 item has been selected.  
     */
    forceFormValue: true,
    /**
     * @cfg {Number} itemDelimiterKey The key code which terminates keying in of individual items, and adds the current
     * item to the list. Defaults to the ENTER key.
     */
    itemDelimiterKey: Ext.EventObject.ENTER,    
    /**
     * @cfg {Boolean} navigateItemsWithTab When set to true the tab key will navigate between selected items. Defaults to true.
     */
    navigateItemsWithTab: true,

    /**
     * @cfg {Boolean} pinList When set to true the select list will be pinned to allow for multiple selections. Defaults to true.
     */
    pinList: true,

    /**
     * @cfg {Boolean} preventDuplicates When set to true unique item values will be enforced. Defaults to true.
     */
    preventDuplicates: true,
    
    /**
     * @cfg {String} queryValuesDelimiter Used to delimit multiple values queried from the server when mode is remote.
     */
    queryValuesDelimiter: '|',
    
    /**
     * @cfg {String} queryValuesIndicator A request variable that is sent to the server (as true) to indicate that we are querying values rather than display data (as used in autocomplete) when mode is remote.
     */
    queryValuesIndicator: 'valuesqry',

    /**
     * @cfg {Boolean} removeValuesFromStore When set to true, selected records will be removed from the store. Defaults to true.
     */
    removeValuesFromStore: true,

    /**
     * @cfg {String} renderFieldBtns When set to true, will render in-field buttons for clearing the component, and displaying the list for selection. Defaults to true.
     */
    renderFieldBtns: true,

    /**
     * @cfg {Boolean} stackItems When set to true, the items will be stacked 1 per line. Defaults to false which displays the items inline.
     */
    stackItems: false,

    /**
     * @cfg {String} styleField The underlying data field that will be used to supply additional css styles to each item.
     */
    styleField : null,
    
     /**
     * @cfg {Boolean} supressClearValueRemoveEvents When true, the removeitem event will not be fired for each item when the clearValue method is called, or when the clear button is used. Defaults to false.
     */
    supressClearValueRemoveEvents : false,
    
    /**
     * @cfg {String/Boolean} validationEvent The event that should initiate field validation. Set to false to disable automatic validation (defaults to 'blur').
     */
	validationEvent : 'blur',
	
    /**
     * @cfg {String} valueDelimiter The delimiter to use when joining and splitting value arrays and strings.
     */
    valueDelimiter: ',',
    initComponent:function() {
       Ext.apply(this, {
            items           : new Ext.util.MixedCollection(false),
            usedRecords     : new Ext.util.MixedCollection(false),
            addedRecords	: [],
            remoteLookup	: [],
            hideTrigger     : true,
            grow            : false,
            resizable       : false,
            multiSelectMode : false,
            preRenderValue  : null,
			renderFieldBtns: false,
			typeAhead: false,
			pinList: false,
			emptyText: __('(empty)'),
			forceSelection: false,
			remote: true
        });
        
        if(this.transform){
            this.doTransform();
        }
        if(this.forceFormValue){
        	this.items.on({
        	   add: this.manageNameAttribute,
        	   remove: this.manageNameAttribute,
        	   clear: this.manageNameAttribute,
        	   scope: this
        	});
        }
        
        Ext.ux.form.SuperBoxSelect.superclass.initComponent.call(this);
        if(this.mode === 'remote' && this.store){
        	this.store.on('load', this.onStoreLoad, this);
        }
		
		this.on({
			'beforequery': function(evt){
				if(evt.query == ''){
					return false;
				}
				var q = {};
				var f = this.displayField;
				q[f + ' like'] = '%' + evt.query + '%';
				Ext.apply(evt, {
					forceAll: true,
					query: {
						or: q
					}
				});
			},
			scope: this
		});
		
		Garp.eventManager.on({
			'selectionchange': {
				scope: this,
				fn: this.onSelectionChange,
				buffer: 400
			},
			'save-all': {
				fn: this.relate,
				scope: this
			}
		});
		this.store= new Ext.data.DirectStore({
			autoLoad: false,
			autoSave: false,
			batch: true,
			pruneModifiedRecords: true,
			remoteSort: false,
			restful: false,
			autoDestroy: true,
			root: 'rows',
			idProperty: 'id',
			fields: Garp.dataTypes[ this.model ].getStoreFieldsFromColumnModel(),
			totalProperty: 'total',
			sortInfo: Garp.dataTypes[ this.model ].sortInfo,
			baseParams: {
				start: 0,
				limit: Garp.pageSize
			},
			api: {
				create: Ext.emptyFn,
				read: Garp[ this.model ].fetch || Ext.emptyFn,
				update: Ext.emptyFn,
				destroy: Ext.emptyFn
			}
		});
    },
	
	getParentForm: function(){
		return this.findParentBy(function(i){
			return i.getForm
		});
	},
	
	onSelectionChange: function(){
		this.clearValue();
		this.clearInvalid();
		this.disable();
		this.suspendEvents();
		var ownerId = this.getParentForm().getForm().findField('id').getValue();
		var q = {};
		q[this.rule + '.id'] = ownerId; 
		Garp[this.model].fetch({
			rule: this.rule,
			query: q
		}, function(res){
			if (!res.rows.length) {
				this.applyEmptyText();
			} else {
				Ext.each(res.rows, function(rec){
					this.addRecord(this.createRecord(rec));
				}, this);
			}
			this.originalValue = this.getValue(); // undirty
			this.resumeEvents();
			this.enable();
		}, this);
	},
	
	relate: function(){
		if (this.getParentForm().getForm().findField('id').getValue() && (this.items.length || this.isDirty())) { // only if necessary, ofcourse:
			Garp[Garp.currentModel].relate({
				model: this.model,
				rule: this.rule,
				unrelateExisting: true,
				primaryKey: this.getParentForm().getForm().findField('id').getValue(),
				foreignKeys: (function(){
					var records = [];
					this.items.each(function(item){
						records.push({
							key: item.value
						});
					});
					return records;
				}).call(this)
			}, this.onSelectionChange, this);
		}
	},
	
    onRender:function(ct, position) {
    	var h = this.hiddenName;
    	this.hiddenName = null;
        Ext.ux.form.SuperBoxSelect.superclass.onRender.call(this, ct, position);
        this.hiddenName = h;
        this.manageNameAttribute();
       
        var extraClass = (this.stackItems === true) ? 'x-superboxselect-stacked' : '';
        if(this.renderFieldBtns){
            extraClass += ' x-superboxselect-display-btns';
        }
        this.el.removeClass('x-form-text').addClass('x-superboxselect-input-field');
        
        this.wrapEl = this.el.wrap({
            tag : 'ul'
        });
        
        this.outerWrapEl = this.wrapEl.wrap({
            tag : 'div',
            cls: 'x-form-text x-superboxselect ' + extraClass
        });
       
        this.inputEl = this.el.wrap({
            tag : 'li',
            cls : 'x-superboxselect-input'
        });
        
        if(this.renderFieldBtns){
            this.setupFieldButtons().manageClearBtn();
        }
        
        this.setupFormInterception();
    },
    onStoreLoad : function(store, records, options){
    	//accomodating for bug in Ext 3.0.0 where options.params are empty
    	var q = options.params[this.queryParam] || store.baseParams[this.queryParam] || "",
    		isValuesQuery = options.params[this.queryValuesIndicator] || store.baseParams[this.queryValuesIndicator];
    	
		if (q && q.or) {
			q = q.or['name like'];
		}
		
    	if(this.removeValuesFromStore){
    		this.store.each(function(record) {
				if(this.usedRecords.containsKey(record.get(this.valueField))){
					this.store.remove(record);
				}
			}, this);
    	}
    	//queried values
    	if(isValuesQuery){
    		var params = q.split(this.queryValuesDelimiter);
    		Ext.each(params,function(p){
    			this.remoteLookup.remove(p);
    			var rec = this.findRecord(this.valueField,p);
    			if(rec){
    				this.addRecord(rec);
    			}
    		},this);
    		
    		if(this.setOriginal){
    			this.setOriginal = false;
    			this.originalValue = this.getValue();
    		}
    	}

    	//queried display (autocomplete) & addItem
    	if(q !== '' && this.allowAddNewData){
    		Ext.each(this.remoteLookup,function(r){
    			if(typeof r == "object" && r[this.displayField] == q){
    				this.remoteLookup.remove(r);
					if(records.length && records[0].get(this.displayField) === q) {
						this.addRecord(records[0]);
						return;
					}
					var rec = this.createRecord(r);
					this.store.add(rec);
		        	this.addRecord(rec);
		        	this.addedRecords.push(rec); //keep track of records added to store
		        	(function(){
		        		if(this.isExpanded()){
			        		this.collapse();
		        		}
		        	}).defer(10,this);
		        	return;
    			}
    		},this);
    	}
    	
    	var toAdd = [];
    	if(q === ''){
	    	Ext.each(this.addedRecords,function(rec){
	    		if(this.preventDuplicates && this.usedRecords.containsKey(rec.get(this.valueField))){
					return;	    			
	    		}
	    		toAdd.push(rec);
	    		
	    	},this);
	    	
    	}else{
    		var re = new RegExp(Ext.escapeRe(q) + '.*','i');
    		Ext.each(this.addedRecords,function(rec){
	    		if(this.preventDuplicates && this.usedRecords.containsKey(rec.get(this.valueField))){
					return;	    			
	    		}
	    		if(re.test(rec.get(this.displayField))){
	    			toAdd.push(rec);
	    		}
	    	},this);
	    }
    	this.store.add(toAdd);
    	this.store.sort(this.displayField, 'ASC');
		
		if(this.store.getCount() === 0 && this.isExpanded()){
			this.collapse();
		}
		
	},
    doTransform : function() {
    	var s = Ext.getDom(this.transform), transformValues = [];
            if(!this.store){
                this.mode = 'local';
                var d = [], opts = s.options;
                for(var i = 0, len = opts.length;i < len; i++){
                    var o = opts[i], oe = Ext.get(o),
                        value = oe.getAttributeNS(null,'value') || '',
                        cls = oe.getAttributeNS(null,'className') || '',
                        style = oe.getAttributeNS(null,'style') || '';
                    if(o.selected) {
                        transformValues.push(value);
                    }
                    d.push([value, o.text, cls, typeof(style) === "string" ? style : style.cssText]);
                }
                this.store = new Ext.data.SimpleStore({
                    'id': 0,
                    fields: ['value', 'text', 'cls', 'style'],
                    data : d
                });
                Ext.apply(this,{
                    valueField: 'value',
                    displayField: 'text',
                    classField: 'cls',
                    styleField: 'style'
                });
            }
           
            if(transformValues.length){
                this.value = transformValues.join(',');
            }
    },
    setupFieldButtons : function(){
        this.buttonWrap = this.outerWrapEl.createChild({
            cls: 'x-superboxselect-btns'
        });
        
        this.buttonClear = this.buttonWrap.createChild({
            tag:'div',
            cls: 'x-superboxselect-btn-clear ' + this.clearBtnCls
        });
        
        this.buttonExpand = this.buttonWrap.createChild({
            tag:'div',
            cls: 'x-superboxselect-btn-expand ' + this.expandBtnCls
        });
        
        this.initButtonEvents();
        
        return this;
    },
    initButtonEvents : function() {
        this.buttonClear.addClassOnOver('x-superboxselect-btn-over').on('click', function(e) {
            e.stopEvent();
            if (this.disabled) {
                return;
            }
            this.clearValue();
            this.el.focus();
        }, this);

        this.buttonExpand.addClassOnOver('x-superboxselect-btn-over').on('click', function(e) {
            e.stopEvent();
            if (this.disabled) {
                return;
            }
            if (this.isExpanded()) {
                this.multiSelectMode = false;
            } else if (this.pinList) {
                this.multiSelectMode = true;
            }
            this.onTriggerClick();
        }, this);
    },
    removeButtonEvents : function() {
        this.buttonClear.removeAllListeners();
        this.buttonExpand.removeAllListeners();
        return this;
    },
    clearCurrentFocus : function(){
        if(this.currentFocus){
            this.currentFocus.onLnkBlur();
            this.currentFocus = null;
        }  
        return this;        
    },
    initEvents : function() {
        var el = this.el;

        el.on({
            click   : this.onClick,
            focus   : this.clearCurrentFocus,
            blur    : this.onBlur,

            keydown : this.onKeyDownHandler,
            keyup   : this.onKeyUpBuffered,

            scope   : this
        });

        this.on({
            collapse: this.onCollapse,
            expand: this.clearCurrentFocus,
            scope: this
        });

        this.wrapEl.on('click', this.onWrapClick, this);
        this.outerWrapEl.on('click', this.onWrapClick, this);
        
        this.inputEl.focus = function() {
            el.focus();
        };

        Ext.ux.form.SuperBoxSelect.superclass.initEvents.call(this);

        Ext.apply(this.keyNav, {
            tab: function(e) {
                if (this.fixFocusOnTabSelect && this.isExpanded()) {
                    e.stopEvent();
                    el.blur();
                    this.onViewClick(false);
                    this.focus(false, 10);
                    return true;
                }

                this.onViewClick(false);
                if (el.dom.value !== '') {
                    this.setRawValue('');
                }

                return true;
            },

            down: function(e) {
                if (!this.isExpanded() && !this.currentFocus) {
                    this.onTriggerClick();
                } else {
                    this.inKeyMode = true;
                    this.selectNext();
                }
            },

            enter: function(){}
        });
    },

    onClick: function() {
        this.clearCurrentFocus();
        this.collapse();
        this.autoSize();
    },

    beforeBlur: Ext.form.ComboBox.superclass.beforeBlur,

    onFocus: function() {
        this.outerWrapEl.addClass(this.focusClass);

        Ext.ux.form.SuperBoxSelect.superclass.onFocus.call(this);
    },

    onBlur: function() {
        this.outerWrapEl.removeClass(this.focusClass);

        this.clearCurrentFocus();

        if (this.el.dom.value !== '') {
            this.applyEmptyText();
            this.autoSize();
        }

        Ext.ux.form.SuperBoxSelect.superclass.onBlur.call(this);
    },

    onCollapse: function() {
    	this.view.clearSelections();
        this.multiSelectMode = false;
    },

    onWrapClick: function(e) {
        e.stopEvent();
        this.collapse();
        this.el.focus();
        this.clearCurrentFocus();
    },
    markInvalid : function(msg) {
        var elp, t;

        if (!this.rendered || this.preventMark ) {
            return;
        }
        this.outerWrapEl.addClass(this.invalidClass);
        msg = msg || this.invalidText;

        switch (this.msgTarget) {
            case 'qtip':
                Ext.apply(this.el.dom, {
                    qtip    : msg,
                    qclass  : 'x-form-invalid-tip'
                });
                Ext.apply(this.wrapEl.dom, {
                    qtip    : msg,
                    qclass  : 'x-form-invalid-tip'
                });
                if (Ext.QuickTips) { // fix for floating editors interacting with DND
                    Ext.QuickTips.enable();
                }
                break;
            case 'title':
                this.el.dom.title = msg;
                this.wrapEl.dom.title = msg;
                this.outerWrapEl.dom.title = msg;
                break;
            case 'under':
                if (!this.errorEl) {
                    elp = this.getErrorCt();
                    if (!elp) { // field has no container el
                        this.el.dom.title = msg;
                        break;
                    }
                    this.errorEl = elp.createChild({cls:'x-form-invalid-msg'});
                    this.errorEl.setWidth(elp.getWidth(true) - 20);
                }
                this.errorEl.update(msg);
                Ext.form.Field.msgFx[this.msgFx].show(this.errorEl, this);
                break;
            case 'side':
                if (!this.errorIcon) {
                    elp = this.getErrorCt();
                    if (!elp) { // field has no container el
                        this.el.dom.title = msg;
                        break;
                    }
                    this.errorIcon = elp.createChild({cls:'x-form-invalid-icon'});
                }
                this.alignErrorIcon();
                Ext.apply(this.errorIcon.dom, {
                    qtip    : msg,
                    qclass  : 'x-form-invalid-tip'
                });
                this.errorIcon.show();
                this.on('resize', this.alignErrorIcon, this);
                break;
            default:
                t = Ext.getDom(this.msgTarget);
                t.innerHTML = msg;
                t.style.display = this.msgDisplay;
                break;
        }
        this.fireEvent('invalid', this, msg);
    },
    clearInvalid : function(){
        if(!this.rendered || this.preventMark){ // not rendered
            return;
        }
        this.outerWrapEl.removeClass(this.invalidClass);
        switch(this.msgTarget){
            case 'qtip':
                this.el.dom.qtip = '';
                this.wrapEl.dom.qtip ='';
                break;
            case 'title':
                this.el.dom.title = '';
                this.wrapEl.dom.title = '';
                this.outerWrapEl.dom.title = '';
                break;
            case 'under':
                if(this.errorEl){
                    Ext.form.Field.msgFx[this.msgFx].hide(this.errorEl, this);
                }
                break;
            case 'side':
                if(this.errorIcon){
                    this.errorIcon.dom.qtip = '';
                    this.errorIcon.hide();
                    this.un('resize', this.alignErrorIcon, this);
                }
                break;
            default:
                var t = Ext.getDom(this.msgTarget);
                t.innerHTML = '';
                t.style.display = 'none';
                break;
        }
        this.fireEvent('valid', this);
    },
    alignErrorIcon : function(){
        if(this.wrap){
            this.errorIcon.alignTo(this.wrap, 'tl-tr', [Ext.isIE ? 5 : 2, 3]);
        }
    },
    expand : function(){
        if (this.isExpanded() || !this.hasFocus) {
            return;
        }
        this.list.alignTo(this.outerWrapEl, this.listAlign).show();
        this.innerList.setOverflow('auto'); // necessary for FF 2.0/Mac
        Ext.getDoc().on({
            mousewheel: this.collapseIf,
            mousedown: this.collapseIf,
            scope: this
        });
        this.fireEvent('expand', this);
    },
    restrictHeight : function(){
        var inner = this.innerList.dom,
            st = inner.scrollTop, 
            list = this.list;
        
        inner.style.height = '';
        
        var pad = list.getFrameWidth('tb')+(this.resizable?this.handleHeight:0)+this.assetHeight,
            h = Math.max(inner.clientHeight, inner.offsetHeight, inner.scrollHeight),
            ha = this.getPosition()[1]-Ext.getBody().getScroll().top,
            hb = Ext.lib.Dom.getViewHeight()-ha-this.getSize().height,
            space = Math.max(ha, hb, this.minHeight || 0)-list.shadowOffset-pad-5;
        
        h = Math.min(h, space, this.maxHeight);
        this.innerList.setHeight(h);

        list.beginUpdate();
        list.setHeight(h+pad);
        list.alignTo(this.outerWrapEl, this.listAlign);
        list.endUpdate();
        
        if(this.multiSelectMode){
            inner.scrollTop = st;
        }
    },
    
    validateValue: function(val){
        if(this.items.getCount() === 0){
             if(this.allowBlank){
                 this.clearInvalid();
                 return true;
             }else{
                 this.markInvalid(this.blankText);
                 return false;
             }
        }
        
        this.clearInvalid();
        return true;
    },

    manageNameAttribute :  function(){
    	if(this.items.getCount() === 0 && this.forceFormValue){
    	   this.el.dom.setAttribute('name', this.hiddenName || this.name);
    	}else{
    		this.el.dom.removeAttribute('name');
    	}
    },
    setupFormInterception : function(){
       var form = this.getParentForm().form;
        if(form){
        	
        	var formGet = form.getValues;
            form.getValues = function(asString){
                this.el.dom.disabled = true;
                var oldVal = this.el.dom.value;
                this.setRawValue('');
                var vals = formGet.call(form);
                this.el.dom.disabled = false;
                this.setRawValue(oldVal);
                if(this.forceFormValue && this.items.getCount() === 0){
                	vals[this.name] = '';
                }
                return asString ? Ext.urlEncode(vals) : vals ;
            }.createDelegate(this);
        }
    },
    onResize : function(w, h, rw, rh) {
        var reduce = Ext.isIE6 ? 4 : Ext.isIE7 ? 1 : Ext.isIE8 ? 1 : 0;
        if(this.wrapEl){
            this._width = w;
            this.outerWrapEl.setWidth(w - reduce);
            if (this.renderFieldBtns) {
                reduce += (this.buttonWrap.getWidth() + 20);
                this.wrapEl.setWidth(w - reduce);
        }
        }
        Ext.ux.form.SuperBoxSelect.superclass.onResize.call(this, w, h, rw, rh);
        this.autoSize();
    },
    onEnable: function(){
        Ext.ux.form.SuperBoxSelect.superclass.onEnable.call(this);
        this.items.each(function(item){
            item.enable();
        });
        if (this.renderFieldBtns) {
            this.initButtonEvents();
        }
    },
    onDisable: function(){
        Ext.ux.form.SuperBoxSelect.superclass.onDisable.call(this);
        this.items.each(function(item){
            item.disable();
        });
        if(this.renderFieldBtns){
            this.removeButtonEvents();
        }
    },
    /**
     * Clears all values from the component.
     * @methodOf Ext.ux.form.SuperBoxSelect
     * @name clearValue
     * @param {Boolean} supressRemoveEvent [Optional] When true, the 'removeitem' event will not fire for each item that is removed.    
     */
    clearValue : function(supressRemoveEvent){
        Ext.ux.form.SuperBoxSelect.superclass.clearValue.call(this);
        this.preventMultipleRemoveEvents = supressRemoveEvent || this.supressClearValueRemoveEvents || false;
    	this.removeAllItems();
    	this.preventMultipleRemoveEvents = false;
        this.fireEvent('clear',this);
        return this;
    },
    onKeyUp : function(e) {
        if (this.editable !== false && (!e.isSpecialKey() || e.getKey() === e.BACKSPACE) && e.getKey() !== this.itemDelimiterKey && (!e.hasModifier() || e.shiftKey)) {
            this.lastKey = e.getKey();
            this.dqTask.delay(this.queryDelay);
        }        
    },
    onKeyDownHandler : function(e,t) {
    	    	
        var toDestroy,nextFocus,idx;
        if ((e.getKey() === e.DELETE || e.getKey() === e.SPACE) && this.currentFocus){
            e.stopEvent();
            toDestroy = this.currentFocus;
            this.on('expand',function(){this.collapse();},this,{single: true});
            idx = this.items.indexOfKey(this.currentFocus.key);
            
            this.clearCurrentFocus();
            
            if(idx < (this.items.getCount() -1)){
                nextFocus = this.items.itemAt(idx+1);
            }
            
            toDestroy.preDestroy(true);
            if(nextFocus){
                (function(){
                    nextFocus.onLnkFocus();
                    this.currentFocus = nextFocus;
                }).defer(200,this);
            }
        
            return true;
        }
        
        var val = this.el.dom.value, it, ctrl = e.ctrlKey;
        if(e.getKey() === this.itemDelimiterKey){
            e.stopEvent();
            if (val !== "") {
                if (ctrl || !this.isExpanded())  {  //ctrl+enter for new items
                	this.view.clearSelections();
                    this.collapse();
                    this.setRawValue('');
                    this.fireEvent('newitem', this, val);
                }
                else {
                	this.onViewClick();
                    //removed from 3.0.1
                    if(this.unsetDelayCheck){
                        this.delayedCheck = true;
                        this.unsetDelayCheck.defer(10, this);
                    }
                }
            }else{
                if(!this.isExpanded()){
                    return;
                }
                this.onViewClick();
                //removed from 3.0.1
                if(this.unsetDelayCheck){
                    this.delayedCheck = true;
                    this.unsetDelayCheck.defer(10, this);
                }
            }
            return true;
        }
        
        if(val !== '') {
            this.autoSize();
            return;
        }
        
        //select first item
        if(e.getKey() === e.HOME){
            e.stopEvent();
            if(this.items.getCount() > 0){
                this.collapse();
                it = this.items.get(0);
                it.el.focus();
                
            }
            return true;
        }
        //backspace remove
        if(e.getKey() === e.BACKSPACE){
            e.stopEvent();
            if(this.currentFocus) {
                toDestroy = this.currentFocus;
                this.on('expand',function(){
                    this.collapse();
                },this,{single: true});
                
                idx = this.items.indexOfKey(toDestroy.key);
                
                this.clearCurrentFocus();
                if(idx < (this.items.getCount() -1)){
                    nextFocus = this.items.itemAt(idx+1);
                }
                
                toDestroy.preDestroy(true);
                
                if(nextFocus){
                    (function(){
                        nextFocus.onLnkFocus();
                        this.currentFocus = nextFocus;
                    }).defer(200,this);
                }
                
                return;
            }else{
                it = this.items.get(this.items.getCount() -1);
                if(it){
                    if(this.backspaceDeletesLastItem){
                        this.on('expand',function(){this.collapse();},this,{single: true});
                        it.preDestroy(true);
                    }else{
                        if(this.navigateItemsWithTab){
                            it.onElClick();
                        }else{
                            this.on('expand',function(){
                                this.collapse();
                                this.currentFocus = it;
                                this.currentFocus.onLnkFocus.defer(20,this.currentFocus);
                            },this,{single: true});
                        }
                    }
                }
                return true;
            }
        }
        
        if(!e.isNavKeyPress()){
            this.multiSelectMode = false;
            this.clearCurrentFocus();
            return;
        }
        //arrow nav
        if(e.getKey() === e.LEFT || (e.getKey() === e.UP && !this.isExpanded())){
            e.stopEvent();
            this.collapse();
            //get last item
            it = this.items.get(this.items.getCount()-1);
            if(this.navigateItemsWithTab){ 
                //focus last el
                if(it){
                    it.focus(); 
                }
            }else{
                //focus prev item
                if(this.currentFocus){
                    idx = this.items.indexOfKey(this.currentFocus.key);
                    this.clearCurrentFocus();
                    
                    if(idx !== 0){
                        this.currentFocus = this.items.itemAt(idx-1);
                        this.currentFocus.onLnkFocus();
                    }
                }else{
                    this.currentFocus = it;
                    if(it){
                        it.onLnkFocus();
                    }
                }
            }
            return true;
        }
        if(e.getKey() === e.DOWN){
            if(this.currentFocus){
                this.collapse();
                e.stopEvent();
                idx = this.items.indexOfKey(this.currentFocus.key);
                if(idx == (this.items.getCount() -1)){
                    this.clearCurrentFocus.defer(10,this);
                }else{
                    this.clearCurrentFocus();
                    this.currentFocus = this.items.itemAt(idx+1);
                    if(this.currentFocus){
                        this.currentFocus.onLnkFocus();
                    }
                }
                return true;
            }
        }
        if(e.getKey() === e.RIGHT){
            this.collapse();
            it = this.items.itemAt(0);
            if(this.navigateItemsWithTab){ 
                //focus first el
                if(it){
                    it.focus(); 
                }
            }else{
                if(this.currentFocus){
                    idx = this.items.indexOfKey(this.currentFocus.key);
                    this.clearCurrentFocus();
                    if(idx < (this.items.getCount() -1)){
                        this.currentFocus = this.items.itemAt(idx+1);
                        if(this.currentFocus){
                            this.currentFocus.onLnkFocus();
                        }
                    }
                }else{
                    this.currentFocus = it;
                    if(it){
                        it.onLnkFocus();
                    }
                }
            }
        }
    },
    onKeyUpBuffered : function(e){
        if(!e.isNavKeyPress()){
            this.autoSize();
        }
    },
    reset :  function(){
    	this.killItems();
        Ext.ux.form.SuperBoxSelect.superclass.reset.call(this);
        this.addedRecords = [];
        this.autoSize().setRawValue('');
    },
    applyEmptyText : function(){
		this.setRawValue('');
        if(this.items.getCount() > 0){
            this.el.removeClass(this.emptyClass);
            this.setRawValue('');
            return this;
        }
        if(this.rendered && this.emptyText && this.getRawValue().length < 1){
            this.setRawValue(this.emptyText);
            this.el.addClass(this.emptyClass);
        }
        return this;
    },
    /**
     * @private
     * 
     * Use clearValue instead
     */
    removeAllItems: function(){
    	this.items.each(function(item){
            item.preDestroy(true);
        },this);
        this.manageClearBtn();
        return this;
    },
    killItems : function(){
    	this.items.each(function(item){
            item.kill();
        },this);
        this.resetStore();
        this.items.clear();
        this.manageClearBtn();
        return this;
    },
    resetStore: function(){
        this.store.clearFilter();
        if(!this.removeValuesFromStore){
            return this;
        }
        this.usedRecords.each(function(rec){
            this.store.add(rec);
        },this);
        this.usedRecords.clear();
        this.sortStore();
        return this;
    },
    sortStore: function(){
        var ss = this.store.getSortState();
        if(ss && ss.field){
            this.store.sort(ss.field, ss.direction);
        }
        return this;
    },
    getCaption: function(dataObject){
        if(typeof this.displayFieldTpl === 'string') {
            this.displayFieldTpl = new Ext.XTemplate(this.displayFieldTpl);
        }
        var caption, recordData = dataObject instanceof Ext.data.Record ? dataObject.data : dataObject;
      
        if(this.displayFieldTpl) {
            caption = this.displayFieldTpl.apply(recordData);
        } else if(this.displayField) {
            caption = recordData[this.displayField];
        }
        
        return caption;
    },
    addRecord : function(record) {
        var display = record.data[this.displayField],
            caption = this.getCaption(record),
            val = record.data[this.valueField],
            cls = this.classField ? record.data[this.classField] : '',
            style = this.styleField ? record.data[this.styleField] : '';

        if (this.removeValuesFromStore) {
            this.usedRecords.add(val, record);
            this.store.remove(record);
        }
        
        this.addItemBox(val, display, caption, cls, style);
        this.fireEvent('additem', this, val, record);
    },
    createRecord : function(recordData){
        if(!this.recordConstructor){
            var recordFields = [
                {name: this.valueField},
                {name: this.displayField}
            ];
            if(this.classField){
                recordFields.push({name: this.classField});
            }
            if(this.styleField){
                recordFields.push({name: this.styleField});
            }
            this.recordConstructor = Ext.data.Record.create(recordFields);
        }
        return new this.recordConstructor(recordData);
    },
    /**
     * Adds an array of items to the SuperBoxSelect component if the {@link #Ext.ux.form.SuperBoxSelect-allowAddNewData} config is set to true.
     * @methodOf Ext.ux.form.SuperBoxSelect
     * @name addItem
     * @param {Array} newItemObjects An Array of object literals containing the property names and values for an item. The property names must match those specified in {@link #Ext.ux.form.SuperBoxSelect-displayField}, {@link #Ext.ux.form.SuperBoxSelect-valueField} and {@link #Ext.ux.form.SuperBoxSelect-classField} 
     */
    addItems : function(newItemObjects){
    	if (Ext.isArray(newItemObjects)) {
			Ext.each(newItemObjects, function(item) {
				this.addItem(item);
			}, this);
		} else {
			this.addItem(newItemObjects);
		}
    },
    /**
     * Adds a new non-existing item to the SuperBoxSelect component if the {@link #Ext.ux.form.SuperBoxSelect-allowAddNewData} config is set to true.
     * This method should be used in place of addItem from within the newitem event handler.
     * @methodOf Ext.ux.form.SuperBoxSelect
     * @name addNewItem
     * @param {Object} newItemObject An object literal containing the property names and values for an item. The property names must match those specified in {@link #Ext.ux.form.SuperBoxSelect-displayField}, {@link #Ext.ux.form.SuperBoxSelect-valueField} and {@link #Ext.ux.form.SuperBoxSelect-classField} 
     */
    addNewItem : function(newItemObject){
    	this.addItem(newItemObject,true);
    },
    /**
     * Adds an item to the SuperBoxSelect component if the {@link #Ext.ux.form.SuperBoxSelect-allowAddNewData} config is set to true.
     * @methodOf Ext.ux.form.SuperBoxSelect
     * @name addItem
     * @param {Object} newItemObject An object literal containing the property names and values for an item. The property names must match those specified in {@link #Ext.ux.form.SuperBoxSelect-displayField}, {@link #Ext.ux.form.SuperBoxSelect-valueField} and {@link #Ext.ux.form.SuperBoxSelect-classField} 
     */
    addItem : function(newItemObject, /*hidden param*/ forcedAdd){
        
        var val = newItemObject[this.valueField];

        if(this.disabled) {
            return false;
        }
        if(this.preventDuplicates && this.hasValue(val)){
            return;
        }
        
        //use existing record if found
        var record = this.findRecord(this.valueField, val);
        if (record) {
            this.addRecord(record);
            return;
        } else if (!this.allowAddNewData) { // else it's a new item
            return;
        }
        
        if(this.mode === 'remote'){
        	this.remoteLookup.push(newItemObject); 
        	this.doQuery(val,false,false,forcedAdd);
        	return;
        }
        
        var rec = this.createRecord(newItemObject);
        this.store.add(rec);
        this.addRecord(rec);
        
        return true;
    },
    addItemBox : function(itemVal,itemDisplay,itemCaption, itemClass, itemStyle) {
        var hConfig, parseStyle = function(s){
            var ret = '';
            if(typeof s == 'function'){
                ret = s.call();
            }else if(typeof s == 'object'){
                for(var p in s){
                    ret+= p +':'+s[p]+';';
                }
            }else if(typeof s == 'string'){
                ret = s + ';';
            }
            return ret;
        }, itemKey = Ext.id(null,'sbx-item'), box = new Ext.ux.form.SuperBoxSelectItem({
            owner: this,
            disabled: this.disabled,
            renderTo: this.wrapEl,
            cls: this.extraItemCls + ' ' + itemClass,
            style: parseStyle(this.extraItemStyle) + ' ' + itemStyle,
            caption: itemCaption,
            display: itemDisplay,
            value:  itemVal,
            key: itemKey,
            listeners: {
                'remove': function(item){
                    if(this.fireEvent('beforeremoveitem',this,item.value) === false){
                        return;
                    }
                    this.items.removeKey(item.key);
                    if(this.removeValuesFromStore){
                        if(this.usedRecords.containsKey(item.value)){
                            this.store.add(this.usedRecords.get(item.value));
                            this.usedRecords.removeKey(item.value);
                            this.sortStore();
                            if(this.view){
                                this.view.render();
                            }
                        }
                    }
                    if(!this.preventMultipleRemoveEvents){
                    	this.fireEvent.defer(250,this,['removeitem',this,item.value, this.findInStore(item.value)]);
                    }
                },
                destroy: function(){
                    this.collapse();
                    this.autoSize().manageClearBtn().validateValue();
                },
                scope: this
            }
        });
        box.render();
        
        hConfig = {
            tag :'input', 
            type :'hidden', 
            value : itemVal,
            name : (this.hiddenName || this.name)
        };
        
        if(this.disabled){
        	Ext.apply(hConfig,{
        	   disabled : 'disabled'
        	})
        }
        box.hidden = this.el.insertSibling(hConfig,'before');

        this.items.add(itemKey,box);
        this.applyEmptyText().autoSize().manageClearBtn().validateValue();
    },
    manageClearBtn : function() {
        if (!this.renderFieldBtns || !this.rendered) {
            return this;
        }
        var cls = 'x-superboxselect-btn-hide';
        if (this.items.getCount() === 0) {
            this.buttonClear.addClass(cls);
        } else {
            this.buttonClear.removeClass(cls);
        }
        return this;
    },
    findInStore : function(val){
        var index = this.store.find(this.valueField, val);
        if(index > -1){
            return this.store.getAt(index);
        }
        return false;
    },
    /**
     * Returns a String value containing a concatenated list of item values. The list is concatenated with the {@link #Ext.ux.form.SuperBoxSelect-valueDelimiter}.
     * @methodOf Ext.ux.form.SuperBoxSelect
     * @name getValue
     * @return {String} a String value containing a concatenated list of item values. 
     */
    getValue : function() {
        var ret = [];
        this.items.each(function(item){
            ret.push(item.value);
        });
        return ret.join(this.valueDelimiter);
    },
    /**
     * Returns an Array of item objects containing the {@link #Ext.ux.form.SuperBoxSelect-displayField}, {@link #Ext.ux.form.SuperBoxSelect-valueField}, {@link #Ext.ux.form.SuperBoxSelect-classField} and {@link #Ext.ux.form.SuperBoxSelect-styleField} properties.
     * @methodOf Ext.ux.form.SuperBoxSelect
     * @name getValueEx
     * @return {Array} an array of item objects. 
     */
    getValueEx : function() {
        var ret = [];
        this.items.each(function(item){
            var newItem = {};
            newItem[this.valueField] = item.value;
            newItem[this.displayField] = item.display;
            if(this.classField){
                newItem[this.classField] = item.cls || '';
            }
            if(this.styleField){
                newItem[this.styleField] = item.style || '';
            }
            ret.push(newItem);
        },this);
        return ret;
    },
    // private
    initValue : function(){
 
        Ext.ux.form.SuperBoxSelect.superclass.initValue.call(this);
        if(this.mode === 'remote') {
        	this.setOriginal = true;
        }
    },
    /**
     * Sets the value of the SuperBoxSelect component.
     * @methodOf Ext.ux.form.SuperBoxSelect
     * @name setValue
     * @param {String|Array} value An array of item values, or a String value containing a delimited list of item values. (The list should be delimited with the {@link #Ext.ux.form.SuperBoxSelect-valueDelimiter) 
     */
    setValue : function(value){
        if(!this.rendered){
            this.value = value;
            return;
        }
            
        this.removeAllItems().resetStore();
        this.remoteLookup = [];
        
        if(Ext.isEmpty(value)){
        	return;
        }
        
        var values = value;
        if(!Ext.isArray(value)){
            value = '' + value;
            values = value.split(this.valueDelimiter); 
        }
        
        Ext.each(values,function(val){
            var record = this.findRecord(this.valueField, val);
            if(record){
                this.addRecord(record);
            }else if(this.mode === 'remote'){
				this.remoteLookup.push(val);            	
            }
        },this);
        
        if(this.mode === 'remote'){
      		var q = this.remoteLookup.join(this.queryValuesDelimiter); 
      		this.doQuery(q,false, true); //3rd param to specify a values query
        }
        
    },
    /**
     * Sets the value of the SuperBoxSelect component, adding new items that don't exist in the data store if the {@link #Ext.ux.form.SuperBoxSelect-allowAddNewData} config is set to true.
     * @methodOf Ext.ux.form.SuperBoxSelect
     * @name setValue
     * @param {Array} data An Array of item objects containing the {@link #Ext.ux.form.SuperBoxSelect-displayField}, {@link #Ext.ux.form.SuperBoxSelect-valueField} and {@link #Ext.ux.form.SuperBoxSelect-classField} properties.  
     */
    setValueEx : function(data){
        this.removeAllItems().resetStore();
        
        if(!Ext.isArray(data)){
            data = [data];
        }
        this.remoteLookup = [];
        
        if(this.allowAddNewData && this.mode === 'remote'){ // no need to query
            Ext.each(data, function(d){
            	var r = this.findRecord(this.valueField, d[this.valueField]) || this.createRecord(d);
                this.addRecord(r);
            },this);
            return;
        }
        
        Ext.each(data,function(item){
            this.addItem(item);
        },this);
    },
    /**
     * Returns true if the SuperBoxSelect component has a selected item with a value matching the 'val' parameter.
     * @methodOf Ext.ux.form.SuperBoxSelect
     * @name hasValue
     * @param {Mixed} val The value to test.
     * @return {Boolean} true if the component has the selected value, false otherwise.
     */
    hasValue: function(val){
        var has = false;
        this.items.each(function(item){
            if(item.value == val){
                has = true;
                return false;
            }
        },this);
        return has;
    },
    onSelect : function(record, index) {
    	if (this.fireEvent('beforeselect', this, record, index) !== false){
            var val = record.data[this.valueField];
            
            if(this.preventDuplicates && this.hasValue(val)){
                return;
            }
            
            this.setRawValue('');
            this.lastSelectionText = '';
            
            if(this.fireEvent('beforeadditem',this,val) !== false){
                this.addRecord(record);
            }
            if(this.store.getCount() === 0 || !this.multiSelectMode){
                this.collapse();
            }else{
                this.restrictHeight();
            }
    	}
    },
    onDestroy : function() {
        this.items.purgeListeners();
        this.killItems();
        if (this.renderFieldBtns) {
            Ext.destroy(
                this.buttonClear,
                this.buttonExpand,
                this.buttonWrap
            );
        }

        Ext.destroy(
            this.inputEl,
            this.wrapEl,
            this.outerWrapEl
        );

        Ext.ux.form.SuperBoxSelect.superclass.onDestroy.call(this);
    },
    autoSize : function(){
        if(!this.rendered){
            return this;
        }
        if(!this.metrics){
            this.metrics = Ext.util.TextMetrics.createInstance(this.el);
        }
        var el = this.el,
            v = el.dom.value,
            d = document.createElement('div');

        if(v === "" && this.emptyText && this.items.getCount() < 1){
            v = this.emptyText;
        }
        d.appendChild(document.createTextNode(v));
        v = d.innerHTML;
        d = null;
        v += "&#160;";
        var w = Math.max(this.metrics.getWidth(v) +  24, 24);
        if(typeof this._width != 'undefined'){
            w = Math.min(this._width, w);
        }
        this.el.setWidth(w);
        
        if(Ext.isIE){
            this.el.dom.style.top='0';
        }
        return this;
    },
    doQuery : function(q, forceAll,valuesQuery, forcedAdd){
        q = Ext.isEmpty(q) ? '' : q;
        var qe = {
            query: q,
            forceAll: forceAll,
            combo: this,
            cancel:false
        };
        if(this.fireEvent('beforequery', qe)===false || qe.cancel){
            return false;
        }
        q = qe.query;
        forceAll = qe.forceAll;
        if(forceAll === true || (q.length >= this.minChars) || valuesQuery && !Ext.isEmpty(q)){
            if(this.lastQuery !== q || forcedAdd){
            	this.lastQuery = q;
                if(this.mode == 'local'){
                    this.selectedIndex = -1;
                    if(forceAll){
                        this.store.clearFilter();
                    }else{
                        this.store.filter(this.displayField, q);
                    }
                    this.onLoad();
                }else{
                	
                    this.store.baseParams[this.queryParam] = q;
                    this.store.baseParams[this.queryValuesIndicator] = valuesQuery;
                    this.store.load({
                        params: this.getParams(q)
                    });
                    if(!forcedAdd){
                        this.expand();
                    }
                }
            }else{
                this.selectedIndex = -1;
                this.onLoad();
            }
        }
    }
});
Ext.reg('superboxselect', Ext.ux.form.SuperBoxSelect);
/*
 * @private
 */
Ext.ux.form.SuperBoxSelectItem = function(config){
    Ext.apply(this,config);
    Ext.ux.form.SuperBoxSelectItem.superclass.constructor.call(this); 
};
/*
 * @private
 */
Ext.ux.form.SuperBoxSelectItem = Ext.extend(Ext.ux.form.SuperBoxSelectItem,Ext.Component, {
    initComponent : function(){
        Ext.ux.form.SuperBoxSelectItem.superclass.initComponent.call(this); 
    },
    onElClick : function(e){
        var o = this.owner;
        o.clearCurrentFocus().collapse();
        if(o.navigateItemsWithTab){
            this.focus();
        }else{
            o.el.dom.focus();
            var that = this;
            (function(){
                this.onLnkFocus();
                o.currentFocus = this;
            }).defer(10,this);
        }
    },
    
    onLnkClick : function(e){
        if(e) {
            e.stopEvent();
        }
        this.preDestroy();
        if(!this.owner.navigateItemsWithTab){
            this.owner.el.focus();
        }
    },
    onLnkFocus : function(){
        this.el.addClass("x-superboxselect-item-focus");
        this.owner.outerWrapEl.addClass("x-form-focus");
    },
    
    onLnkBlur : function(){
        this.el.removeClass("x-superboxselect-item-focus");
        this.owner.outerWrapEl.removeClass("x-form-focus");
    },
    
    enableElListeners : function() {
        this.el.on('click', this.onElClick, this, {stopEvent:true});
       
	    //@TODO: refine this to take close/clear button into account:
        this.el.addClassOnOver('x-superboxselect-item x-superboxselect-item-hover');
		this.el.on('mouseout', function(){this.el.removeClass('x-superboxselect-item-hover');},this);
    },

    enableLnkListeners : function() {
        this.lnk.on({
            click: this.onLnkClick,
            focus: this.onLnkFocus,
            blur:  this.onLnkBlur,
            scope: this
        });
    },
    
    enableAllListeners : function() {
        this.enableElListeners();
        this.enableLnkListeners();
    },
    disableAllListeners : function() {
        this.el.removeAllListeners();
        this.lnk.un('click', this.onLnkClick, this);
        this.lnk.un('focus', this.onLnkFocus, this);
        this.lnk.un('blur', this.onLnkBlur, this);
    },
    onRender : function(ct, position){
        
        Ext.ux.form.SuperBoxSelectItem.superclass.onRender.call(this, ct, position);
        
        var el = this.el;
        if(el){
            el.remove();
        }
        
        this.el = el = ct.createChild({ tag: 'li' }, ct.last());
        el.addClass('x-superboxselect-item');
        
        var btnEl = this.owner.navigateItemsWithTab ? ( Ext.isSafari ? 'button' : 'a') : 'span';
        var itemKey = this.key;
        
        Ext.apply(el, {
            focus: function(){
                var c = this.down(btnEl +'.x-superboxselect-item-close');
                if(c){
                	c.focus();
                }
            },
            preDestroy: function(){
                this.preDestroy();
            }.createDelegate(this)
        });
        
        this.enableElListeners();

        el.update(this.caption);

        var cfg = {
            tag: btnEl,
            'class': 'x-superboxselect-item-close',
            tabIndex : this.owner.navigateItemsWithTab ? '0' : '-1'
        };
        if(btnEl === 'a'){
            cfg.href = '#';
        }
        this.lnk = el.createChild(cfg);
        
        
        if(!this.disabled) {
            this.enableLnkListeners();
        }else {
            this.disableAllListeners();
        }
        
        this.on({
            disable: this.disableAllListeners,
            enable: this.enableAllListeners,
            scope: this
        });

        this.setupKeyMap();
    },
    setupKeyMap : function(){
        this.keyMap = new Ext.KeyMap(this.lnk, [
            {
                key: [
                    Ext.EventObject.BACKSPACE, 
                    Ext.EventObject.DELETE, 
                    Ext.EventObject.SPACE
                ],
                fn: this.preDestroy,
                scope: this
            }, {
                key: [
                    Ext.EventObject.RIGHT,
                    Ext.EventObject.DOWN
                ],
                fn: function(){
                    this.moveFocus('right');
                },
                scope: this
            },
            {
                key: [Ext.EventObject.LEFT,Ext.EventObject.UP],
                fn: function(){
                    this.moveFocus('left');
                },
                scope: this
            },
            {
                key: [Ext.EventObject.HOME],
                fn: function(){
                    var l = this.owner.items.get(0).el.focus();
                    if(l){
                        l.el.focus();
                    }
                },
                scope: this
            },
            {
                key: [Ext.EventObject.END],
                fn: function(){
                    this.owner.el.focus();
                },
                scope: this
            },
            {
                key: Ext.EventObject.ENTER,
                fn: function(){
                }
            }
        ]);
        this.keyMap.stopEvent = true;
    },
    moveFocus : function(dir) {
        var el = this.el[dir == 'left' ? 'prev' : 'next']() || this.owner.el;
	
        el.focus.defer(100,el);
    },

    preDestroy : function(supressEffect) {
    	if(this.fireEvent('remove', this) === false){
	    	return;
	    }	
    	var actionDestroy = function(){
            if(this.owner.navigateItemsWithTab){
                this.moveFocus('right');
            }
            this.hidden.remove();
            this.hidden = null;
            this.destroy();
        };
        
        if(supressEffect){
            actionDestroy.call(this);
        } else {
            this.el.hide({
                duration: 0.2,
                callback: actionDestroy,
                scope: this
            });
        }
        return this;
    },
    kill : function(){
    	this.hidden.remove();
        this.hidden = null;
        this.purgeListeners();
        this.destroy();
    },
    onDisable : function() {
    	if(this.hidden){
    	    this.hidden.dom.setAttribute('disabled', 'disabled');
    	}
    	this.keyMap.disable();
    	Ext.ux.form.SuperBoxSelectItem.superclass.onDisable.call(this);
    },
    onEnable : function() {
    	if(this.hidden){
    	    this.hidden.dom.removeAttribute('disabled');
    	}
    	this.keyMap.enable();
    	Ext.ux.form.SuperBoxSelectItem.superclass.onEnable.call(this);
    },
    onDestroy : function() {
        Ext.destroy(
            this.lnk,
            this.el
        );
        
        Ext.ux.form.SuperBoxSelectItem.superclass.onDestroy.call(this);
    }
});
/**
 * MetaPanel: meta information about the currently selected record in the formPanel
 */

Ext.ns('Garp');

Garp.MetaPanel = Ext.extend(Ext.Container, {

	/**
	 * @cfg disable publishable editor
	 */
	disablePublishedEdit: false,

	/**
	 * @cfg disable created editor
	 */
	disableCreatedEdit: false,

	/**
	 * @cfg disable author id editor
	 */
	disableAuthorIdEdit: false,

	/**
	 * @TODO: add more disable cfg's when needed
	 */

	region: 'east',
	width: 190,
	maxWidth: 190,
	header: false,
	border: false,
	cls: 'garp-metapanel',
	ref: 'metaPanel',
	monitorValid: false,

	/**
	 * Record to data, and fetch remote stuff
	 * @param {Object} rec
	 */
	processData: function(rec){
		this.rec = rec;
		this.update(rec.data);
		this.bindEditors();
		Ext.get('author-name').update(rec.get('author'));
		Ext.get('modifier-name').update(rec.get('modifier'));
	},

	/**
	 * Simple items, but they need Column Model based renderers
	 * @param {String} item or {Object} with property tpl for direct tpl access
	 */
	buildTplItem: function(item){
		if (Ext.isObject(item)) {
			return item.tpl || '';
		} else {
			var out = '';
			out += '<h3>' + __(item) + '</h3>';
			out += '<p>{' + item + '}</p>'; // implement CM based renderer here
			return out;
		}
	},

	/**
	 *  Setup template
	 */
	buildTpl: function(){
		var items = Garp.dataTypes[Garp.currentModel].metaPanelItems;
		var tpl = [];

		Ext.each(items, function(item){
			switch(item){
				case 'created':
					tpl.push('<h3>', __('Created'), '</h3>',
					'<span id="author-image"></span>', '<a id="author-name"></a>',
					'<a id="created-date">{[Garp.renderers.metaPanelDateRenderer(values.created)]}</a>');
				break;
				case 'modified':
					tpl.push('<h3>', __('Modified'), '</h3>',
					 '<span id="modifier-image"></span>', '<p id="modifier-name"></p>',
					 '<p id="modified-date">{[Garp.renderers.metaPanelDateRenderer(values.modified)]}</p>');
				break;
				case 'published':
					tpl.push('<h3>', __('Published'), '</h3>',
						'<tpl if="typeof online_status !== &quot;undefined&quot;  && online_status === &quot;1&quot;">',
							(this.disablePublishedEdit
								? '<span class="published-date">{[Garp.renderers.metaPanelDateRenderer(values.published)]}</span>'
								: [
									'<a class="published-date">{[Garp.renderers.metaPanelDateRenderer(values.published)]}</a>',
									'<tpl if="values.published">',
										' <a class="remove-published-date" title="', __('Delete'), '"> </a>',
									'</tpl>'
								  ].join('')
							),

						'</tpl>',
						'<div id="online-status">', __('Draft'), ': ',
						'<tpl if="typeof online_status !== &quot;undefined&quot; && online_status == &quot;1&quot;">',
							'<input type="checkbox">',
						'</tpl>',
						'<tpl if="typeof online_status !== &quot;undefined&quot;  && (!online_status || online_status === &quot;0&quot;) ">',
							'<input type="checkbox" checked>',
						'</tpl></div>');
				break;
				default:
					tpl.push(this.buildTplItem(item));
				break;
			}
		}, this);

		tpl.push('<div class="copyright">', 'Garp &copy {[Garp.renderers.yearRenderer(new Date())]} by ', '<a href="http://grrr.nl/" target="_blank">', 'Grrr', '</a><br>version 3.5', '</div>');

		this.tpl = new Ext.XTemplate(tpl, {
			compiled: true
		});
	},


	/**
	 * Saves the new value on the server
	 * @param {Object} name
	 * @param {Object} val
	 */
	setVal: function(name, val){
		var rec = Garp.gridPanel.getSelectionModel().getSelected();
		if (rec.get('name') != val) { // only save when changed
			this.fireEvent('dirty');
			rec.beginEdit();
			rec.set(name, val);
			rec.endEdit();
			if (!rec.phantom) { // only save when record is already saved.
				this.disable();
				this.fireEvent('save-all');
			}
		}
	},

	/**
	 * Binds the editors to the UI elements
	 */
	bindEditors: function(){
		this.el.select('#author-name').un('click').on('click', function(e, el){
			if(this.disableAuthorIdEdit){
				return;
			}
			this.authorIdEditor.startEdit(el, this.rec.get('author_id'));
			this.authorIdEditor.field.triggerFn();
			this.authorIdEditor.el.hide();
		}, this);
		this.el.select('#online-status input').un('click').on('click', function(e, el){
			this.setVal('online_status', Ext.get(el).getAttribute('checked') ? '0' : '1', true);
		}, this);
		this.el.select('#created-date').un('click').on('click', function(e, el){
			if(this.disableCreatedEdit){
				return;
			}
			this.createdDateEditor.startEdit(el, this.rec.get('created'));
			this.createdDateEditor.field.df.onTriggerClick();
		}, this);
		this.el.select('.published-date').un('click').on('click', function(e, el){
			if(this.disablePublishedEdit){
				return;
			}
			this.publishedDateEditor.startEdit(el, this.rec.get('published'));
			this.publishedDateEditor.field.df.onTriggerClick();
		}, this);
		this.el.select('.remove-published-date').un('click').on('click', function(e, el){
			this.setVal('published', null);
		}, this);
	},

	/**
	 * Creates editors for use later on
	 */
	buildEditors: function(){
		var cfg = {
			field: {
				xtype: 'xdatetime',
				width: 180,
				emptyText: __('No date specified'),
				timeConfig: {
					increment: 30
				},
				dateConfig: {
					emptyText: __('No date specified')
				},
				timeWidth: 60,
				dateFormat: 'j M Y'
			},
			offsets: [0, -6],
			alignment: 'tl?',
			completeOnEnter: true,
			cancelOnEsc: true,
			updateEl: false,
			ignoreNoChange: true
		};

		this.authorIdEditor = new Ext.Editor(Ext.apply({}, {
			disabled: this.disableAuthorIdEdit,
			field: {
				xtype: 'relationfield',
				model: 'User',
				displayField: 'fullname',
				listeners: {
					'select': function(v){
						if (v && v.selected) {
							this.setVal('author_id', v.selected.id);
						}
						this.authorIdEditor.completeEdit();
					},
					scope: this
				}
			}
		}, cfg));
		this.createdDateEditor = new Ext.Editor(Ext.apply({}, {
			disabled: this.disableCreatedEdit,
			listeners: {
				'beforecomplete': function(e, v){
					if (v) {
						this.setVal('created', v);
					}
				},
				scope: this
			}
		}, cfg));
		this.publishedDateEditor = new Ext.Editor(Ext.apply({}, {
			disabled: this.disablePublishedEdit,
			listeners: {
				'beforecomplete': function(e, v){
					if (v) {
						this.setVal('published', v);
					}
				},
				scope: this
			}
		}, cfg));
	},

	/**
	 * Init!
	 * @param {Object} parent container
	 */
	initComponent: function(ct){
		this.buildTpl();
		this.buildEditors();
		Garp.MetaPanel.superclass.initComponent.call(this,ct);
		this.on({
			'loaddata': {
				fn: this.processData,
				scope: this
			}
		});
	}

});

/**
 * @class Garp.ModelMenu
 * @author Peter
 * garp.modelmenu.js
 * 
 */

Garp.ModelMenu = function(cfg){
	
	Ext.apply(this, cfg);
	
	var menuItems = [];
	
	for (var key in Garp.dataTypes){
		if(this.menuItems.indexOf(key) == -1){
			this.menuItems.push(key);
		}	
	}
	
	menuItems.push((function(){
		var model, models = [];
		Ext.each(this.menuItems, function(model){
			if (model == '-') { 
				// Check if models are already in array, otherwise a separator doesn't make sense.
				if (models.length > 0 && models[models.length - 1] != '-') {
					models.push('-');
				}
			} else {
				if(!Garp.dataTypes[model]){
					throw 'Oops! JS model "' + model + '" not found! Is it spawned and bugfree?';
				}
				var dataType = Garp.dataTypes[model];
				if(!Garp[model]){
					throw 'Oops! dataType "' + model + '" not found! Does it exist in the smd?';
				}
				if (dataType.setupACL(Garp[model])) {
					dataType.fireEvent('init');	
					models.push({
						hidden: dataType.hidden,
						text: __(dataType.text),
						name: dataType.text,
						iconCls: dataType.iconCls,
						handler: function(){
							Garp.viewport.formPanelCt.show();
							Garp.viewport.gridPanelCt.expand();
							Garp.eventManager.fireEvent('modelchange', true, model, null, null);
						}
					});
				} else {
					delete Garp.dataTypes[dataType.text];
				}
			}
		});
		return models;
	}).call(this));
	
	Garp.ModelMenu.superclass.constructor.call(this, Ext.applyIf(cfg, {
		cls: 'garp-model-menu',
		text: __('Content'),
		iconCls: 'icon-no-model',
		menu: new Ext.menu.Menu({
			items: menuItems
		})
	}));

	this.on('afterrender', function(){
		this.getEl().on('click', function(){
			Garp.viewport.gridPanelCt.expand();
		});
	}, this);
	
	
};

Ext.extend(Garp.ModelMenu, Ext.Button, {});

/**
 * garp.welcomepanel.js
 *
 * Convenience Class, creates a panel with a message from HTML markup in de view.
 *
 * @class Garp.WelcomePanel
 * @extends Panel
 * @author Peter
 */

Garp.WelcomePanel = function(cfg){
	this.html = Ext.getDom('welcome-panel-content').innerHTML;
	Garp.WelcomePanel.superclass.constructor.call(this, cfg);
};

Ext.extend(Garp.WelcomePanel, Ext.Container, {
	border: true,
	hideButtonArr: ['newButton', 'deleteButton', 'separator'],
	listeners: {
		'render': function () {
			Ext.each(this.hideButtonArr, function(item){
				Garp.toolbar[item].hide();
			});
		},
		'destroy': function () {
			Ext.each(this.hideButtonArr, function(item){
				Garp.toolbar[item].show();
			});
		}
	}
});

/**
 * @class Garp.GridPanel
 * @extends Ext.grid.GridPanel
 * @author Peter
 *
 * @description Defines both Garp.gridpanel & its corresponding Garp.gridpanelstore.
 * Also decorates the directstore to allow for querying (searching)
 * 
 */


Garp.GridPanel = Ext.extend(Ext.grid.GridPanel, {
	loadMask: true,

	/**
	 * @cfg {string} model: current Model for this panel
	 */
	model: null,
	
	/**
	 * @function newItem
	 * Creates one new item in the store. Displays it on the grid and selects it
	 * Not applicable if this panel is disabled (various reasons) or the current model doesn't support it.
	 */
	newItem: function(){
		if (this.disabled || Garp.dataTypes[Garp.currentModel].disableCreate) {
			return;
		}
		var rec = new this.store.recordType(Ext.apply({}, Garp.dataTypes[this.model].defaultData));
		this.store.insert(0, rec);
		this.getSelectionModel().selectFirstRow();
	},
	
	/**
	 * @function deleteItems
	 * Delete one (or more) item(s) from the store and calls save to sync it with the server
	 * Not applicable if this panel is disabled (various reasons) or the current model doesn't support it.
	 */
	deleteItems: function(){
		
		var count = this.getSelectionModel().getCount();
		if (count <= 0) {
			return;
		}
		
		// phantom records will get deleted right away. Always. No questioning ;)
		var rec = this.getSelectionModel().getSelected();
		if(rec.phantom){
			this.store.remove(rec);
			this.getSelectionModel().clearSelections();
			this.fireEvent('afterdelete');
			return;
		}
		
		// not allowed?
		if (this.disabled || Garp.dataTypes[Garp.currentModel].disableDelete) {
			return;
		}
		
		Ext.Msg.confirm(__('Garp'), count == 1 ? __('Are you sure you want to delete the selected item?') : __('Are you sure you want to delete the selected items?'), function(btn){
			var sm = this.getSelectionModel();
			if (btn == 'yes') {
				Ext.each(sm.getSelections(), function(rec){
					this.store.remove(rec);
				});
				this.getStore().save();
				sm.clearSelections();
				this.fireEvent('afterdelete');
			}
			sm.selectRow(sm.last); // focus gridpanel again.
		}, this);
	},
	
	/**
	 * @function saveAll
	 */
	saveAll: function(){
		this.fireEvent('beforesave');
		
		var scrollTop = this.getView().scroller.getScroll().top;
				
		// Let's not show a loadMask if there's no modified records, a save operation would appear to never end,
		// because the listener to hide te loadMask will never be called:
		if (this.getStore().getModifiedRecords().length > 0) {
			this.loadMask.show();
		}
		
		var currentModified = this.getStore().getModifiedRecords();
		if(currentModified.length){
			currentModified = currentModified[0]; 
		}
		
		// Reload the store after saving, to get an accurate and fresh new view on the data
		this.getStore().on({
			'save': {
				fn: function(store){
					// Check to see if there are any modified (or phantom) records left.
					// If so, an error has possibly occurred that the user has to fix, before we can continue reloading the store (and view):
					if (this.getStore().getModifiedRecords().length === 0) {
						store.on({
							'load': {
								scope: this,
								single: true,
								fn: function(){
									
									if (currentModified && currentModified.get && !store.getById(currentModified.get('id'))) {
										this.getStore().on({
											load: {
												scope: this,
												single: true,
												fn: function(){
													this.loadMask.hide();
													this.getSelectionModel().selectFirstRow();
													this.getTopToolbar().searchById(currentModified.get('id'));
													this.fireEvent('after-save', this.getSelectionModel());
													this.enable();
												}
											}
										});
										this.getStore().load({
											params: {
												query: {
													id: currentModified.get('id')
												}
											}
										});
									} else {
										this.loadMask.hide();
										this.fireEvent('after-save', this.getSelectionModel());
										this.enable();
										var scope = this;
										setTimeout(function(){
											scope.getView().scroller.dom.scrollTop = scrollTop;
										}, 10); // ugly wait for DOM ready; view 'refresh' event fires way too early...
									}
								}
							}
						});
						store.reload();
					}
				},
				scope: this,
				single: true
			}
		});
		// Let the store decide whether or not to actually save:
		this.getStore().save();
	},
	
	/**
	 * @function loadStoreWithDefaults
	 * Conveniently load the store with potential filter defaults.
	 */
	loadStoreWithDefaults: function(){
		if (this.filterMenu && this.filterMenu.defaultFilter) {
			this.filterMenu.defaultFilter.handler(this.filterMenu.defaultFilter);
		} else {
			this.getStore().load();
		}
	},
	
	/**
	 * @function selectAll
	 * Selects all items on the grid -if not disabled-, or clears all selection(s).
	 */
	selectAll: function(){
		if(this.disabled){
			return false;
		}
		var sm = this.getSelectionModel();
		var store = this.getStore();
		if (sm.getCount() === store.getCount()) { // if all are already selected 
			sm.clearSelections(); // ... clear the selection
		} else {
			sm.selectAll(); // ... otherwise, selectAll
		}
	},
	
	/**
	 * @function focus
	 * focuses the panel so cursor keys are enabled
	 */
	focus: function(){
		var sm = this.getSelectionModel();
		if (!sm.hasSelection()) {
			sm.selectFirstRow();
		}
		
		// now focus the actual row in the grid's view:
		var row = 0;
		var sel = sm.getSelections();
		if (sel.length) {
			row = this.getStore().indexOf(sel[0]);
		}
		this.getView().focusRow(row);
		
	},
	
	/**
	 * @function setupEvents
	 * Now initialize listeners:
	 */
	setupEvents: function(){
		/**
		 * Listen to Keyboard events
		 */
		var pagingToolbar = this.getBottomToolbar();
		
		function checkTarget(evt){
			// We might possibly have focus in a textbox in this gridpanel; we don't want the KeyMap to interfere
			return (!evt.getTarget('input') && !evt.getTarget('textarea') && !evt.getTarget('iframe'));
		}
		
		var keyMap = new Ext.KeyMap(this.getEl(), [{
			key: 'a',
			ctrl: true,
			fn: function(e, o){
				if (checkTarget(o)) {
					this.selectAll();
					o.stopEvent();
				}
			},
			scope: this
		},{
			key: Ext.EventObject.DELETE,
			ctrl: true,
			handler: function(e,o){
				if (checkTarget(o)) {
					if (Garp.dataTypes[Garp.currentModel].disableDelete || Garp.toolbar.deleteButton.disabled) {
						return;
					}
					
					this.fireEvent('delete');
					o.stopEvent();
				}
			},
			scope: this
		},{
			key: Ext.EventObject.BACKSPACE,
			ctrl: false,
			handler: function(e,o){
				if (checkTarget(o)) {
					if (Garp.dataTypes[Garp.currentModel].disableDelete || Garp.toolbar.deleteButton.disabled) {
						return;
					}
					this.fireEvent('delete');
					o.stopEvent();
				}
			},
			scope: this
		}]);
		
		var keyNav = new Ext.KeyNav(this.getEl(), {
			'enter': this.fireEvent.createDelegate(this, ['defocus']),
			'pageUp': function(e){
				if (e.ctrlKey || e.shiftKey) {
					pagingToolbar.moveFirst();
				} else {
					if (pagingToolbar.cursor > 0) {
						pagingToolbar.movePrevious();
					}
				}
			},
			'pageDown': function(e){
				if (e.ctrlKey || e.shiftKey) {
					pagingToolbar.moveLast();
				} else {
					if (pagingToolbar.cursor + this.getStore().getCount() < this.getStore().getTotalCount()) { // may we proceed?
						pagingToolbar.moveNext();
					}
				}
			},
			scope: this
		});
		
		/**
		 * Various events:
		 */
		this.on({
			scope: this,
			'new': {
				fn: this.newItem
			},
			'save-all': {
				fn: this.saveAll,
				buffer: 200
			},
			'delete': {
				fn: this.deleteItems
			}
		});
	},
	
	/**
	 * init
	 */
	initComponent: function(){
		this.addEvents('beforesave', 'rowselect', 'beforerowselect', 'storeloaded', 'rowdblclick', 'selectionchange');
		
		var fields = Garp.dataTypes[this.model].getStoreFieldsFromColumnModel();
		
		this.writer = new Ext.data.JsonWriter({
			paramsAsHash: false,
			encode: false
		});
		
		var scope = this;
		function confirmLoad(store, options){
			// check to see if the store has any dirty records. If so, do not continue, but give the user the option to discard / save.
			if (store.getModifiedRecords().length) {
				Ext.Msg.show({
					animEl: Garp.viewport.getEl(),
					icon: Ext.MessageBox.QUESTION,
					title: __('Garp'),
					msg: __('Would you like to save your changes?'),
					buttons: Ext.Msg.YESNOCANCEL,
					fn: function(btn){
						switch (btn) {
							case 'yes':
								store.on({
									save: {
										single: true,
										fn: function(){
											store.load(options);
										}
									}
								});
								store.save();
								break;
							case 'no':
								store.rejectChanges();
								store.on({
									load: {
										single: true,
										fn: function(){
											scope.getSelectionModel().clearSelections(false);
										}
									}
								});
								store.load(options);
								break;
							//case 'cancel':
							default:
								break;
						}
					}
				});
				return false;
			}
		}
		
		this.filterMenu = new Garp.FilterMenu();
		
		this.store = new Ext.data.DirectStore({
			autoLoad: false,
			autoSave: false,
			pruneModifiedRecords: true,
			remoteSort: true,
			restful: true,
			autoDestroy: true,
			root: 'rows',
			idProperty: 'id',
			fields: fields,
			listeners: {
				'beforeload': confirmLoad,
				'load': this.fireEvent.createDelegate(this, ['storeloaded']),
				'exception': {
					scope: this,
					fn: function(){
						this.loadMask.hide();
					}
				}
			},
			totalProperty: 'total',
			sortInfo: Garp.dataTypes[this.model].sortInfo || null,
			baseParams: {
				start: 0,
				limit: Garp.pageSize
			},
			api: {
				create: Garp[this.model].create || function(){return true;}, // TODO: FIXME: expand functions
				read: Garp[this.model].fetch ||  function(){return true;},
				update: Garp[this.model].update || function(){return true;},
				destroy: Garp[this.model].destroy || function(){return true;}
			},
			writer: this.writer
		});
		
		scope = this;
		
		// Set defaults:
		Ext.applyIf(this, {
			cm: new Ext.grid.ColumnModel({
				defaults: {
					sortable: true
				},
				columns: Garp.dataTypes[this.model].columnModel,
				listeners: {
					// Defer, because renderers notified will not notice about the new state of columns on beforehand 
					'hiddenchange': function(){
						setTimeout(function(){
							scope.getView().refresh();
						}, 100);
					}
				}
			}),
			pageSize: Garp.pageSize,
			viewConfig: {
				scrollOffset: 20, // No reserved space for scrollbar. Share it with last column
				emptyText: Ext.PagingToolbar.prototype.emptyMsg,
				deferEmptyText: false,
				deferRowRender: false,
				enableRowBody: true,
				forceFit: true,
				contextRowCls: 'garp-contextrow'
			},
			store: this.store,
			border: false,
			sm: new Ext.grid.RowSelectionModel({
				singleSelect: false // true
			}),
			bbar: new Ext.PagingToolbar({
				pageSize: Garp.pageSize,
				displayInfo: true,
				store: this.store,
				plugins: [this.filterMenu]
			}),
			tbar: new Ext.ux.Searchbar({
				layout: 'hbox',
				store: this.store,
				listeners: {
					'search': {
						scope: this,
						fn: function(){
							this.getBottomToolbar().plugins[0].resetUI();
						}	
					}
				}
			})
		});
		
		this.relayEvents(this.sm, ['beforerowselect', 'rowselect', 'selectionchange', 'rowdblclick']);
		Garp.GridPanel.superclass.initComponent.call(this);
		this.on('render', function(){
			this.setupEvents();
		}, this);
		
		this.on('headerclick', function(grid, ci, e){
			
			// virtual columns might not be able to sort. Find out:
			if(grid.getColumnModel().columns[ci].virtual){
				var virtualSortField;
				// Some are fancy and able to sort:
				if (grid.getColumnModel().columns[ci].sortable) {
					virtualSortField = grid.getColumnModel().columns[ci].dataIndex;
				} else {
					// Others might point to others to sort on their behalf 
					virtualSortField = grid.getColumnModel().columns[ci].virtualSortField;
				}
				if (virtualSortField) {
					grid.getStore().on({
						load: {
							single: true,
							scope: this,
							fn: function(){
								for (var i = 0, l = grid.getColumnModel().columns.length; i < l; i++) {
									var el = Ext.get(grid.getView().getHeaderCell(i));
									el.removeClass('sort-asc');
									el.removeClass('sort-desc');
								}
								var dir = grid.getStore().sortInfo.direction.toLowerCase();
								Ext.get(grid.getView().getHeaderCell(ci)).addClass('sort-' + dir);
							}
						}
					});
					grid.getStore().sort(virtualSortField);
				} 
				return false;
			}
		});
		
	},
	
	setupContextMenus: function(){
		var scope = this;
		var refreshOption = {
			iconCls: 'icon-refresh',
			text: __('Refresh'),
			handler: function(){
				scope.getStore().reload();
			}
		};
		var newItemOption = {
			iconCls: 'icon-new',
			text: __('New'),
			handler: function(){
				scope.newItem();
			}
		};
		
		var cellContextMenu = new Ext.menu.Menu({
			items: [{
				iconCls: 'icon-open',
				text: __('Open'),
				handler: function(){
					removeContextMenuSelected.call(scope);
					scope.getSelectionModel().selectRow(scope._previousContextedRow);
				}
			}, {
				iconCls: 'icon-open-new-window',
				text: __('Open in new window'),
				handler: function(){
					scope.fireEvent('open-new-window');
				}
			}, newItemOption, {
				iconCls: 'icon-delete',
				text: __('Delete'),
				handler: function(){
					scope.deleteItems();
				}
			}, '-', refreshOption]
		});
		var viewContextMenu = new Ext.menu.Menu({
			items: [newItemOption, '-', refreshOption]
		});
		
		this.on('contextmenu', function(e){
			e.stopEvent();
			cellContextMenu.hide();
			viewContextMenu.showAt(e.getXY());
		});
		
		this._previousContextedRow = null;
		function removeContextMenuSelected(){
			if (this._previousContextedRow !== null) {
				Ext.get(this.getView().getRow(this._previousContextedRow)).removeClass(this.getView().contextRowCls);
			}
		}
		
		this.getView().el.on('click', removeContextMenuSelected.createDelegate(this));
		this.getView().el.on('contextmenu', removeContextMenuSelected.createDelegate(this));
		
		this.on('cellcontextmenu', function(grid, ri, ci, e){
			e.stopEvent();
			var gv = grid.getView();
			removeContextMenuSelected.call(this);
			Ext.get(gv.getRow(ri)).addClass(gv.contextRowCls);
			grid._previousContextedRow = ri;
			viewContextMenu.hide();
			cellContextMenu.showAt(e.getXY());
		});
	},
	
	afterRender: function(){
		this.getBottomToolbar().on('defocus', this.focus.createDelegate(this));
		Garp.GridPanel.superclass.afterRender.call(this);
		this.setupContextMenus();
	}
});
/**
 * @class Garp.FormPanel
 * @extends Ext.FormPanel
 * @author Peter
 */

Garp.FormPanel = Ext.extend(Ext.FormPanel, {

	/**
	 * @cfg defaults:
	 */
	layout: 'fit',
	hideMode: 'offsets',
	monitorValid: true,
	trackResetOnLoad: false,
	clientValidation: true,

	/**
	 * private
	 */
	state: null,

	/**
	 * Sets the UI for all dirty / undirty / phantom combinations
	 * It enables / disabled buttons and such. It also fires 'dirty' & 'undirty' events
	 * It keeps track of the previous state for performance reasons
	 */
	updateUI: function(){
		if(!this.rec || !this.formcontent.rendered || this.hidden){
			return;
		}

		var
		PHANTOM_VALID = 1,
		PHANTOM_INVALID = 2,
		EXISTING_NON_DIRTY_VALID = 4,
		EXISTING_NON_DIRTY_INVALID = 8,
		EXISTING_DIRTY_VALID = 16,
		EXISTING_DIRTY_INVALID = 32;

		var valid = this.getForm().isValid();
		var dirty = this.getForm().isDirty();

		var prevState = this.state;
		if(this.rec.phantom){
			if(valid){
				this.state = PHANTOM_VALID;
			} else {
				this.state = PHANTOM_INVALID;
			}
		} else {
			if (dirty) {
				if (valid) {
					this.state = EXISTING_DIRTY_VALID;
				} else {
					this.state = EXISTING_DIRTY_INVALID;
				}
			} else {
				if (valid) {
					this.state = EXISTING_NON_DIRTY_VALID;
				} else {
					this.state = EXISTING_NON_DIRTY_INVALID;
				}
			}
		}

		if(this.state != prevState){
			var tb = this.formcontent.getTopToolbar();

			switch(this.state){

				case PHANTOM_VALID:
					this.fireEvent('dirty');
					this.disableTabs();
					this.metaPanel.enable();
					tb.saveButton.enable();
					tb.saveAsDraftButton.enable();
					tb.cancelButton.enable();
					tb.previewButton.disable();
				break;

				case PHANTOM_INVALID:
					this.fireEvent('dirty');
					this.disableTabs();
					this.metaPanel.disable();
					tb.saveButton.disable();
					tb.saveAsDraftButton.disable();
					tb.cancelButton.enable();
					tb.previewButton.disable();
				break;

				case EXISTING_NON_DIRTY_VALID:
					this.fireEvent('undirty');
					this.enableTabs();
					this.metaPanel.enable();
					tb.saveButton.disable();
					tb.saveAsDraftButton.disable();
					tb.cancelButton.disable();
					tb.previewButton.enable();
				break;

				case EXISTING_NON_DIRTY_INVALID:
				//.. SHOULD NOT OCCUR! (possible if model file is not valid)
					//this.fireEvent('dirty');
					//this.disableTabs();
					//tb.saveButton.disable();
					//tb.cancelButton.enable();
					//tb.previewButton.enable();

					this.fireEvent('undirty');
					this.enableTabs();
					this.metaPanel.enable();
					tb.saveButton.disable();
					tb.saveAsDraftButton.disable();
					tb.cancelButton.disable();
					tb.previewButton.disable();

				break;

				case EXISTING_DIRTY_VALID:
					this.fireEvent('dirty');
					this.disableTabs();
					this.metaPanel.enable();
					tb.saveButton.enable();
					tb.saveAsDraftButton.enable();
					tb.cancelButton.enable();
					tb.previewButton.disable();
				break;

				//case EXISTING_DIRTY_INVALID:
				default:
					this.fireEvent('dirty');
					this.disableTabs();
					this.metaPanel.disable();
					tb.saveButton.disable();
					tb.saveAsDraftButton.disable();
					tb.cancelButton.enable();
					tb.previewButton.disable();
				break;
			}
		}
	},

	/**
	 * Disables the other tabpanels (relatepanels)
	 */
	disableTabs: function(){
		//console.log('disableTabs');
		this.get(0).items.each(function(i){
			if (i != this.formcontent) {
				i.disable();
			}
		}, this);
	},

	/**
	 * Enables the other tabpanels (relatepanels) (duh)
	 */
	enableTabs: function(){
		//console.log('enableTabs');
		this.get(0).items.each(function(i){
			if (i != this.formcontent) {
				i.enable();
			}
		}, this);
	},

	/**
	 * Retrieves relationTabPanel based on modelName
	 * @param {Object} modelName
	 */
	getTab: function(modelName){
		return this.get(0).items.find(function(i){
			return (i.model == modelName);
		});
	},


	/**
	 * @function newItem
	 * Makes sure the panel is shown and focuses the first field.
	 */
	newItem: function(){
		this.form.reset();
		(function(){
			this.stopMonitoring();
			this.focusFirstField();
			this.getForm().items.each(function(i){
				if (typeof i.blur == 'function') {
					i.on('blur', this.startMonitoring.createDelegate(this), this, {
						single: true
					});
					i.on('keyup', this.startMonitoring.createDelegate(this), this, {
						single: true
					});
				}
			}, this);
			this.getForm().clearInvalid();
			this.updateUI();
			this.rec = Garp.gridPanel.getSelectionModel().getSelected();
			this.formcontent.fireEvent('loaddata', this.rec, this);
		}).defer(100,this);
		this.getForm().clearInvalid();
	},

	/**
	 * @returns {String} All errors from all fields in the form
	 */
	getErrors: function(){
		var str = '';
		this.getForm().items.each(function(i){
			if(i.getActiveError()){
				str += i.getActiveError() + ': ' + i.fieldLabel + '<br>';
			}
		});
		return str;
	},

	/**
	 * @function updateTitle
	 */
	updateTitle: function(){
		if (Garp.dataTypes[Garp.currentModel].displayFieldRenderer) {
			var panel = this.items.itemAt(0).items.itemAt(0);
			if (panel.xtype !== 'relationpanel') {
				panel.setTitle(Garp.dataTypes[Garp.currentModel].displayFieldRenderer(this.rec));
			}
		}
	},

	/**
	 * @function loadData
	 * loads Data in the form and makes sure the panel is visible
	 *
	 * @param {Object} sm selectionModel
	 */
	loadData: function(sm){
		var form = this.getForm();
		this.stopMonitoring();
		if(form.isDirty() || sm.getCount() != 1){
			return;
		}
		this.rec = sm.getSelected();
		if (!this.rec) {
			return;
		}

		this.state = null;
		form.loadRecord(this.rec);

		if (!this.ownerCt) {
			return;
		}
		this.updateTitle();

		this.fireEvent('defocus');

		function relayEvent(){
			if(this.formcontent.rendered){
				this.formcontent.fireEvent('loaddata', this.rec, this);
			}
			if(this.metaPanel.rendered){
				this.metaPanel.fireEvent('loaddata', this.rec, this);
			}
			this.state = null;
			this.startMonitoring();
			this.getForm().clearInvalid();
		}

		relayEvent.call(this);
		this.formcontent.on('activate', relayEvent, this, {
			single: true
		});
		this.metaPanel.on('activate', relayEvent, this, {
			single: true
		});
			var draftable = Garp.dataTypes[Garp.currentModel].getColumn('online_status') && Garp.dataTypes[Garp.currentModel].getColumn('published') ? true : false;
			this.formcontent.getTopToolbar().saveAsDraftButton.setVisible(draftable);

		form.unDirty();
	},

	/**
	 * @function focusFirstField
	 * Focuses the first editable & visible field
	 */
	focusFirstField: function(){
		var fp = this;
		this.getForm().items.each(function(item){

			// See Garp changelist 3.4 'compositefield' not supported anymore

			/*if(item.xtype == 'compositefield'){
				item.items.each(function(item){
					if (!item.hidden && !item.disabled && item.focus && Ext.isFunction(item.focus)) {
						item.focus(100);
						return false;
					} else {
						return true;
					}
				});
			}*/

			if (!item.hidden && !item.disabled && item.focus && Ext.isFunction(item.focus)) {
				item.focus(100);
				return false;
			} else {
				return true;
			}
		});
	},

	/**
	 * @function afterRender
	 * Sets up keyboard handlin & events for the tabs
	 */
	afterRender: function(){
		var keyMap = new Ext.KeyMap(this.getEl(), [{
			key: Ext.EventObject.ESC,
			scope: this,
			handler: function(){
				this.fireEvent('defocus');
			}
		}]);
		keyMap.stopEvent = true;
		this.get(0).items.each(function(i){
			if (i != this.formcontent) {
				this.relayEvents(i, ['dirty', 'undirty']);
			}
		}, this);
		Garp.FormPanel.superclass.afterRender.call(this);
	},

	/*
	setLocked: function(lock){
		this.locked = lock;
		this.fireEvent(lock ? 'lock' : 'unlock', this);
		if(lock){
			this.getEl().addClass('locked');
		} else {
			this.getEl().removeClass('locked');
		}
	},

	lock: function(){
		this.setLocked(true);
	},

	unlock: function(){
		this.setLocked(false);
	},

	isLocked: function(){
		return this.locked;
	},
	*/

	/**
	 * init
	 */
	initComponent: function(){

		this.id = Ext.id();
		this.addEvents('save-all','cancel','preview','open-new-window','lock','unlock','dirty','undirty','delete');

		this.on({
			scope: this,
			'new': {
				buffer: 30,
				fn: this.newItem
			},
			'save-all': {
				fn: function(){
					var tb = this.formcontent.getTopToolbar();
					tb.saveButton.disable();
					tb.saveAsDraftButton.disable();
					tb.cancelButton.disable();
				}
			},
			'after-save': {
				fn: function(sm){
					this.state = null;
					this.form.unDirty();
					this.form.reset();
					this.loadData(sm);
					this.updateUI();
				}
			},
			'rowselect': {
				buffer: 100,
				fn: this.loadData
			},
			'clientvalidation': {
				fn: function(fp, valid){
					this.updateUI(valid);
				}
			}
		});

		var items = [];
		Ext.each(Garp.dataTypes[Garp.currentModel].formConfig, function(o){
			items.push(Ext.apply({}, o));
		});

		Ext.apply(items[0],{
			ref: '../formcontent',
			title: '&nbsp;', // misformed tab otherwise
			layout: 'border'
		});
		// fieldset properties override:
		Ext.apply(items[0].items[0], {
			region: 'center',
			autoScroll: true,
			margins: '0 0 0 10'
		});

		items[0].tbar = {
			cls: 'garp-formpanel-toolbar',
			items: [{
				text: __('Save'),
				iconCls: 'icon-save',
				ref: 'saveButton',
				disabled: true,
				handler: function(){
					this.dirtyState = null;
					this.fireEvent('save-all');
				},
				scope: this
			},{
				text: __('Save as draft'),
				hidden: !this.draftable,
				iconCls: 'icon-save-draft',
				ref: 'saveAsDraftButton',
				disabled: true,
				handler: function(){
					this.dirtyState = null;
					this.rec.set('online_status',0);
					this.fireEvent('save-all');
				},
				scope: this
			},{
				text: __('Cancel'),
				iconCls: 'icon-cancel',
				ref: 'cancelButton',
				disabled: true,
				handler: function(){
					function revertPhantom(){
						this.getForm().reset();
						this.updateUI();
						this.rec = null;
						this.fireEvent('delete');
					}
					if(this.getForm().isDirty()){
						Ext.Msg.confirm(__('Garp'), __('Are you sure you want to revert your changes?'), function(btn){
							if(btn == 'yes'){
								if (this.rec.phantom) {
									revertPhantom.call(this);
								} else {
									this.getForm().reset();
									this.updateUI();
									this.fireEvent('cancel', this);
								}
							}
						}, this);
						return;
					}
					if(!this.rec || this.rec.phantom){
						revertPhantom.call(this);
						return;
					}
				},
				scope: this
			},' ',{
				text: __('Open in new window'),
				iconCls: 'icon-open-new-window',
				handler: function(){
					this.fireEvent('open-new-window');
				},
				scope: this
			}, ' ', {
				text: __('Preview'),
				iconCls: 'icon-preview',
				ref: 'previewButton',
				disabled: true,
				hidden: Garp.currentModel && !Garp.dataTypes[Garp.currentModel].previewLink,
				scope: this,
				handler: function(){
					this.fireEvent('preview');
				},
				listeners: {
					'disable': function(){
						this.setTooltip(__('To preview, save this item first'));
					},
					'enable': function(){
						this.setTooltip(__('Preview this item'));
					}
				}
			}]
		};

		var cm = Garp.dataTypes[Garp.currentModel];
		var metaPanelCfg = Ext.apply({
			hidden: window.innerWidth <= Garp.SMALLSCREENWIDTH
		}, cm.metaPanelConfig ? cm.metaPanelConfig : {});
		items[0].items.push(this.metaPanel = new Garp.MetaPanel(metaPanelCfg));

		// Image selection for when in a CKEditor image browser popup
		function addChooseImageButton() {
			items[0].tbar.items.unshift({
				text: __('Use Image'),
				iconCls: 'icon-camera',
				ref: 'chooseButton',
				disabled: false,
				handler: function(){
					// Communicate the choice to CKEditor and close
					window.opener.CKEDITOR.tools.callFunction( 1, "test.jpg" );
					window.close();
				},
				scope: this
			});
		}
		if (Garp.currentModel === "Image" && typeof IS_CKEDITOR_IMAGE_BROWSER !== 'undefined' && IS_CKEDITOR_IMAGE_BROWSER) {
			addChooseImageButton();
		}

		this.items = {
			xtype:'tabpanel',
			deferredRender: false,
			activeTab: 0,
			resizeTabs: true,
			minTabWidth: 100,
			tabWidth: 150,
			tabMargin: 15,
			enableTabScroll: true,
			border: false,
			defaults: {
				border: false,
				deferredRender: false,
				bodyCssClass: 'garp-formpanel' // visual styling
			},
			items: items
		};

		this.relayEvents(this.metaPanel, ['save-all', 'dirty', 'undirty']);

		Garp.FormPanel.superclass.initComponent.call(this, arguments);
		this.stopMonitoring();
	}

});

Ext.reg('garpformpanel', Garp.FormPanel);

/**
 * @class Garp.Toolbar
 * @extends Ext.Toolbar
 * @author: Peter
 * 
 * @description Garp.Toolbar, main Garp toolbar, included in Garp.viewport
 */
Garp.Toolbar = Ext.extend(Ext.Toolbar, {

	/**
	 * @function addColumnMenu
	 *
	 * add ColumnMenu to the extraMenu
	 * @param {Object} columnMenu
	 */
	addColumnMenu: function(grid){
	},
	
	/**
	 * @function removeColumnMenu
	 *
	 * removes ColumnMenu from the extraMenu
	 */
	removeColumnMenu: function(){
	},
	
	
	initComponent: function(){
		Ext.apply(this, {
			style: 'padding:0px 10px 0px 10px;border:0;',
			cls: 'garp-main-toolbar cms-branding-small',
			
			items: [Garp.modelMenu, '-', {
				xtype: 'tbspacer'
			}, {
				text: __('New'),
				iconCls: 'icon-new',
				ref: 'newButton', // makes it Garp.toolbar.newButton
				handler: function(){
					this.fireEvent('new');
				},
				scope: this
			}, {
				text: __('Delete'),
				iconCls: 'icon-delete',
				ref: 'deleteButton',
				handler: function(){
					this.fireEvent('delete');
				},
				scope: this
			}, ' ', {
				xtype: 'tbseparator',
				ref: 'separator'
			}, {
				text: __('more'),
				iconCls: 'icon-extra',
				ref: 'extraMenu',
				menu: new Ext.menu.Menu({
					items: [{
						text: __('Import') + "&hellip;",
						iconCls: 'icon-import',
						ref: 'importButton',
						hidden: true,
						handler: function(){
							if (!Garp.currentModel) {
								return;
							}
							var win = new Garp.ImportWindow();
							win.show();
						}
					}, {
						text: __('Export') + "&hellip;",
						iconCls: 'icon-export',
						ref: 'exportButton',
						hidden: true,
						handler: function(){
							if (!Garp.currentModel) {
								return;
							}
							var win = new Garp.ExportWindow();
							win.show();
						}
					}, {
						text: __('Print'),
						iconCls: 'icon-print',
						ref: 'printButton',
						hidden: true,
						handler: function(){
							if (!Garp.currentModel) {
								return;
							}
							
							if (Garp.gridPanel.getSelectionModel().getCount() == 1) {
							
								Ext.select('body').addClass('print-form');
								Garp.gridPanel.ownerCt.collapse();
								Garp.viewport.doLayout();
								setTimeout(function(){
									window.print();
									
									Garp.gridPanel.ownerCt.expand();
									Ext.select('body').removeClass('print-form');
								}, 500);
								
								
							} else {
								Ext.select('body').addClass('print-grid');
								
								var pw = Garp.gridPanel.ownerCt.getWidth();
								Garp.gridPanel.getSelectionModel().clearSelections();
								if (Garp.formPanel.ownerCt.collapse) {
									Garp.formPanel.ownerCt.collapse();
								}
								Garp.gridPanel.ownerCt.collapse();
								Garp.gridPanel.ownerCt.setWidth(640);
								Garp.gridPanel.ownerCt.expand();
								
								var el = Ext.select('.x-grid3-scroller').first();
								var w = el.getStyle('width');
								var h = el.getStyle('height');
								
								el.setStyle({
									'overflow': 'visible',
									'position': 'fixed',
									'height': 'auto'
								});
								
								setTimeout(function(){
									window.print();
									
									el.first().setStyle({
										'overflow': 'auto',
										'overflow-x': 'hidden',
										'position': 'relative',
										'width': w,
										'height': h
									});
									
									Garp.gridPanel.ownerCt.setWidth(pw);
									if (Garp.formPanel.ownerCt.expand) {
										Garp.formPanel.ownerCt.expand();
									}
									Garp.gridPanel.ownerCt.expand();
									Garp.viewport.doLayout();
									
									Ext.select('body').removeClass('print-grid');
									
								}, 500);
							}
							
						}
					}, '-', {
						hidden: !((document.fullScreenElement && document.fullScreenElement !== null) ||   
      								(!document.mozFullScreen && !document.webkitIsFullScreen)),
						text: __('Full Screen'),
						iconCls: 'icon-fullscreen',
						handler: function(){
							var d = document, de = d.documentElement;
							if (d.mozFullScreen || d.webkitIsFullScreen) {
								if (d.mozCancelFullScreen) {
									d.mozCancelFullScreen();
								} else if (d.webkitCancelFullScreen){
									d.webkitCancelFullScreen();
								}
							} else {
								if (de.mozRequestFullScreen) {
									de.mozRequestFullScreen();
								} else if (de.webkitRequestFullScreen){
									de.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);  
								}
							}
						}
					},'-', {
						text: __('Log out'),
						iconCls: 'icon-logout',
						ref: 'logoutButton',
						handler: function(){
							this.fireEvent('logout');
						},
						scope: this
					}]
				})
			}]
		});
		
		Garp.Toolbar.superclass.initComponent.call(this);
	}
});
/**
 * Garp infoPanel. Simplistic panel with info about the currently selected model. setInfo gets called from garp.js->changeModel
 */

Garp.InfoPanel = Ext.extend(Ext.Panel, {
	/**
	 * setInfo. Updates this panel's HTML
	 * @param {Object} model
	 */
	setInfo: function(model){
		this.remove(this.innerpanel);
		this.add([{
			xtype: 'container',
			ref: 'innerpanel',
			cls: 'infopanel cms-branding',
			border: false,
			defaults: {
				border: false
			},
			items: [{
				html: 	'<div class="x-panel-header x-panel-header-noborder x-unselectable" style="-moz-user-select: none;">'+
						'<img class="x-panel-inline-icon ' + model.iconCls + '" src="data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" alt="">' +
						'<span class="x-panel-header-text">' + __(model.text) + '</span></div>' +
						(model.description ? '<div class="description">' +  __(model.description) + '</div>' : '')
			}, {
				xtype:'box',
				ref: '../count',
				cls: 'total',
				tpl: model.countTpl
			}]
		}]);
	},
	
	updateCount: function(count){
		this.count.update({
			count: count
		});
	},
	
	clearInfo: function(){
		this.update('');
	},
	
	html: '',
	bodyStyle: 'padding: 30px; padding-bottom: 15px;',
	layout:'fit',
	
	listeners:{
		'show': function(){
			if (Garp.history && Garp.currentModel) {
				Garp.history.pushState({
					model: Garp.currentModel
				});
			}
		}
	}
	
});
/**
 * garp.viewport.js
 *
 */

Garp.Viewport = function(cfg){

	Garp.Viewport.superclass.constructor.call(this, Ext.applyIf(cfg || {}, {
		layout: 'border',
		stateful: false,
		defaults: {
			split: true,
			animCollapse: false,
			border: false,
			frame: false
		},
		//stateId:'viewport',
		items: [{
			region: 'north',
			border: false,
			height: 40,
			bodyCssClass: 'garp-bg',
			cls: 'toolbarCt',
			items: Garp.toolbar = new Garp.Toolbar()
		}, {
			ref: 'gridPanelCt',
			region: 'west',
			cls: 'gridPanelCt',
			layout: 'fit',
			xtype: 'panel',
			width: 360,
			minWidth: 360,
			height: 200,
			minHeight: 200,
			collapseMode: 'mini',
			collapsible: true,
			header: false,
			stateful: true,
			stateId: 'gridPanelCt',
			margins: '0 0 4 4',
			items: [Garp.gridPanel]
		}, {
			ref: 'formPanelCt',
			region: 'center',
			cls: 'formPanelCt',
			layout: 'card',
			xtype: 'container',
			layoutConfig: {
				layoutOnCardChange: true
			},
			activeItem: 0,
			border: false,
			defaults: {
				border: false
			},
			margins: '0 4 4 0',
			items: [Garp.infoPanel = new Garp.InfoPanel({
				itemId: 0,
				ref: '../infoPanel'
			})]
		}]
	}));
};

Ext.extend(Garp.Viewport, Ext.Viewport, {});

Ext.ns('Garp');

Garp.ExportWindow = Ext.extend(Ext.Window, {
	width: 580,
	height: 360,
	modal: true,
	layout: 'card',
	activeItem: 0,
	preventBodyReset: true,
	title: __('Export'),
	iconCls: 'icon-export',
	border: false,
	defaults: {
		border: true,
		cls: 'garp-formpanel' // new style doesn't need frame, old style doesn't need this class
		//frame: true
	},

	proceedExport: function(){
		var selection;
		var sel = this.get('page-0').getForm().getValues();
		var ids = [];

		if (typeof Garp.gridPanel.getSelectionModel().getSelected() != 'undefined') {
			Ext.each(Garp.gridPanel.getSelectionModel().getSelections(), function(item){
				ids.push(item.id);
			});
		}

		var exportType = this.get('page-2').getForm().getFieldValues().exporttype;
		var filter = Ext.util.JSON.encode(Garp.gridPanel.store.baseParams.query);
		var sortInfo = Garp.gridPanel.getStore().sortInfo;
		var pageSize = Garp.gridPanel.getBottomToolbar().pageSize;
		var cursor   = Garp.gridPanel.getBottomToolbar().cursor;
		var form1 = this.get('page-1').getForm();
		var form0 = this.get('page-0').getForm();
		var fieldConfig = form1.getValues();
		var fields = [];

		if (!fieldConfig.__all) {
			for (var f in fieldConfig) {
				fields.push(f);
			}
		} else {
			var all = this.getCheckboxesFromModel();
			for (var i in all) {
				if (typeof all[i] != 'function') {
					fields.push(all[i].name);
				}
			}
		}

		var parameters = {};
		switch (sel.selection) {
			case 'currentItem':
				parameters = {
					selection: 'id',
					exportType: exportType,
					sortDir: sortInfo.direction,
					sortField: sortInfo.field
				};
				break;
			case 'currentPage':
				parameters = {
					selection: 'page',
					page: (Math.ceil((cursor + pageSize) / pageSize)),
					exportType: exportType,
					pageSize: pageSize,
					sortDir: sortInfo.direction,
					sortField: sortInfo.field,
					filter: filter
				};
				break;
			case 'specific':
				parameters = {
					selection: 'page',
					from: sel.from,
					to: sel.to,
					exportType: exportType,
					pageSize: pageSize,
					sortDir: sortInfo.direction,
					sortField: sortInfo.field,
					filter: filter
				};
				break;
			case 'relation':
				parameters = {
					selection: 'all',
					filter: '{"' +  Garp.currentModel + '.id":' + ids[0] + '}',
					rule: Garp.formPanel.items.get(0).getLayout().activeItem.rule,
					rule2: Garp.formPanel.items.get(0).getLayout().activeItem.rule2,
					exportType: exportType
				};
				break;
			default: //case 'all':
				parameters = {
					selection: 'all',
					exportType: exportType,
					pageSize: pageSize,
					sortDir: sortInfo.direction,
					sortField: sortInfo.field,
					filter: filter
				};
				break;
		}

		var url;
		if (sel.selection == 'relation') {
			url = Ext.urlEncode(parameters, BASE + 'g/content/export/model/' + form0.findField('model').getValue() + '?exporttype=' + exportType);
		} else {
			url = Ext.urlEncode(parameters, BASE + 'g/content/export/model/' + Garp.currentModel + '?exporttype=' + exportType);
		}

		if(sel.selection == 'currentItem'){
			url += '&id=[' + ids.join(',') + ']';
		}
		if (sel.selection == 'currentItem' || sel.selection == 'currentPage' || sel.selection == 'specific' || sel.selection == 'all') {
			url += '&filter=' + encodeURIComponent(filter);
			url += '&fields=' + encodeURIComponent(fields);
		}

		this.close();
		window.location = url;

	},

	navHandler: function(dir){
		var page = this.getLayout().activeItem.id;
		page = parseInt(page.substr(5, page.length), 10);
		this._prevPage = page;
		page += dir;
		var selectionForm = this.get('page-0').getForm();
		if (page <= 0) {
			page = 0;
			this.prevBtn.disable();
			this.nextBtn.setText(__('Next'));
			selectionForm.findField('selection').handler.call(this);
		} else if (page == 2) {
			this.prevBtn.enable();
			this.nextBtn.setText(__('Ok'));
		} else if (page == 3){
			this.proceedExport();
		} else{
			this.prevBtn.enable();
			this.nextBtn.setText(__('Next'));
		}
		this.getLayout().setActiveItem('page-' + page);
	},

	getCheckboxesFromModel: function(){
		var checkboxes = [], cm = Garp.gridPanel.getColumnModel().columns;
		Ext.each(cm, function(field){
			if(field.virtual){
				return;
			}
			checkboxes.push({
				boxLabel: Ext.util.Format.stripTags(__(field.header)), // some headers have <span class="hidden"> around them. Remove that!
				name: field.dataIndex,
				checked: !field.hidden
			});
		});
		return checkboxes;
	},

	initComponent: function(){

		var selectionDefaults = {
			scope: this,
			allowBlank: true,
			handler: function(cb, checked){
				var form = this.get('page-0').getForm();
				var disableSpecific = true;
				var disableModel = true;
				if (form.getValues().selection == 'specific') {
					disableSpecific = false;
				}
				if (form.getValues().selection == 'relation') {
					disableModel = false;
				}
				form.findField('model').setDisabled(disableModel);
				form.findField('from').setDisabled(disableSpecific);
				form.findField('to').setDisabled(disableSpecific);
			}
		};
		this.items = [{
			id: 'page-0',
			xtype: 'form',
			items: [{
				xtype: 'fieldset',
				labelWidth: 200,
				title: __('Specify selection to export (1/3)'),
				defaults: selectionDefaults,
				items: [{
					fieldLabel: __('Currently selected item(s)'),
					xtype: 'radio',
					name: 'selection',
					checked: Garp.gridPanel.getSelectionModel().getCount() > 1,
					disabled: !Garp.gridPanel.getSelectionModel().getSelected(),
					inputValue: 'currentItem'
				}, {
					fieldLabel: __('Current page'),
					xtype: 'radio',
					name: 'selection',
					checked: Garp.gridPanel.getSelectionModel().getCount() === 0,
					inputValue: 'currentPage'
				}, /*{
					fieldLabel: __('All pages'),

					hidden: true,
					hideFieldLabel: true,

					xtype: 'radio',
					name: 'selection',
					inputValue: 'all'
				},*/ {
					xtype: 'compositefield',
					fieldLabel: __('Specific pages'),
					defaults: selectionDefaults,
					items: [{
						xtype: 'radio',
						name: 'selection',
						checked: Garp.gridPanel.getSelectionModel().getCount() === 1 && !Garp.formPanel.items.get(0).getLayout().activeItem.model,
						inputValue: 'specific',
						width: 30
					}, {
						xtype: 'displayfield',
						value: __('Page')
					}, {
						xtype: 'numberfield',
						name: 'from',
						value: 1,
						flex: 1
					}, {
						xtype: 'displayfield',
						value: __('to')
					}, {
						xtype: 'numberfield',
						name: 'to',
						value: Math.ceil(Garp.gridPanel.getStore().getTotalCount() / Garp.gridPanel.getBottomToolbar().pageSize), // == total pages ;)
						flex: 1
					}]
				},{
					xtype:'compositefield',
					fieldLabel: __('Related to current item'),
					disabled: Garp.gridPanel.getSelectionModel().getCount() !== 1,
					hidden: !Garp.dataTypes[Garp.currentModel].getRelations().length,
					defaults: selectionDefaults,
					items: [{
						xtype: 'radio',
						name: 'selection',
						inputValue: 'relation',
						checked: Garp.formPanel.items.get(0).getLayout().activeItem.model ? true : false,
						width: 30
					},{
						xtype:'displayfield',
						value: __('Kind')
					},{
						flex: 1,
						xtype: 'combo',
						editable: false,
						name: 'model',
						value: Garp.formPanel.items.get(0).getLayout().activeItem.model || Garp.dataTypes[Garp.currentModel].getRelations()[0] || null,
						store: (function(){
							var out = [];
							Ext.each(Garp.dataTypes[Garp.currentModel].getRelations(), function(model){
								if (Garp.dataTypes[model]) {
									out.push([model, Garp.dataTypes[model].text]);
								}
							});
							return out;
						})()
					}]
				}]
			}]
		}, {
			id: 'page-1',
			xtype: 'form',
			autoScroll: true,
			listeners:{
				// skip this page, if at previous one 'relation' was chosen:
				'show': function(){
					var ct = this.ownerCt;
					if(ct._prevPage === 0 && ct.get('page-0').getForm().getValues().selection == 'relation'){
						ct.nextBtn.handler.call(ct);
					}
				}
			},
			items: [{
				xtype: 'fieldset',
				labelWidth: 80,
				title: __('Select fields (2/3)'),
				items: [{
					ref: '../all',
					xtype:'checkbox',
					name: '__all',
					fieldLabel: __('All fields'),
					checked: true,
					handler: function(cb,checked){
						if(checked){
							this.refOwner.specific.disable();
						} else {
							this.refOwner.specific.enable();
						}
					}
				},{
					'xtype': 'box',
					'cls': 'separator'
				},{
					disabled: true,
					xtype: 'checkboxgroup',
					ref: '../specific',
					columns: 3,
					hideLabel: true,
					defaults: {
						xtype: 'checkbox'
					},
					items: this.getCheckboxesFromModel()
				}]
			}]
		}, {
			id: 'page-2',
			xtype: 'form',
			items: [{
				xtype: 'fieldset',
				title: __('Export type (3/3)'),
				items:[{
					xtype: 'combo',
					name: 'exporttype',
					fieldLabel: __('Format'),
					allowBlank: false,
					editable: false,
					triggerAction: 'all',
					typeAhead: false,
					mode: 'local',
					value: 'txt',
					store: [['txt','Text'],['csv','CSV'],['excel','Excel']]
				}]
			}]
		}];

		this.buttonAlign = 'left';
		this.buttons = [{
			text: __('Previous'),
			ref: '../prevBtn',
			handler: this.navHandler.createDelegate(this, [-1])
		}, '->',{
			text: __('Cancel'),
			handler: this.close.createDelegate(this)
		},{
			text: __('Next'),
			ref: '../nextBtn',
			handler: this.navHandler.createDelegate(this, [1])
		}];

		Garp.ExportWindow.superclass.initComponent.call(this);
		this.on('show', this.navHandler.createDelegate(this, [-1]));
	}
});

Ext.ns('Garp');

Garp.ImportWindow = Ext.extend(Ext.Window, {
	width: 810,
	height: 360,
	modal: true,
	layout: 'card',
	activeItem: 0,
	preventBodyReset: false,
	title: __('Import'),
	iconCls: 'icon-import',
	maximizable: true,
	border: false,	
	defaults: {
		border: true,
		frame: false,
		style: 'background-color: #fff;',
		bodyStyle: 'background-color: #fff;padding-top: 10px; '
	},
	
	navHandler: function(dir){
		var page = this.getLayout().activeItem.id;
		page = parseInt(page.substr(5, page.length), 10);
		page += dir;
		
		var form = this.get('page-1').getForm();
		if (page <= 0) {
			page = 0;
			this.prevBtn.disable();
			this.nextBtn.setText(__('Next'));
			this.nextBtn.setDisabled(!form.findField('datafile').getValue());
			//form.findField('datafile').resumeEvents();
		} else if (page == 1) {// not realy a UI page..
			this.progress.reset(); 
			this.progress.wait({
				text: __('Processing')
			});
			Ext.select('.x-progress-bar').setHeight(18);
			this.prevBtn.disable();
			this.nextBtn.disable(); 
			form.submit();
			//form.findField('datafile').suspendEvents();
		} else if (page == 2){
			this.nextBtn.setText(__('Ok'));
			this.prevBtn.enable();
			this.nextBtn.enable();
		} else if (page == 3){
			this.proceedImport();
		} else{
			this.prevBtn.enable();
			this.nextBtn.setText(__('Next'));
		}
		this.getLayout().setActiveItem('page-' + page);
	},
	
	showMappingUI: function(data){
		var items = [];
		var options = [];
		Ext.each(Garp.dataTypes[Garp.currentModel].columnModel, function(c){
			options.push([c.dataIndex, c.header]);
		});
		options.push(['',__('  (Ignore)')]);
		
		var columnCount = data[0].length;
		var selectListener = function(field, value){
			var elms = Ext.select('.'+field.name, null, this.el.body);
			if(!value){
				elms.addClass('garp-import-hidden-col');
			} else {
				elms.removeClass('garp-import-hidden-col');
			}
		};
		
		for(var i=0; i < columnCount; i++){
			var col = [];
			col.push({
				name: 'col-' + i,
				xtype: 'combo',
				allowBlank: false,
				editable: false,
				triggerAction: 'all',
				typeAhead: false,
				mode: 'local',
				store: options,
				submitValue: false,
				value: i < columnCount ? options[i][0] : columnCount,
				width: 140,
				listeners: {
					'select': selectListener,
					scope: this
				}
			});
			for(var rows = 0; rows< data.length; rows++){
				col.push({
					xtype: 'box',
					html: (data[rows][i] || '' ) + '', // convert null to ''
					cls: 'row-' + rows + ' col-' + i,
					style: 'background-color: #fff; margin: 5px 10px 5px 2px;'
				});
				
			}
			items.push({
				items:col
			});
		}
		
		var width = (150 * columnCount);
		
		this.mappingColumns = new Ext.Panel({
			layout: 'column',
			columns: options.length,
			width: width + 10,
			items: items,
			defaults: {
				width: 150
			}
		});
		
		this.get('page-2').add({
			xtype: 'panel',
			style: 'margin: 10px;',
			frame: true,
			bodyStyle: 'padding:10px;',
			autoScroll: true,
			items: this.mappingColumns
		});
		
		this.get('page-2').add({
			xtype: 'fieldset',
			//style: 'background-color: #fff;',
			items: [{
				xtype: 'checkbox',
				fieldLabel: __('Ignore first row'),
				name: 'ignore-first-row',
				checked: false,
				submitValue: false,
				handler: function(cb, checked){
					var elms = Ext.select('.row-0', null, this.el.body);
					if(checked){
						elms.addClass('garp-import-hidden-row');
					} else {
						elms.removeClass('garp-import-hidden-row');
					}
				},
				scope: this
			},{
				xtype: 'checkbox',
				fieldLabel: __('Continue on error(s)'),
				name: 'ignoreErrors'
			}]
		});
		
		this.getLayout().setActiveItem('page-2');
		this.get('page-2').doLayout();
		this.navHandler(0);
		this.get('page-2').getForm().findField('ignore-first-row').setValue(true);
	},
	
	proceedImport: function(){
		var mapping = [];
		var combos = this.get('page-2').findByType('combo');
		Ext.each(combos, function(c){
			mapping.push(c.getValue());
		});
		var form = this.get('page-2').getForm();
		Ext.apply(form.baseParams,{
			datafile: this.get('page-1').getForm().findField('datafile').getValue(),
			mapping: Ext.encode(mapping),
			firstRow: this.get('page-2').getForm().findField('ignore-first-row').checked ? '1' : '0'
		});
		this.lm = new Ext.LoadMask(this.getEl());
		this.lm.show();
		form.submit();
	},
	
	initComponent: function(){
		this.progress = new Ext.ProgressBar({
			animate: true
		});
		this.items = [{
			id: 'page-0',
			xtype: 'form',
			timeout: 0,
			items: [{
				xtype: 'fieldset',
				labelWidth: 150,
				title: __('Specify file to import'),
				style: 'padding-top: 50px; ',
				items: [{
					xtype: 'uploadfield',
					uploadURL: BASE+'g/content/upload/type/document',
					supportedExtensions: ['xls', 'xlsx', 'xml'],
					allowBlank: false,
					name: 'filename',
					fieldLabel: __('Filename'),
					listeners: {
						'change' : function(f,v){
							this.get('page-1').getForm().findField('datafile').setValue(v);
							this.navHandler(1);
						},
						scope: this
					}
				},{
					xtype: 'displayfield',
					value: __('Excel filetypes are supported')
				}]
			}]
		},{
			id: 'page-1',
			timeout: 0,
			xtype: 'form',
			url: BASE + 'g/content/import/',
			baseParams:{
				'model': Garp.currentModel
			},
			listeners: {
				'actioncomplete': function(form, action){
					if (action.result && action.result.success) {
						this.showMappingUI(action.result.data);
					} 
				},
				'actionfailed': function(form, action){
						var msg = __('Something went wrong. Please try again.');
						if(action.result && action.result.message){
							msg += '<br>' + action.result.message;
						}
						Ext.Msg.alert(__('Error'), msg);
						this.close();
					
				},
				scope: this
			},
			items: [{
				xtype: 'fieldset',
				labelWidth: 150,
				title: __('Please wait'),
				style: 'padding-top: 50px; ',
				items: [this.progress, {
					xtype: 'textfield',
					hidden: true,
					fieldLabel: __('Filename'),
					ref: 'datafile',
					name: 'datafile'
				}]
			}]
		},{
			id: 'page-2',
			xtype: 'form',
			timeout: 1200,
			url: BASE + 'g/content/import/',
			baseParams:{
				'model': Garp.currentModel
			},
			listeners: {
				'actioncomplete': function(form, action){
					this.lm.hide();
					if (action.result && action.result.success) {
						this.close();
						Garp.gridPanel.getStore().reload();
					}
				},
				'actionfailed': function(form, action){
						this.lm.hide();
						var msg = __('Something went wrong. Please try again.');
						if(action.result.message){
							msg += '<br>' + action.result.message;
						}
						Ext.Msg.alert(__('Error'), msg);
				},
				scope: this
			},
			items: [{
				xtype: 'fieldset',
				labelWidth: 0,
				title: __('Fields'),
				items: []
			}]
		}];
		
		this.buttonAlign = 'left';
		this.buttons = [{
			text: __('Previous'),
			disabled: true,
			ref: '../prevBtn',
			handler: this.navHandler.createDelegate(this, [-2]) // !
		}, '->', {
			text: __('Cancel'),
			handler: this.close.createDelegate(this)
		}, {
			text: __('Next'),
			ref: '../nextBtn',
			disabled: true,
			handler: this.navHandler.createDelegate(this, [1])
		}];
		
		//this.on('show', this.navHandler.createDelegate(this, [-1]));
		Garp.ImportWindow.superclass.initComponent.call(this);
	}
});

Ext.ns('Garp');

/**
 * It supposes to find a password field named according to @cfg passwordFieldname in it's refOwner's scope.
 */

Garp.PasswordFieldset = Ext.extend(Ext.form.FieldSet, {
	
	callback: Ext.emptyFn,

	style:'margin:0;padding:0;',
	defaultType: 'textfield',
	defaults:{
		allowBlank: true
	},	
	
	collapseAndHide: function(){
		this.showpassword.hide();
		this.password.hide();
		this.plaintext.hide();
		this.password.setValue('');
		this.password.originalValue = '';
		this.plaintext.setValue('');
		this.plaintext.originalValue = '';
	},
	
	initComponent: function(ct){
	
		this.items = [{
			ref: 'setPasswordBtn',
			fieldLabel : ' &nbsp; ',
			xtype: 'button',
			text: __('Set password'),
			boxMaxWidth: 64,
			handler: function(){
				var r = this.refOwner;
				if (r.showpassword.isVisible()) {
					r.collapseAndHide();
				} else {
					r.showpassword.show();
					r.password.show();
					r.plaintext.hide();
					r.password.focus(20);
				}
			}
		}, {
			ref: 'password',
			fieldLabel : __('Password'),
			inputType: 'password',
			hidden: true,
			listeners: {
				'change': this.callback
			}
		}, {
			ref: 'plaintext',
			fieldLabel : __('Password'),
			inputType: 'text',
			hidden: true,
			listeners: {
				'change': this.callback
			}
		}, {
			ref: 'showpassword',
			fieldLabel: __('Show Password'),
			xtype: 'checkbox',
			allowBlank: true,
			hidden: true,
			handler: function(){
				var r = this.refOwner, c = this.checked;
				r.password.setVisible(!c);
				r.plaintext.setVisible(c);
				r[c ? 'plaintext' : 'password'].setValue(r[c ? 'password' : 'plaintext'].getValue());
			}
		}];
		
		var scope = this;
		this._interval = setInterval(function(){
			if (scope.password) {
				if (scope.password.isVisible() || scope.plaintext.isVisible()) {
					if (scope.password.isVisible() && scope.password.isDirty()) {
						scope.callback(scope.password, scope.password.getValue());
						scope.password.originalValue = scope.password.getValue();
					} else if (scope.plaintext.isDirty()) {
						scope.callback(scope.plaintext, scope.plaintext.getValue());
						scope.plaintext.originalValue = scope.plaintext.getValue();
					}
				}
			} else {
				clearInterval(this._interval);
			}
		}, 100);
		
		Garp.PasswordFieldset.superclass.initComponent.call(this, ct);
		
		
	}
	
	
	
	
	/**
	 * Private
	 */
	
	/*listeners: {
		click: function(){
			
			var id = this.refOwner.getForm().findField('id').getValue();
			var scope = this;
			var win;
			
			function btnHandler(ref){
				if (ref.text != __('Cancel')) {
					var val = win.password.getValue();
					scope.refOwner.getForm().findField(scope.passwordFieldname).setValue(val ? val : null);
					scope.callback(scope, val);		
				}
				win.close();
			}
			win = new Ext.Window({
				title: __('Password'),
				modal: true,
				iconCls: 'icon-passwordwindow',
				width: 380,
				bodyCssClass: 'garp-formpanel',
				height: 160,
				listeners: {
					'show': function(){
						win.keymap = new Ext.KeyMap(win.getEl(), [{
							key: Ext.EventObject.ENTER,
							fn: btnHandler
						}, {
							key: Ext.EventObject.ESC,
							fn: win.close
						}]);
						
						// we need to delay this, because monitorValid is a taskRunner
						win.passwordform.startMonitoring();
						setTimeout(function(){
							win.password.clearInvalid();
							win.password.focus();
						}, 200);
					}
				},
				items: [{
					xtype: 'form',
					ref: 'passwordform',
					border: false,
					monitorValid: false,
					labelWidth: 140,
					defaults: {
						xtype: 'textfield',
						labelSeparator: '',
						width: 200,
						allowBlank: true,
						fieldLabel: __('New Password')
					},
					items: [{
						ref: '../password',
						inputType: 'password'
					}, {
						hidden: true,
						ref: '../plaintext',
						inputType: 'text'
					}, {
						fieldLabel: __('Show Password'),
						xtype: 'checkbox',
						allowBlank: true,
						ref: '../showpassword',
						handler: function(){
							var r = this.refOwner, c = this.checked;
							r.password.setVisible(!c);
							r.plaintext.setVisible(c);
							r[c ? 
								'plaintext' : 
								'password'].setValue(r[c ? 
									'password' : 
									'plaintext'].getValue());
						}
					}]
				}],
				buttons: [{
					text: __('Cancel'),
					handler: btnHandler
				}, {
					text: __('Save'),
					handler: btnHandler
				}]
			});
			win.show();
		}
	}*/
	
});

Ext.reg('passwordfieldset', Garp.PasswordFieldset);
/**
 * Simplistic Date&Time Picker 
 * @param {Object} config
 */
Ext.ux.DateTimePicker = Ext.extend(Ext.DatePicker, {
	
	showToday: true, // must be
	
	timeValue: '12:00',
	
	initComponent: function(){
		Ext.ux.DateTimePicker.superclass.initComponent.call(this);
	},
	
	onRender:function(ct,pos){
		Ext.ux.DateTimePicker.superclass.onRender.call(this,ct,pos);
		this.addTimeField.call(this);
	},
	
	addTimeField: function(){
		if (!this.timeField) {
			this.timeField = new Ext.form.TimeField({
				lazyInit: false,
				renderTo: this.el.child('.x-date-bottom'),
				value: this.timeValue,
				getListParent: function() {
    			    var parent = this.el.up('.x-menu');
					return parent;
    			},
				listeners:{
					'select': {
						fn: function(){
							return false;
						}
					},
					'focus': {
						fn: function(){
							this.doDisabled(true);
							return false;
						},
						scope:this
					},
					'blur': {
						fn: function(){
							this.doDisabled(false);
							return false;
						},
						scope: this
					},
					'render': function(){
						this.list.on('click',function(e){
							e.stopPropagation();
							return false;
						});
					}
				},
				width: 60				
			});
			Ext.select('.x-date-bottom div, .x-date-bottom table', this.el).each(function(){
				this.setStyle({
					'margin-left': '18px',
					'float': 'left'
				});
			});
		}
	}
});
Ext.ns('Ext.ux.menu');
Ext.ux.menu.DateTimeMenu = Ext.extend(Ext.menu.DateMenu, {
	initComponent : function(){
        this.on('beforeshow', this.onBeforeShow, this);
        if(this.strict = (Ext.isIE7 && Ext.isStrict)){
            this.on('show', this.onShow, this, {single: true, delay: 20});
        }
        Ext.apply(this, {
            plain: true,
            showSeparator: false,
            items: this.picker = new Ext.ux.DateTimePicker(Ext.applyIf({
                internalRender: this.strict || !Ext.isIE,
                ctCls: 'x-menu-date-item',
                id: this.pickerId
            }, this.initialConfig))
        });
		
        this.picker.purgeListeners();
        Ext.menu.DateMenu.superclass.initComponent.call(this);
        /**
         * @event select
         * Fires when a date is selected from the {@link #picker Ext.DatePicker}
         * @param {DatePicker} picker The {@link #picker Ext.DatePicker}
         * @param {Date} date The selected date
         */
        this.relayEvents(this.picker, ['select']);
        this.on('show', this.picker.focus, this.picker);
        this.on('select', this.menuHide, this);
        if(this.handler){
            this.on('select', this.handler, this.scope || this);
        }
    },
});

/**
 * @class Garp.DataType
 * Provides basic DataType skeleton to 
 * 
 * @author Peter
 */

Ext.ns('Garp');

Garp.DataType = Ext.extend(Ext.util.Observable, {
	
	/**
	 * Grid store needs field definitions. We create it from the columnModel
	 */
	getStoreFieldsFromColumnModel : function(){
		var fields = [];
		Ext.each(this.columnModel, function(col){
			var o = {};
			if(col.dataIndex){
				o.name = col.dataIndex;
			}
			if(col.convert){
				o.convert = col.convert;
			}
			if(col.mapping){
				o.mapping = col.mapping;
			}
			fields.push(o);
		});
		return fields;
	},
	
	/**
	 * EXPERIMENTAL view tpl (creates HTML view, when editing is not allowed)
	 */
	getViewTpl: function(){
		var str = '<div class="view">';
		Ext.each(this.formConfig[0].items[0].items, function(i){
			if (!i.hidden && !i.disabled && i.fieldLabel && i.name) {
				str += '<h2>' + __(i.fieldLabel) + '</h2>';
				str += '<div>{' + i.name + '}</div>';
			}
		});
		str+='</div>';
		this.viewTpl = new Ext.XTemplate(str,{ compiled: true });
		return this.viewTpl;
	},
	
	/**
	 * Sets permissions according to Garp.API offered methods
	 * @param {Object} model
	 * @return false if model is not accesible in the first place 
	 */
	setupACL: function(model){
		if(!Ext.isDefined(model.create)){
			Ext.apply(this, {
				disableCreate: true,
				quickCreatable: false
			});
		}
		if(!Ext.isDefined(model.destroy)){
			Ext.apply(this, {
				disableDelete: true
			});
		}
		if(!Ext.isDefined(model.fetch)){
			Ext.apply(this, {
				hidden: true,
				disabled: true,
				disableCreate: true,
				quickCreatable: false
			});
			return false;
		}
		return true;
	},
	
	/** 
	 * Removes a column
	 * @param {String} dataIndex
	 */
	removeColumn: function(dataIndex){
		this.columnModel.remove(this.getColumn(dataIndex));
	},

	/**
	 * Retrieve a column
	 * @param {String} dataIndex
	 */
	getColumn: function(dataIndex){
		var column;
		Ext.each(this.columnModel, function(c){
			if(c.dataIndex == dataIndex){
				column = c;
				return;
			}
		});
		return column;
	},
	
	/**
	 * Add a column
	 * @param {Object} column
	 */
	addColumn: function(column){
		this.columnModel.push(column);
	},
	
	/**
	 * Insert a column
	 * @param {Object} index
	 * @param {Object} column
	 */
	insertColumn: function(index, column){
		this.columnModel.splice(index, 0, column);
	},
	
	/** 
	 * Remove a field
	 * @param {String} name
	 */
	removeField: function(name){
		this.formConfig[0].items[0].items.remove(this.getField(name));
	},
	
	/**
	 * Get a Field by its name
	 * @param {String} name
	 */
	getField: function(name){
		var field;
		Ext.each(this.formConfig[0].items[0].items, function(items){
			Ext.each(items, function(i){
				if(i.name == name){
					field = i;
					return;
				}
			});
		});
		return field;
	},
	
	/**
	 * add a Field at the end
	 * @param {Object} config
	 */
	addField: function(config){
		this.formConfig[0].items[0].items.push(config);
	},
	
	/**
	 * Adds an array of fields
	 * @param {Object} arr of configs
	 */
	addFields: function(arr){
		Ext.each(arr, function(config){
			this.addField(config);
		}, this);
	},
	
	/**
	 * add a Field at specified index
	 * @param {Object} index
	 * @param {Object} config
	 */
	insertField: function(index, config){
		this.formConfig[0].items[0].items.splice(index, 0, config);
	},
	
	
	/**
	 * Grab your RelationPanel
	 * @param {Object} modelName
	 * @return panel
	 */
	getRelationPanel: function(modelName){
		var panel;
		Ext.each(this.formConfig, function(items){
			Ext.each(items, function(i){
				if(i.model == modelName){
					panel = i;
					return;
				}
			});
		});
		return panel;
	},

	/**
	 * Remove a RelationPanel
	 * @param String modelName
	 * @return Void
	 */
	removeRelationPanel: function(modelName) {
		for (var i = 0; i < this.formConfig.length; ++i) {
			if (this.formConfig[i].model == modelName) {
				this.formConfig.splice(i, 1);
				break;
			};
		};
	},
	
	/**
	 * Retrieve all relation data 
	 * @return {Array} modelNames
	 */
	getRelations: function(){
		var out = [];
		Ext.each(this.formConfig, function(item){
			if(item.xtype && item.xtype === 'relationpanel'){
				out.push(item.model);
			}
		});
		return out;
	},
	
	/**
	 * Add a RelationPanel, simple convenience utility
	 * @param {Object} config
	 */
	addRelationPanel: function(cfg){
		Ext.apply(cfg, {
			xtype: 'relationpanel'
		});
		this.formConfig.push(cfg);
	},
	
	/**
	 * Adds a listener
	 * @param {Object} eventName
	 * @param {Object} fn
	 * @param {Object} insertBefore
	 */
	addListener: function(eventName, fn, insertBefore){
		this.setupListeners(eventName);
		var oldListener = this.formConfig[0].listeners[eventName];
		if (insertBefore) {
			this.formConfig[0].listeners[eventName] = function(rec, fp){
				fn(rec, fp);
				oldListener(rec, fp);
			};
		} else {
			this.formConfig[0].listeners[eventName] = function(rec, fp){
				oldListener(rec, fp);
				fn(rec, fp);
			};
		}
	},
	
	// private
	setupListeners: function(eventName){
		Ext.applyIf(this.formConfig[0], {
			listeners : {}
		});
		Ext.applyIf(this.formConfig[0].eventName, {
			loaddata : function(){}
		});		
	},
	
	
	constructor: function(cfg){
		this.addEvents('init');
		this.listeners = cfg.listeners;
		this.initialCfg = Ext.apply({}, cfg);
		
		Ext.apply(this, cfg);
		
		Ext.applyIf(this, {
		
			// simple description text to be used at infopanel
			description: '',
			
			// count is used at infopanel
			countTpl: new Ext.XTemplate([__('Total'), ': {count} ', '<tpl if="count == 1">', __('item'), '</tpl>', '<tpl if="count != 1">', __('items'), '</tpl>']),
			
			// disabling will prevent this model from being accesible altogether
			disabled: false,
			
			// prevents User to delete record  
			disableDelete: false,
			
			// prevents User to create record
			disableCreate: false,
			
			// For relationpanels and fields. If this model is too complicated, one might want to set this to false: 
			quickCreatable: true,
			
			// how to display a record:
			displayFieldRenderer: function(rec){
				return rec.get('name') ? rec.get('name') : rec.phantom ? __('New ' + this.text) : __('Unnamed ' + this.text);
			},
			
			// the items to use for simple tooltips when referenced from a relationfield
			previewItems: [],
			
			// the items that the form's metaPanel will hold
			metaPanelItems: [],
			
			// previewlink can hold an object previewLink{urlTpl, param} for building a dynamic preview path for the user
			// urlTpl is an Ext.Template, and param the field/column reference
			previewLink: null,
			
			// the icon
			iconCls: 'icon-' + this.text.toLowerCase(),
			
			// this datatype does not contain editable fields, so hide the form and focus on the first relation tab:
			isRelationalDataType: false
		});
		
		Ext.applyIf(this.defaultData, {
			'created': null,
			'modified': null
		});
		
		Ext.applyIf(this, {
			columnModel: []
		});
		
		if (this.isRelationalDataType) {
			Ext.apply(this, {
				disableCreate: true,
				disableDelete: true
			});
			this.addListener('loaddata', function(r, fp){
				fp.items.get(0).activate(1);
				fp.items.get(0).hideTabStripItem(0);
			});
		}
		
		for (var column in this.defaultData) {
			var found = false;
			Ext.each(this.columnModel, function(item){
				if (item.dataIndex && item.dataIndex == column) {
					found = true;
				}
			});
			if (!found) {
				var txt = Ext.util.Format.capitalize(column.replace('_', ' '));
				
				this.columnModel.push({
					hidden: true,
					renderer: (column == 'created' || column == 'modified') ? Garp.renderers.dateTimeRenderer : null,
					dataIndex: column,
					header: __(txt)
				});
			}
		}
		
		Ext.each(this.columnModel, function(col){
			if(col.defaultData && col.defaultData === null){
				col.useNull = true;
			}
			if (col.virtual) {
				col.sortable = false;
			}
		});
		
		Garp.DataType.superclass.constructor.call(this, cfg);
	}
});

Ext.ns('Garp');
Ext.enableListenerCollection = true;
Ext.QuickTips.init();
Ext.Direct.addProvider(Garp.API);

Garp.errorHandler = {
	msg: null,
	win: null,

	handler: function(msg, s){
		if (!msg) {
			msg = __('No readable error message specified');
		}
		var showClear = false;
		if (this.msg) {
			showClear = true;
			this.msg = msg + '<hr>' + this.msg;
		} else {
			this.msg = msg;
		}
		if (!this.win) {

			this.win = new Ext.Window({
				title: '',
				data: {
					msg: __('No error')
				},
				tpl: new Ext.Template(['<div class="garp-error-dialog" style="min-height: 80px; max-height: 250px; overflow: auto; ">','{msg}','</div>']),
				width: 500,
				buttonAlign: 'center',
				defaultButton: 'defaultButton',
				buttons: [{
					text: __('Ok'),
					id: 'defaultButton',
					handler: function(){
						this.win.hide();
					},
					scope: this
				}, {
					hidden: true,
					text: __('Login again'),
					handler: function(){
						this.win.close();
						window.location = BASE + 'g/auth/login';
					},
					scope: this
				}, {
					hidden: !showClear,
					ref: '../clearBtn',
					text: __('Clear messages'),
					handler: function(){
						this.msg = '';
						this.win.update({
							msg: this.msg
						});
						this.win.hide();
						//this.win.center();
					},
					scope: this
				}]
			});
		} else {
			this.win.clearBtn.show();
		}
		this.win.show();
		this.win.update({
			msg: this.msg
		});
		//this.win.center();

	}
};
window.onerror = Garp.errorHandler.handler.createDelegate(Garp.errorHandler);

Ext.Direct.on({
	'exception': {
		fn: function(e, p){

			var transaction = '', action = '', method = '', message = '', tid = '';

			if (Ext.isObject(e)) {
				if (e.error) {
					message = e.error.message;
				} else {
					if(e.xhr && e.xhr.status === 403){
						message = __('You\'ve been logged out');
					} else {
						message = __('No connection');
					}
				}
				tid = e.tid;
				transaction = tid ? e.getTransaction() : null;

				if (Ext.isObject(transaction)) {
					action = transaction.action;
					method = transaction.method;
				}

				// now undirty & remove loadmasks again:
				// temporary!
				Garp.undirty();
				if (Garp.gridPanel && Garp.gridPanel.loadMask) {
					Garp.gridPanel.loadMask.hide();
					if (Garp.formPanel) {
						// reset state
						Garp.formPanel.state = 0;
						Garp.formPanel.updateUI();
						Garp.formPanel.fireEvent('dirty');
					}
				}


			}

			Garp.errorHandler.handler(
				'<b>' + (method ? __('Error trying to ') + __(method) : '' ) + ' ' + (Garp.dataTypes[action] ? '<i>'+__(Garp.dataTypes[action].text)+'</i>' : action) + '</b><br><br>' +
				message || __('Nothing. Nada.') + '<br>' +
				(tid ? (__('Transaction id: ') + tid) : '')
			);


		}
	}
});

/**
 * We can override Ext.ux.form.dateTime just now
 * Override it, so that the columnModel doesn't think it got changed. (isDirty fix)
 */
Ext.override(Ext.ux.form.DateTime, {
	getValue: function(){
		return this.dateValue ? this.dateValue.format(this.hiddenFormat) : '';
	}
});
/**
 * Idem
 */
Ext.override(Ext.form.Checkbox,{
	getValue: function(){
		if (this.rendered) {
			return this.el.dom.checked ? "1" : "0";
		}
		return this.checked ? "1" : "0";
	}
});
/**
 * Idem
 */
Ext.override(Ext.form.DateField, {
	format: 'd F Y',
	altFormats: 'Y-m-d|d F Y|j F Y|d m Y|d n Y|d-m-Y|d-n-Y',
	invalidText: __('"{0}" is not a valid date. Valid formats are a.o. "19 2 2013" and "19-02-2013"')
});
Ext.apply(Ext.form.TimeField.prototype, {
    altFormats: 'g:ia|g:iA|g:i a|g:i A|h:i|g:i|H:i|ga|ha|gA|h a|g a|g A|gi|hi|gia|hia|g|H|H:i:s'
});
/**
 * Idem
 */
Ext.apply(Ext.PagingToolbar.prototype, {
	beforePageText: '',
	displayMsg: ''
});

/**
 * Idem
 */
Ext.apply(Ext.ux.form.DateTime.prototype, {
	timeFormat: 'G:i',
	otherToNow: false,
	initDateValue:function() {
        this.dateValue = this.otherToNow ? new Date() : new Date(new Date().getFullYear(), 0, 1, 12, 0, 0);
    },
	timeConfig: {
		increment: 30
	},
	timeWidth: 70
});

Ext.form.VTypes.mailtoOrUrlText = __('Not a valid Url');

/**
 * Override To disable keynav when grid is disabled
 * @param {Object} e
 * @param {Object} name
 */
Ext.override(Ext.grid.RowSelectionModel, {
	onKeyPress : function(e, name){
		if(this.grid.disabled){
			return;
		}
        var up = name == 'up',
            method = up ? 'selectPrevious' : 'selectNext',
            add = up ? -1 : 1,
            last;
        if(!e.shiftKey || this.singleSelect){
            this[method](false);
        }else if(this.last !== false && this.lastActive !== false){
            last = this.last;
            this.selectRange(this.last,  this.lastActive + add);
            this.grid.getView().focusRow(this.lastActive);
            if(last !== false){
                this.last = last;
            }
        }else{
           this.selectFirstRow();
        }
    }
});


/**
 * use isValid() instead of validate() - validate causes the field to visually change state
 */
Ext.override(Ext.form.BasicForm, {
	isValid: function(){
		var valid = true;
		this.items.each(function(f){
			if (!f.isValid(true)) { // instead of validate()
				valid = false;
				return false;
			}
		});
		return valid;
	}
});

/**
 * Defaults for NumberField
 */
Ext.override(Ext.form.NumberField, {
	decimalPrecision: 16
});
Ext.override(Ext.form.NumberField, {
setValue : function(v){
v = typeof v == 'number' ? v : parseFloat(String(v).replace(this.decimalSeparator, "."));
v = isNaN(v) ? null : String(v).replace(".", this.decimalSeparator);
return Ext.form.NumberField.superclass.setValue.call(this, v);
},

// private

parseValue : function(value){
value = parseFloat(String(value).replace(this.decimalSeparator, "."));
return isNaN(value) ? null : value;
},

// private

fixPrecision : function(value){
var nan = isNaN(value);
if(!this.allowDecimals || this.decimalPrecision == -1 || nan || !value){
return nan ? null : value;
}
return parseFloat(parseFloat(value).toFixed(this.decimalPrecision));
}
});


/**
 * Enable key events in combo's and set a default emptyText
 */
Ext.apply(Ext.form.ComboBox.prototype, {
	enableKeyEvents: true,
	emptyText: __('(empty)'),
	afterRender: function(){
		Ext.form.ComboBox.superclass.afterRender.call(this);
		if (this.mode != 'local' || this.xtype == 'timefield' || this.xtype == 'datefield') {
			return;
		}
		var displayField = this.store.fields.items[this.store.fields.items.length - 1].name;
		var valueField = this.store.fields.items[this.store.fields.items.length - 2 > -1 ? this.store.fields.items.length - 2 : 0].name;
		this.el.on('keypress', function(e){
			var charc = String.fromCharCode(e.getCharCode());
			var selectedIndices = this.view.getSelectedIndexes();
			var currentSelectedIdx = (selectedIndices.length > 0) ? selectedIndices[0] : null;
			var startIdx = (currentSelectedIdx === null) ? 0 : ++currentSelectedIdx;
			var idx = this.store.find(displayField, charc, startIdx, false);
			if (idx > -1) {
				this.select(idx);
			} else if (idx == -1 && startIdx > 0) {
				// search looped, start at 0 again:
				idx = this.store.find(displayField, charc, 0, false);
				if (idx > -1) {
					this.select(idx);
				}
			}
			if (idx > -1) {
				var rec = this.store.getAt(idx);
				this.setValue(rec.get(valueField));
			}
		}, this);
	}
});


/**
 * Override Ext.grid.GridView doRender, so that it passes a reference to the Grid view to a column Renderer
 *
 *
 * @param {Object} columns
 * @param {Object} records
 * @param {Object} store
 * @param {Object} startRow
 * @param {Object} colCount
 * @param {Object} stripe
 */
Ext.override(Ext.grid.GridView, {
	doRender: function(columns, records, store, startRow, colCount, stripe){
		var templates = this.templates, cellTemplate = templates.cell, rowTemplate = templates.row, last = colCount - 1, tstyle = 'width:' + this.getTotalWidth() + ';',  // buffers
		rowBuffer = [], colBuffer = [], rowParams = {
			tstyle: tstyle
		}, meta = {}, len = records.length, alt, column, record, i, j, rowIndex;

		//build up each row's HTML
		for (j = 0; j < len; j++) {
			record = records[j];
			if (!record) {
				continue;
			}
			colBuffer = [];

			rowIndex = j + startRow;

			//build up each column's HTML
			for (i = 0; i < colCount; i++) {
				column = columns[i];

				meta.id = column.id;
				meta.css = i === 0 ? 'x-grid3-cell-first ' : (i == last ? 'x-grid3-cell-last ' : '');
				meta.attr = meta.cellAttr = '';
				meta.style = column.style;
				meta.value = column.renderer.call(column.scope, record.data[column.name], meta, record, rowIndex, i, store, this);
				if (Ext.isEmpty(meta.value)) {
					meta.value = '&#160;';
				}

				if (this.markDirty && record.dirty && typeof record.modified[column.name] != 'undefined') {
					meta.css += ' x-grid3-dirty-cell';
				}

				colBuffer[colBuffer.length] = cellTemplate.apply(meta);
			}

			alt = [];
			//set up row striping and row dirtiness CSS classes
			if (stripe && ((rowIndex + 1) % 2 === 0)) {
				alt[0] = 'x-grid3-row-alt';
			}

			if (record.dirty) {
				alt[1] = ' x-grid3-dirty-row';
			}

			rowParams.cols = colCount;

			if (this.getRowClass) {
				alt[2] = this.getRowClass(record, rowIndex, rowParams, store);
			}

			rowParams.alt = alt.join(' ');
			rowParams.cells = colBuffer.join('');

			rowBuffer[rowBuffer.length] = rowTemplate.apply(rowParams);
		}

		return rowBuffer.join('');
	}
});

Ext.apply(Ext.form.TextField.prototype, {
	minLengthText: __('You have {2} character(s) too few. The minimal length is {0}.'),
	maxLengthText: __('You have {2} character(s) too many. The maximum length is {0}.'),
	getErrors: function(value){
		var errors = Ext.form.TextField.superclass.getErrors.apply(this, arguments);

		value = Ext.isDefined(value) ? value : this.processValue(this.getRawValue());

		if (Ext.isFunction(this.validator)) {
			var msg = this.validator(value);
			if (msg !== true) {
				errors.push(msg);
			}
		}

		if (value.length < 1 || value === this.emptyText) {
			if (this.allowBlank) {
				//if value is blank and allowBlank is true, there cannot be any additional errors
				return errors;
			} else {
				errors.push(this.blankText);
			}
		}

		if (!this.allowBlank && (value.length < 1 || value === this.emptyText)) { // if it's blank
			errors.push(this.blankText);
		}

		if (value.length < this.minLength) {
			errors.push(String.format(this.minLengthText, this.minLength, value.length, this.minLength - value.length)); // PP added too few
		}

		if (value.length > this.maxLength) {
			errors.push(String.format(this.maxLengthText, this.maxLength, value.length, value.length - this.maxLength)); // PP added too many
		}

		if (this.vtype) {
			var vt = Ext.form.VTypes;
			if (!vt[this.vtype](value, this)) {
				errors.push(this.vtypeText || vt[this.vtype + 'Text']);
			}
		}

		if (this.regex && !this.regex.test(value)) {
			errors.push(this.regexText);
		}

		return errors;

	}
});

Ext.apply(Ext.menu.Menu.prototype, {
	scrollIncrement: 35,
	onScrollWheel: function(e){
		if(e.getWheelDelta() > 0){
			this.onScroll(null, this.scroller.top);
		} else if (e.getWheelDelta() < 0){
			this.onScroll(null, this.scroller.bottom);
		}
	}
});
Ext.menu.Menu.prototype.createScrollers = Ext.menu.Menu.prototype.createScrollers.createSequence(function(){
	var scope = this;
	var task = null;

	function startScroll(elm){
		if(task){
			stopScroll();
		}
		task = setInterval(function(){
			scope.onScroll(null, elm);
		}, 100);
	}

	function stopScroll(){
		clearInterval(task);
		task = null;
	}

	Ext.EventManager.addListener(this.el, 'mousewheel', this.onScrollWheel, this);
	this.on('destroy', function(){
		Ext.EventManager.removeListener(this.el, 'mousewheel', this.onScrollWheel, this);
	});

	this.scroller.top.on('mouseenter', startScroll.createDelegate(this, [this.scroller.top]));
	this.scroller.top.on('mouseleave', stopScroll);
	this.scroller.bottom.on('mouseenter', startScroll.createDelegate(this, [this.scroller.bottom]));
	this.scroller.bottom.on('mouseleave', stopScroll);

});

/** Fixes some el == null issues at D 'n D **/
Ext.lib.Dom.getXY = Ext.lib.Dom.getXY.createInterceptor(function(el){
	return el || false;
});
Ext.lib.Region.getRegion = Ext.lib.Region.getRegion.createInterceptor(function(el){
	return el || false;
});

/**
 * Garp CMS
 * Garp.js
 * Main setup for Garp CMS
 *
 * @namespace Garp
 * @copyright (c) 2010 Grrr.nl / eenengelswoord.nl
 * @author Peter
 */

window.onbeforeunload = function(){
	if (Garp.checkForModified()) {
		return __('Are you sure you want to navigate away from Garp?');
	}
};

/**
 * Checks for grid modifications
 * @return number records modified
 */
Garp.checkForModified = function(){
	if(Garp.gridPanel && Garp.gridPanel.getStore && Garp.gridPanel.getStore()){
		var count = Garp.gridPanel.getStore().getModifiedRecords().length;
		return count; // > 0;
	}
	return false;
};

/**
 * util function
 */
Garp.lazyLoad = function(url, cb){
	var cbId = Ext.id(null, 'garp');
	window['cb' + cbId] = cb.createDelegate(this).createSequence(function(){
		delete window['cb' + cbId];
	}, this);
	var script = document.createElement("script");
	script.type = "text/javascript";
	script.src = url + "&callback=cb" + cbId;
	document.body.appendChild(script);
};

/**
 * UI dirty
 */
Garp.dirty = function(){
	Garp.gridPanel.disable();
	Garp.toolbar.disable();
};

/**
 * UI undirty
 */
Garp.undirty = function(){
	Garp.gridPanel.enable();
	Garp.toolbar.enable();
};


/**
 * @function updateUI
 * @param {object} selectionModel
 * Gets called whenever a selection change occurs. Reflect the UI:
 *
 * 0 items selected: hide
 * 1 item : show
 * 2 items: show & display mode Indicator
 */
Garp.updateUI =function(sm){
	if (!sm || !sm.getCount) {
		if(!Garp.gridPanel){
			return;
		}
		sm = Garp.gridPanel.getSelectionModel ? Garp.gridPanel.getSelectionModel() : false;
		if (!sm) {
			return;
		}
	}
	var count = sm.getCount();
	if(count > 1){
		count = 2;
	}
	if(window.innerWidth <= Garp.SMALLSCREENWIDTH && count == 1){
		Garp.viewport.gridPanelCt.collapse();
	}

	if (Garp.updateUI.prevCount && Garp.updateUI.prevCount == count) {
		return;
	}
	switch (count) {
		case 1: // single mode
			//Garp.viewport.formPanelCt.doLayout();
			Garp.viewport.formPanelCt.getLayout().setActiveItem(1);
			Garp.formPanel.show();
			break;
		case 0: //default: // no items selected, or multiple items:
			Garp.viewport.formPanelCt.getLayout().setActiveItem(0);
			Garp.viewport.infoPanel.setInfo(Garp.dataTypes[Garp.currentModel]);
			Garp.viewport.formPanelCt.doLayout();
			Garp.viewport.infoPanel.updateCount(Garp.gridPanel.getStore().getTotalCount());
			break;
	}

	Garp.updateUI.prevCount = count;
	return true;
};

/**
 * Simple singleton for managing state
 */
Garp.history = Ext.apply(Garp.history || {}, {

	pastModel: null,

	pushState: function(state){
		if (!state) {
			state = this.getCurrentState();
		}
		if (state && history.pushState) {
			if (state.model !== Garp.history.pastModel) {
				history.pushState(state, '' + __(Garp.dataTypes[state.model].text || ''), BASE + 'admin/?' + Ext.urlEncode(state));
			} else {
				history.replaceState(state, '' + __(Garp.dataTypes[state.model].text || ''), BASE + 'admin/?' + Ext.urlEncode(state));
			}
			Garp.history.pastModel = state.model;
		}
	},

	getCurrentState: function(){
		if (Garp.gridPanel && Garp.gridPanel.store) {
			var state = {};
			var pt = Garp.gridPanel.getBottomToolbar();
			var tt = Garp.gridPanel.getTopToolbar();
			var sm = Garp.gridPanel.getSelectionModel();
			if (tt && tt.searchField.getValue() === '') { // make sure there is no query
				state.page = Math.ceil((pt.cursor + pt.pageSize) / pt.pageSize) || null;
			}
			state.id = sm.getSelected() ? parseInt(sm.getSelected().get('id'), 10) || null : null;
			state.model = Garp.currentModel;
			return state;
		} else {
			return null;
		}
	},

	parseState: function(state){
		if (!state) {
			state = Ext.urlDecode(document.location.search.replace(/\?/, ''));
		}
		if (state.model) {
			Garp.eventManager.fireEvent('modelchange', false, state.model || null, state.page || null, state.id || null);
		}
	},

	setupListeners: function(){
		var scope = this;
		window.addEventListener('popstate', function(e){
			if(!e || !e.state){
				return;
			}
			scope.parseState(e.state ? e.state : e.originalEvent.state ? e.originalEvent.state : null);
		});
	}
});

/**
 * Changes the model to a new one. Then rebuild the UI.
 * @param {Bool} true to save state.
 * @param {String} model
 * //@param {Bool} overrideURI whether or not to check for URL parameters
 * @param {Number} page
 * @param {Number} id
 */
Garp.changeModel = function(doPushState, model, page, id){

	if (typeof Garp.dataTypes[model] == 'undefined') {
		return false;
		//throw ("Unknown model specified.");
	}

	if (Garp.checkForModified() > 1 || (Garp.checkForModified() == 1 && !Garp.gridPanel.getSelectionModel().getSelected().phantom)) {
		var store = Garp.gridPanel.getStore();
		var state = Garp.history.getCurrentState();

		Ext.Msg.show({
			animEl: Garp.viewport.getEl(),
			icon: Ext.MessageBox.QUESTION,
			title: __('Garp'),
			msg: __('Would you like to save your changes?'),
			buttons: Ext.Msg.YESNOCANCEL,
			fn: function(btn){
				switch (btn) {
					case 'yes':
						store.on({
							save: {
								single: true,
								fn: function(){
									Garp.changeModel(doPushState, model, page, id);
								}
							}
						});
						store.save();

						break;
					case 'no':
						store.rejectChanges();
						Garp.changeModel(doPushState, model, page, id);
						break;
					//case 'cancel':
					default:
						break;
				}
			}
		});
		return;
	}
	Garp.infoPanel.clearInfo();

	Garp.eventManager.purgeListeners();
	Garp.setupEventManager();

	Garp.currentModel = model;

	if (doPushState) {
		Garp.history.pushState({
			model: model
		});
	}

	Garp.modelMenu.setIconClass(Garp.dataTypes[model].iconCls);
	Garp.modelMenu.setText(__(Garp.dataTypes[model].text));
	if (Garp.gridPanel) {
		Garp.gridPanel.ownerCt.remove(Garp.gridPanel);
	}

	if (Garp.formPanel && Garp.formPanel.ownerCt) {
		Garp.viewport.formPanelCt.getLayout().setActiveItem(0);
		Garp.viewport.formPanelCt.remove(Garp.formPanel);
	}

	Garp.formPanel = new Garp.FormPanel({
		previousValidFlag: true,
		listeners: {
			'cancel': function(){
				// reselect item to revert formPanel contents:
				var s = Garp.gridPanel.getSelectionModel().getSelected();
				Garp.gridPanel.getSelectionModel().clearSelections();
				Garp.gridPanel.getSelectionModel().selectRecords([s]);
			},
			'defocus': function(){
				Garp.gridPanel.focus.call(Garp.gridPanel);
			},
			'dirty': Garp.dirty,
			'undirty': Garp.undirty
		}
	});
	Garp.viewport.formPanelCt.add(Garp.formPanel);
	Garp.viewport.formPanelCt.doLayout();

	Garp.gridPanel = new Garp.GridPanel({
		model: model,
		listeners: {
			'beforesave': function(){
				Garp.syncValues();
			},
			'rowdblclick': function(){
				Garp.formPanel.focusFirstField();
			},
			'afterdelete': function(){
				Garp.formPanel.hide();
				Garp.gridPanel.enable();
				Garp.undirty();
			},
			'defocus': function(){
				Garp.formPanel.focusFirstField();
			},
			'storeloaded': {
				fn: function(){
					this.enable();
					if (document.location.hash == '#selectfirst') {
						Garp.gridPanel.getSelectionModel().selectFirstRow();
					}
					// wait for store load before pushing history actions. It might just be that (previous) state we loaded from!
					Garp.gridPanel.on('rowselect', function(){
						Garp.history.pushState();
					}, this, {
						buffer: 500
					});
				},
				buffer: 300,
				delay: 300,
				single: true
			},
			'after-save': function(){
				//@TODO: fixme
				//Can this try/catch be done in a better way?
				try {
					if (window.opener && typeof window.opener.Garp != 'undefined') {
						// window.opener is always true... but window.opener.Garp is not accessible if we didn't open the window ourselves
						window.opener.Garp.eventManager.fireEvent('external-relation-save');
					}
				}
				catch (e) {
				}
			}
		}
	});
	Garp.viewport.gridPanelCt.add(Garp.gridPanel);
	Garp.viewport.gridPanelCt.doLayout();

	//Garp.rebuildViewportItems();

	Garp.gridPanel.on({
		'storeloaded': function(){
			Garp.updateUI.prevCount = -1;
			Garp.updateUI();
			if (!Garp.gridPanel.grid) {
				return;
			}
			var sm = Garp.gridPanel.getSelectionModel();
			var selected = sm.getSelections();
			sm.clearSelections();
			sm.selectRecords(selected);
		},
		'selectionchange': {
			fn: Garp.updateUI,
			buffer: 110
		}
	});

	Garp.gridPanel.relayEvents(Garp.eventManager, ['new', 'save-all', 'delete', 'clientvalidation']);
	Garp.formPanel.relayEvents(Garp.eventManager, ['new', 'rowselect', 'after-save']);

	Garp.eventManager.relayEvents(Garp.gridPanel, ['beforerowselect', 'rowselect', 'storeloaded', 'after-save', 'selectionchange', 'open-new-window']);
	Garp.eventManager.relayEvents(Garp.formPanel, ['clientvalidation', 'save-all', 'open-new-window', 'preview', 'delete']);

	Garp.infoPanel.clearInfo();

	// And fetch them data:
	// var query = Ext.urlDecode(window.location.search);
	if (id && !page) {
		Garp.gridPanel.getStore().load({
			params: {
				query: {
					id: id
				}
			},
			callback: function(){
				// select the item to show the formpanel:
				Garp.gridPanel.getSelectionModel().selectFirstRow();
				Garp.gridPanel.getTopToolbar().searchById(id); // only visually set the UI as if searched, no real DB call.
				Garp.formPanel.on({
					'show': function(){
						var tt = new Ext.ToolTip({
							target: Garp.gridPanel.getTopToolbar().items.get(1).triggers[0],
							anchor: 'top',
							anchorOffset: -13,
							html: __('Click here to view all items again'),
							closable: true,
							autoHide: true
						});
						tt.show();
					},
					'single': true,
					'delay': 100
				});
			}
		});
	} else if(page){

		// @TODO: Find out if we can do this better. Two loads is a bit awkward!
		Garp.gridPanel.getStore().on({
			load: function(){
				if (id) {
					Garp.gridPanel.getStore().on({
						'load': function(){
							var idx = Garp.gridPanel.getStore().find('id', id);
							if (idx > -1) {
								var rec = Garp.gridPanel.getStore().getAt(idx);
								Garp.gridPanel.getSelectionModel().selectRecords([rec]);
							}
						},
						scope: this,
						single: true
					});
				}
				Garp.gridPanel.getBottomToolbar().changePage(page);
			},
			single: true
		});
		//Garp.gridPanel.getStore().load();
		Garp.gridPanel.loadStoreWithDefaults();
	} else {
		//Garp.gridPanel.getStore().load();
		Garp.gridPanel.loadStoreWithDefaults();
	}

	// Disable toolbar items if neccesary:
	var tb = Garp.toolbar;
	tb.newButton.setVisible(!Garp.dataTypes[model].disableCreate);
	tb.deleteButton.setVisible(!Garp.dataTypes[model].disableDelete);
	tb.separator.setVisible(!Garp.dataTypes[model].disableDelete || !Garp.dataTypes[model].disableCreate);
	tb.extraMenu.menu.importButton.show();
	tb.extraMenu.menu.exportButton.show();
	tb.extraMenu.menu.printButton.show();

	document.title = __(Garp.dataTypes[model].text) + ' | ' + (typeof APP_TITLE != 'undefined' ? APP_TITLE : '');
	try {
		Garp.setFavicon(Garp.dataTypes[model].iconCls);
	} catch (e) {
		// Firefox throws SecurityError when reading x-domain CSS stylerules.
		if (e.name !== 'SecurityError') {
			throw e;
		}
	}

};


/**
 * setFavicon
 * @param {String} iconCls (optional, leave blank for Garp favicon)
 */
Garp.setFavicon = function(iconCls){
	var doc = document,
		menuItem = doc.querySelector('.' + iconCls);
	if (!menuItem) {
		return;
	}

	var iconUrl = window.getComputedStyle(menuItem, null).getPropertyValue('background-image');
	// replace "url(" and all that
	iconUrl = iconUrl.replace(/\burl\s*\(\s*["']?([^"'\r\n,]+)["']?\s*\)/gi, "$1");

	var favicon = doc.getElementById('favicon');
	favicon.setAttribute('href', iconUrl);
};

/**
 * Sync the values from the form to the grid.
 */
Garp.syncValues = function(){
	var fp = Garp.formPanel;
	fp.getForm().updateRecord(fp.rec);
};

/**
 * (Re-) add the grid and the form to the viewport.
 */
Garp.rebuildViewportItems = function(){
	if(Garp.infoPanel){
		Garp.infoPanel.clearInfo();
	}
	if (Garp.gridPanel) {
		Garp.viewport.gridPanelCt.remove(Garp.gridPanel);
	}
	if (Garp.formPanel) {
		Garp.viewport.formPanelCt.remove(Garp.formPanel);
	}
	Garp.viewport.formPanelCt.add(Garp.formPanel);
	Garp.formPanel.hide();
	Garp.viewport.gridPanelCt.add(Garp.gridPanel);
	Garp.viewport.gridPanelCt.doLayout();
};

/**
 * Eventmanager and subscriptions to various events.
 */
Garp.setupEventManager = function(){
	Garp.eventManager = new Ext.util.Observable();

	Garp.eventManager.addEvents('modelchange', 'beforerowselect', 'rowselect', 'storeloaded', 'new', 'save-all', 'after-save', 'delete','logout','open-new-window','external-relation-save', 'after-init');
	Garp.eventManager.on({
		'new': function(){
			Garp.updateUI.defer(20);
		},
		'modelchange': Garp.changeModel,
		'open-new-window': function(){
				if(!Garp.formPanel){
					return;
				}
				var id = Garp.formPanel.getForm().findField('id').getValue();
				if (id) {
					var url = BASE + 'admin?' + Ext.urlEncode({
						model: Garp.currentModel,
						id: id
					});
					var win = window.open(url);
				}
		},
		'logout': function(){
			window.location = BASE + 'g/auth/logout';
		},
		'preview': function(){
			var t = Garp.dataTypes[Garp.currentModel].previewLink;
			var s = Garp.gridPanel.getSelectionModel().getSelected();
			if (t && s) {
				var tpl = new Ext.Template(t.urlTpl);
				var url = tpl.apply([s.get(t.param)]);
				var win = window.open(BASE + url);
			}
		},
		/**
 	 	 * Afterinit
 	 	 * Sets up history & displays flashMessages if needed. Also hides the loader anim.
 	 	 */
		'after-init': function() {

			Garp.history.setupListeners();
			Garp.history.parseState();

			var timeout = 610;
			if (Garp.flashMessage()) {
				timeout = 2000;
			}
			setTimeout(function(){
				Ext.get('app-loader').fadeOut();
			}, timeout);

			// Trigger queued functions
			Garp.afterInit();
		}
	});

	Garp.eventManager.relayEvents(Garp.toolbar, ['logout', 'delete', 'new', 'open-new-window']);
};

/**
 * Setup Global Keyboard shortcuts:
 */
Garp.ctrlEnter = function () {
	if (Garp.formPanel.formcontent.getTopToolbar().saveButton.disabled) {
		return;
	}
	Garp.eventManager.fireEvent('save-all');
 };
Garp.setupGlobalKeys = function(){
	Garp.keyMap = new Ext.KeyMap(Ext.getBody(), [{
		key: Ext.EventObject.ENTER,
		ctrl: true,
		handler: function(e){
			Garp.ctrlEnter();
		}
	},{
		key: 'N',
		ctrl: true,
		handler: function(e){
			if(Garp.dataTypes[Garp.currentModel].disableCreate || Garp.toolbar.newButton.disabled){
				return;
			}
			Garp.eventManager.fireEvent('new');
		}
	}]);
	Garp.keyMap.stopEvent = true; // prevents browser key handling.
};

/**
 * Displays flashMessage from cookie
 * @returns {bool} if a flashMessage is shown
 */
Garp.flashMessage = function(){
	var cookie = Ext.decode(Ext.util.Cookies.get('FlashMessenger'));
	var str = '';
	if(cookie.messages){
		for(var msg in cookie.messages){
			msg = cookie.messages[msg];
			if (msg) {
				msg = msg.replace(/\+/g, ' ');
				str += msg + '<br>';
			}
		}
		if(str){
			var elm = Ext.get('app-loader');
			elm.update(str);
			elm.setWidth(300);
			elm.setHeight((cookie.messages.length-1) * 20 + 30);

			var value = "; path=/";
			var date = new Date();
			date.setHours(date.getHours(-1));
			value += ((date===null) ? "" : "; expires="+date.toGMTString());
			document.cookie='FlashMessenger' + "=" + value;
			return true;
		}
	}
	return false;
};


/**
 * Global Ajax event's will show a small spinner for the user to see activity with the server:
 */
Garp.setupAjaxSpinner = function(){
	var spinner = Ext.select('#icon-loading-spinner');
	spinner.hide();
	Ext.Ajax.on('requestcomplete', function(){
		if (!Ext.Ajax.isLoading()) {
			spinner.hide.defer(200, spinner); // defer makes it a bit less flashy & hyperactive
		}
	});
	Ext.Ajax.on('beforerequest', function(){
		spinner.show();
	});
	Ext.Ajax.on('requestexception', function(){
		spinner.hide();
	});
};

/**
 * Lo-fi event listener: allow models to queue functionality until Garp is fully initialized.
 * That way, models may register functionality that manipulates for instance the toolBar or gridPanel,
 * that would otherwise not yet exist at the time of initialization.
 */
Garp.afterInitListeners = [];
Garp.afterInit = function(fn) {
	if (!arguments.length) {
		// Execute after init listeners
		Ext.each(Garp.afterInitListeners, function(fn) {
			if (typeof fn !== 'function') {
				return;
			}
			fn();
		});
		return;
	}
	// If given a function, add it to the stack
	Garp.afterInitListeners.push(fn);
};

/**
 * Init
 */
Garp.init = function(){
	Garp.gridPanel = new Garp.WelcomePanel(); // temporarily call it Garp.gridPanel, so the viewport doesn't have to reconfigure.
	Garp.viewport = new Garp.Viewport();
	Garp.setupEventManager();
	Garp.setupGlobalKeys();
	Garp.setupAjaxSpinner();
	Garp.eventManager.fireEvent('after-init');
};
