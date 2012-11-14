/*
* jquery-groupedItemPicker v1.0.1
*
* @requires jQuery v1.4.1 or later.
* @required jquery-treeview-menu v1.0.0 or later
*
* Copyright (c) 2011 Cybozu Labs, Inc.
* http://labs.cybozu.co.jp/
*
* Licensed under the GPL Version 2 license.
*/

(function ($) {

    $.fn.groupedItemPicker = function (options) {

        if (groupedItemPickerMethods[options]) {
            return groupedItemPickerMethods[options].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (options && typeof options != "object") {
            $.error("Method " + options + " does not exists on groupedItemPicker.");
        }

        var settings = {
            width: "15em",
            size: 8,
            buttonWidth: "6em",
            searchBoxWidth: "9em",
            searchButtonWidth: "6em",
            addLabel: "&larr; Add",
            removeLabel: "Remove &rarr;",
            searchLabel: "Search",
            choiceDescription: "You can make multiple selections."
        };
        settings = $.extend(settings, options);

        var overPlus = settings.search ? 1 : 0;
        var resultSize = Math.max(settings.size, 4 + overPlus);
        var choiceSize = resultSize - 2 - overPlus;

        this.each(function () {
            $this = $(this);
            $this.empty();
            var html = '<table><tr valign="top"><td>\
<select class="gip-result" size="' + resultSize + '" multiple="multiple"></select>\
</td><td valign="middle">\
<input type="button" class="gip-add" value="' + settings.addLabel + '" style="width: ' + settings.buttonWidth + ';" /><br /><br />\
<input type="button" class="gip-remove" value="' + settings.removeLabel + '" style="width: ' + settings.buttonWidth + ';" />\
</td><td>' +
(settings.search ? ('<input type="text" class="gip-text" style="width: ' + settings.searchBoxWidth + '" />\
<input type="button" class="gip-search" value="' + settings.searchLabel + '" style="width: ' + settings.searchButtonWidth + '" /><br/>') : '') +
'<div class="gip-group"></div>\
<select class="gip-choice" size="' + choiceSize + '" multiple="multiple"></select><br />' + settings.choiceDescription +
'</td></tr></table>';
            $this.append(html);
            $this.find("input:text").addClass("ui-widget-content ui-corner-all");
            $this.find("select").addClass("ui-widget-content ui-corner-all").css("width", settings.width);
            $this.find("input:button").css("font-size", "smaller");

            //var picker = $("#" + baseId); // get by selector for used in event handler
            var picker = $this; // for used in event handler

            // group picker
            var groupPicker = $this.find(".gip-group");
            var groupPickerOptions = { width: settings.width, content: settings.content };
            if (settings.zIndex) groupPickerOptions.zIndex = settings.zIndex;
            groupPicker.treeviewMenu(groupPickerOptions);
            groupPicker.change(function () {
                picker.trigger("groupChange");
            });

            // search
            var searchButton = $this.find(".gip-search");
            searchButton.click(function () {
                picker.trigger("search");
            });
            $this.find(".gip-text").keypress(function (event) {
                if (event.which == "13") {
                    searchButton.click();
                }
            });

            // add button
            var addButton = $this.find(".gip-add");
            addButton.click(function () {
                var resultSelect = picker.find(".gip-result");
                picker.find(".gip-choice").children("option:selected").each(function () {
                    if (resultSelect.find('option[value="' + this.value + '"]').length == 0) {
                        appendOption(resultSelect, this.value, this.text);
                    }
                });
            });

            // remove button
            var removeButton = $this.find(".gip-remove");
            removeButton.click(function () {
                picker.find(".gip-result").find("option:selected").remove();
            });
        });

        return this;
    };

    var groupedItemPickerMethods = {
        clearChoice: function () {
            this.each(function () {
                $(".gip-choice", this).empty();
            });
            return this;
        },

        appendChoice: function (value, text) {
            if ($.isArray(value)) {
                this.each(function () {
                    var choice = $(".gip-choice", this);
                    for (var i = 0; i < value.length; i++) {
                        var item = value[i];
                        if (item) {
                            appendOption(choice, item.id, item.name);
                        }
                    }
                });
            } else if ($.isPlainObject(value) && value) {
                this.each(function () {
                    var choice = $(".gip-choice", this);
                    appendOption(choice, value.id, value.name);
                });
            } else {
                this.each(function () {
                    var choice = $(".gip-choice", this);
                    appendOption(choice, value, text);
                });
            }
            return this;
        },

        getGroup: function () {
            return $(".gip-group", this).treeviewMenu("getSelection");
        },

        getGroupValue: function () {
            var sel = $(".gip-group", this).treeviewMenu("getSelection");
            return sel ? sel.value : null;
        },

        setGroup: function (value, text) {
            this.each(function () {
                $(".gip-group", this).treeviewMenu("setSelection", { value: value, text: text });
            });
            return this;
        },

        getSearchText: function () {
            return $(".gip-text", this).val();
        },

        clearResult: function () {
            this.each(function () {
                $(".gip-result", this).empty();
            });
            return this;
        },

        getResultValues: function () {
            var result = new Array();
            $(".gip-result", this).find("option").each(function () {
                result[result.length] = $(this).attr("value");
            });
            return result;
        },

        appendResult: function (value, text) {
            if ($.isArray(value)) {
                this.each(function () {
                    var resultSelect = $(".gip-result", this);
                    for (var i = 0; i < value.length; i++) {
                        var item = value[i];
                        if (item) {
                            appendOption(resultSelect, item.id, item.name);
                        }
                    }
                });
            } else if ($.isPlainObject(value) && value) {
                this.each(function () {
                    var resultSelect = $(".gip-result", this);
                    appendOption(resultSelect, value.id, value.name);
                });
            } else {
                this.each(function () {
                    var resultSelect = $(".gip-result", this);
                    appendOption(resultSelect, value, text);
                });
            }
            return this;
        }
    };

    // private function

    function appendOption(select, value, text) {
        select.append('<option value="' + htmlEscape(value) + '">' + htmlEscape(text) + '</option>');
    }

    function htmlEscape(text) {
        return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

})(jQuery);
