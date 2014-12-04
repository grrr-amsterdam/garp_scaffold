/**
 * InlineRelator class
 */
Garp.InlineRelator = Ext.extend(Ext.Panel, {

	model: '',
	rule: null,
	rule2: null,
	unrelateExisting: true,
	localId: null,
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	border: false,
	bodyBorder: false,
	autoHeight: true,
	autoScroll: true,

	getEmptyRecord: function(){
		return new this.relationStore.recordType();
	},
<<<<<<< HEAD
	
	setupStore: function(){
		var fields = Garp.dataTypes[this.model].getStoreFieldsFromColumnModel();
=======

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
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94

		this.writer = new Ext.data.JsonWriter({
			paramsAsHash: false,
			encode: false
		});
<<<<<<< HEAD
		
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
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
<<<<<<< HEAD
=======
				fields: fieldsForQuery,
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
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
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
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
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	addInlineForms: function(){
		this.relationStore.each(function(rec){
			this.add({
				xtype: 'inlineform',
				rec: rec,
				model: this.model,
				inlineRelator: this
			});
		}, this);
<<<<<<< HEAD
		this.doLayout();		
	},
	
=======
		this.doLayout();
	},

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
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
<<<<<<< HEAD
		
		var newRec = this.getEmptyRecord();
		this.relationStore.insert(idx, newRec);
		
=======

		var newRec = this.getEmptyRecord();
		this.relationStore.insert(idx, newRec);

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
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
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
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
<<<<<<< HEAD
		
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
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
<<<<<<< HEAD
		
	},
	
=======

	},

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	saveAll: function(){
		this.relationStore.on({
			save: {
				fn: this.relate,
				scope: this
			}
		});
		this.relationStore.save();
	},
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	removeForm: function(form){
		this.relationStore.remove(form.rec);
		this.remove(form);
		this.doLayout();
		this.relate();
	},
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	initComponent: function(ct){
		Garp.InlineRelator.superclass.initComponent.call(this, ct);

		this.ownerForm = this.ownerCt.ownerCt;
		this.setupStore();
<<<<<<< HEAD
		
		this.ownerForm.on('loaddata', function(rec,fp){
			
			this.localId = rec.get('id');
			
=======

		this.ownerForm.on('loaddata', function(rec,fp){

			this.localId = rec.get('id');

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
			// first remove all "previous" items:
			this.items.each(function(item){
				this.remove(item);
			}, this);
			this.relationStore.removeAll(true);
<<<<<<< HEAD
			
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
			var q = {};
			q[Garp.currentModel + '.id'] = this.localId;
			this.relationStore.setBaseParam('query', q);
			this.relationStore.reload();
		}, this);
<<<<<<< HEAD
		
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		Garp.eventManager.on('save-all', function(){
			this.items.each(function(){
				if (this.updateRecord) {
					this.updateRecord(this.rec);
				}
			});
			this.saveAll();
		}, this);
<<<<<<< HEAD
		
	}
	
=======

	}

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
});
Ext.reg('inlinerelator',Garp.InlineRelator);

/**
 * InlineRelator uses InlineForm
 */
Garp.InlineForm = Ext.extend(Ext.Panel, {

	rec: null,
	inlineRelator: '',
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	border: false,
	bodyBorder: false,
	hideBorders: true,
	style:'padding-bottom: 2px;',
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	border: false,
	bodyBorder: false,
	layout:'hbox',
	hideLabel: true,
	xtype:'inlineform',
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	/**
	 * Converts standard formConfig fieldset to a panel with fields
	 * @param {Object} items
	 */
	morphFields: function(items){
<<<<<<< HEAD
		
		var copy = items.items.slice(0);
		
=======

		var copy = items.items.slice(0);

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
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
<<<<<<< HEAD
		
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
		Ext.each(copy, function(item){
			if (!item.hasOwnProperty('flex')) {
				item.flex = 1;
			}
<<<<<<< HEAD
			// Uitgecomment door Harmen @ 4 maart 2014, omdat 
=======
			// Uitgecomment door Harmen @ 4 maart 2014, omdat
>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
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
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
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
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
	layout: 'hbox',
	border: false,
	hideLabel: true,
	style:'margin-bottom: 5px;font-weight: bold;',
	defaults: {
		flex: 1,
		xtype: 'label'
	},
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
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
<<<<<<< HEAD
	
=======

>>>>>>> 2003f3421883bf4e997378d8d830e797926e2f94
});
Ext.reg('inlinerelatorlabels', Garp.InlineRelatorLabels);
