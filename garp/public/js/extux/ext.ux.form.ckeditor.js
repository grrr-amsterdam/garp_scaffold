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

	var extraPlugins = 'charcount';

    // Load the garp content plugins for richwyswig editor types
    if (config.rich) {
        // Always load the images picker
        extraPlugins += ",garpimages";
        var richButtons = ["Garpimage"];

        // Only load the video picker when a VIDEO_WIDTH template is defined
        if (VIDEO_WIDTH) {
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
		if (this.maxLength && this.getCharCount() >= this.maxLength) {
			return false;
		}
        return true;
	},

	// Get char count, stripped of HTML tags
	getCharCount: function() {
		try {
			return this.editor.document.getBody().getText().length;
		} catch(e) {
			return this.getValue().replace(/(<([^>]+)>)/ig,"").length;
		}
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
