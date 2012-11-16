/*
* Cybozu Advance
*
* utility functions as jquery plugins
*
* @requires jQuery v1.4.1 or later.
*
* Copyright (C) 2011 Cybozu Labs, Inc.
* http://labs.cybozu.co.jp/
*
* Licensed under the GPL Version 2 license.
*/

(function ($) {

    $.cybozuAdvance = {
        /// <summary>ユーティリティ関数</summary>

        appendOption: function (select, value, text) {
            if (text == null || text == undefined) {
                select.append('<option>' + $.cybozuConnect.htmlEscape(value) + '</option>');
            } else {
                select.append('<option value="' + $.cybozuConnect.htmlEscape(value) + '">' + $.cybozuConnect.htmlEscape(text) + '</option>');
            }
        },

        openConfirmDialog: function (options) {
            var settings = { title: "確認", message: "よろしいですか？", okCaption: "OK", cancelCaption: "キャンセル", width: 500 };
            settings = $.extend(settings, options);
            $("#simple-confirm-message").html(settings.message);
            $("#simple-confirm").dialog({
                autoOpen: true,
                width: settings.width,
                modal: true,
                title: settings.title,
                buttons: [
                    {
                        text: settings.okCaption,
                        click: function () {
                            $this = $(this);
                            if (settings.okHandler) {
                                if (settings.loadingMessage) {
                                    var $inner = $this.children(":first");
                                    $inner.hide();
                                    var $loading = $('<p style="text-align: center;"><img src="lib/cybozu-advance/images/loading.gif" /> ' + settings.loadingMessage + "</p>").appendTo($this);
                                    settings.okHandler();
                                    $loading.remove();
                                    $inner.show();
                                } else {
                                    settings.okHandler();
                                }
                            }
                            $this.dialog("close");
                        }
                    },
                    {
                        text: settings.cancelCaption,
                        click: function () {
                            if (settings.cancelHandler) settings.cancelHandler();
                            $(this).dialog("close");
                        }
                    }
                ]
            });
        },

        openLoadingDialog: function (title, message) {
            $("#simple-loading-message").html(message);
            $("#simple-loading").dialog({
                autoOpen: true,
                width: 300,
                height: 100,
                title: title
            });
        },

        closeLoadingDialog: function () {
            $("#simple-loading").dialog("close");
        },

        whileLoadingDialog: function (title, message, handler) {
            $.cybozuAdvance.openLoadingDialog(title, message);
            handler();
            $.cybozuAdvance.closeLoadingDialog();
        },

        hashToParams: function (hash) {
            var params = {};
            if (!hash) return params;
            var values = hash.replace("#", "").split(":");
            for (var i = 0; i < values.length; i++) {
                var value = values[i];
                var sep = value.indexOf("-");
                if (sep <= 0) continue;
                params[value.substring(0, sep)] = value.substring(sep + 1);
            }
            return params;
        },

        formatUrlHashDateTime: function (d) {
            var month = d.getMonth() + 1;
            return d.getFullYear() + "-" + month + "-" + d.getDate() + "-" + d.getHours() + "-" + d.getMinutes();
        },

        parseUrlHashDateTime: function (text) {
            var values = text.split("-");
            if (values.length < 5) throw "Invalid date time string.";
            return new Date(parseInt(values[0], 10), parseInt(values[1], 10) - 1, parseInt(values[2], 10), parseInt(values[3], 10), parseInt(values[4], 10));
        }
    };

})(jQuery);
