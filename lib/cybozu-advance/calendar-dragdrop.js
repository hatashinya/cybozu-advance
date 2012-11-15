/*
* Cybozu Advance v1.1.3
*
* CBLabs.CybozuAdvance.Login class
*
* @requires jQuery v1.4.1 or later.
* @requires jQuery UI v1.8.6 or later.
* @requires FullCalendar v1.4.10 or later.
* @requires cybozu-connect
*
* Copyright (C) 2011 Cybozu Labs, Inc.
* http://labs.cybozu.co.jp/
*
* Licensed under the GPL Version 2 license.
*/

var CBLabs = window.CBLabs || new Object;
if (!CBLabs.CybozuAdvance) { CBLabs.CybozuAdvance = {}; }

CBLabs.CybozuAdvance.CalendarDragDrop = {

    moveOrResizeEvent: function (calendar, event, dayDelta, minuteDelta, allDay, revertFunc, unselectFunc, resize) {
        if (allDay && event.facilities && event.facilities.length) {
            alert("設備が含まれている予定は、終日予定にすることができません。");
            if (!resize) unselectFunc();
            revertFunc();
            return;
        }
        if (event.event_type == "repeat") {
            if (resize && event.start && event.end && !$.cybozuConnect.equalDate(event.start, event.end)) {
                alert("繰り返し予定は、日をまたがる予定にすることができません。");
                unselectFunc();
                revertFunc();
                return;
            }
            var formatDateOptions = { dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"] };
            var nextDate = new Date(event.start);
            var prevDate = $.cybozuConnect.incDate(nextDate, -dayDelta);
            var prefix = calendar.Selector() + "-modify";
            $(prefix + "-message").text("予定を変更する範囲を指定してください。");
            if ($.cybozuConnect.equalDate(prevDate, nextDate)) {
                $(prefix + "-this-date").text($.fullCalendar.formatDate(prevDate, "yyyy/MM/dd （ddd）", formatDateOptions));
            } else {
                $(prefix + "-this-date").text($.fullCalendar.formatDate(prevDate, "yyyy/MM/dd （ddd）", formatDateOptions) + " → " +
                    $.fullCalendar.formatDate(nextDate, "yyyy/MM/dd （ddd）", formatDateOptions));
            }
            $(prefix + "-after-date").text($.fullCalendar.formatDate(prevDate, "yyyy/MM/dd （ddd）", formatDateOptions));
            $(prefix + "-type-none").attr("checked", true);
            $(prefix + "-repeat-confirm").dialog({
                autoOpen: true,
                width: 500,
                modal: true,
                title: resize ? "繰り返し予定の時間変更" : "繰り返し予定の移動",
                buttons: {
                    "変更する": function () {
                        var type = $('[name="modify-type"]:checked', this).attr("value");
                        if (!type) {
                            alert("いずれかを選んでください。");
                            return;
                        }
                        $(this).dialog("close");
                        var e = {
                            id: event.id,
                            event_type: "repeat",
                            version: event.version,
                            public_type: event.public_type,
                            allDay: allDay,
                            start_only: false,
                            plan: event.plan,
                            detail: event.detail,
                            description: event.description,
                            users: event.users,
                            organizations: event.organizations,
                            facilities: event.facilities,
                            repeatInfo: {
                                type: event.repeatInfo.type,
                                day: nextDate.getDate(),
                                week: nextDate.getDay(),
                                start_date: event.repeatInfo.start_date
                            }
                        };
                        if (event.repeatInfo.end_date) {
                            var endDate = $.cybozuConnect.parseXSDDate(event.repeatInfo.end_date);
                            if (endDate.getTime() < nextDate.getTime()) {
                                e.repeatInfo.end_date = $.cybozuConnect.formatXSDDate(nextDate);
                            } else {
                                e.repeatInfo.end_date = event.repeatInfo.end_date;
                            }
                        }
                        if (type == "after") {
                            e.repeatInfo.start_date = $.cybozuConnect.formatXSDDate(nextDate);
                        }
                        if (!allDay) {
                            e.repeatInfo.start_time = $.cybozuConnect.formatXSDTime(event.start);
                            if (event.end) {
                                e.repeatInfo.end_time = $.cybozuConnect.formatXSDTime(event.end);
                            } else {
                                e.start_only = true;
                            }
                        }

                        // open loading dialog
                        var dlgTitle = resize ? "予定の時間変更" : "予定の移動";
                        var loadingMessage = resize ? "予定の時間を変更中です。" : "予定を移動中です。";
                        $.cybozuAdvance.openLoadingDialog(dlgTitle, loadingMessage);

                        var result = calendar.Schedule().modifyRepeatEvent(e, type, prevDate, nextDate);
                        if (!resize) unselectFunc();
                        if (result) {
                            calendar.initEvents();
                        } else {
                            revertFunc();
                        }

                        // close loading dialog
                        $.cybozuAdvance.closeLoadingDialog();
                    },
                    "キャンセル": function () {
                        $(this).dialog("close");
                        if (!resize) unselectFunc();
                        revertFunc();
                    }
                }
            });
        } else {
            var dlgTitle = resize ? "予定の時間変更" : "予定の移動";
            var dlgMessage = (resize ? "予定の時間を変更します。" : "予定を移動します。") + "よろしいですか？";
            var loadingMessage = resize ? "予定の時間を変更中です。" : "予定を移動中です。";
            if (localStorage.cybozuAdvanceDndConfirm == "true") {
                $.cybozuAdvance.openConfirmDialog({
                    title: dlgTitle,
                    message: dlgMessage,
                    loadingMessage: loadingMessage,
                    okHandler: function () {
                        CBLabs.CybozuAdvance.CalendarDragDrop.moveOrResizeNormalEvent(calendar, event, revertFunc, unselectFunc, resize, true);
                    },
                    cancelHandler: function () {
                        CBLabs.CybozuAdvance.CalendarDragDrop.moveOrResizeNormalEvent(calendar, event, revertFunc, unselectFunc, resize, false);
                    }
                });
            } else {
                $.cybozuAdvance.whileLoadingDialog(dlgTitle, loadingMessage, function () {
                    CBLabs.CybozuAdvance.CalendarDragDrop.moveOrResizeNormalEvent(calendar, event, revertFunc, unselectFunc, resize, true);
                });
            }
        }
    },

    moveOrResizeNormalEvent: function (calendar, event, revertFunc, unselectFunc, resize, confirm) {
        var result;
        if (confirm) {
            result = calendar.Schedule().modifyEvent(event);
        }
        if (!resize) unselectFunc();
        if (!result) revertFunc();
    }
};
