/*
* Cybozu Advance
*
* CBLabs.CybozuAdvance.Login class
*
* @requires jQuery v1.4.1 or later.
* @requires jQuery UI v1.8.6 or later.
* @requires cybozu-connect
*
* Copyright (C) 2011 Cybozu Labs, Inc.
* http://labs.cybozu.co.jp/
*
* Licensed under the GPL Version 2 license.
*/

var CBLabs = window.CBLabs || new Object;
if (!CBLabs.CybozuAdvance) { CBLabs.CybozuAdvance = {}; }

CBLabs.CybozuAdvance.Header = function (selector, options) {

    var url = options.url;

    // link to toppage
    var toppageLink = $("#toppage-link").attr("href", url).hover(function () { $(this).removeClass("ui-state-hover"); });
    if (url.indexOf("/grn.") >= 0) toppageLink.text("ポータル");

    // app
    var app = new CBLabs.CybozuConnect.App(url);

    // calendar
    var calendar = null;

    // login
    var login = new CBLabs.CybozuAdvance.Login({ app: app });
    login.init("#login-form", function () {
        $("#login-info-displayname").text(app.user.name);
        $("#personal-settings").css("display", "");
        if (app.isSSO()) {
            $("#logout").hide();
        } else {
            $("#logout").text("ログアウト");
        }

        var options = { app: app, elementId: "cal" };
        options.defaultView = localStorage.cybozuAdvanceCalDefaultView || "agendaWeek";

        var params = $.cybozuAdvance.hashToParams(location.hash);

        // page
        if (params.page) {
            switch (params.page) {
                case "cal-group-week":
                    options.defaultView = "basicWeek";
                    break;
                case "cal-month":
                    options.defaultView = "month";
                    break;
                case "cal-week":
                    options.defaultView = "agendaWeek";
                    break;
                case "cal-day":
                    options.defaultView = "agendaDay";
                    break;
            }
        }

        // date
        if (params.date) {
            options.date = $.cybozuConnect.parseXSDDate(params.date);
        }


        var start, end;
        if (params.event == "new" && params.start && params.end) {
            start = $.cybozuAdvance.parseUrlHashDateTime(params.start);
            end = $.cybozuAdvance.parseUrlHashDateTime(params.end);
            if (!options.date) options.date = start;
        }

        calendar = new CBLabs.CybozuAdvance.Calendar(options);
        calendar.initEvents();

        if (params.event == "new") {
            var allDay = (params.allDay == "true") ? true : false;
            calendar.openAddFormDialog(start, end, allDay, null, null);

        } else if (params.event) { // open event, if location.hash contains "event-(id)"
            var eventId = params.event;
            var pcal = $("#cal-personal");
            var events = pcal.fullCalendar("clientEvents", eventId);
            if (events && events.length) {
                var event;
                if (events.length > 1 && options.date) {
                    for (var i = 0; i < events.length; i++) {
                        if ($.cybozuConnect.equalDate(events[i].start, options.date)) {
                            event = events[i];
                            break;
                        }
                    }
                }
                if (!event) event = events[0];
                calendar.openViewDialog(event, pcal.fullCalendar("getView"));
            }
        }

        if (location.hash) {
            location.hash = "";
        }
    });

    // logout
    $("#logout").click(function () {
        $("#login-info-displayname").text("");
        $("#personal-settings").css("display", "none");
        $(this).text("ログイン");
        if (calendar) {
            calendar.clearStatus();
            calendar.destroy();
            calendar = null;
        }
        login.logout(true);
    }).hover(function () {
        $(this).addClass("ui-state-hover");
    }, function () {
        $(this).removeClass("ui-state-hover");
    });

    // personal-settings
    $("#personal-settings").click(function () {

        $("#cybozu-url").text(url);

        if (localStorage.cybozuAdvanceCalDefaultView) {
            $("#cal-default-view").val(localStorage.cybozuAdvanceCalDefaultView);
        } else {
            $("#cal-default-view").val("agendaWeek");
        }
        if (localStorage.cybozuAdvanceGcalFeed) {
            $("#gcal-feed").val(localStorage.cybozuAdvanceGcalFeed);
        } else {
            $("#gcal-feed").val("");
        }
        if (localStorage.cybozuAdvanceDndConfirm == "true") {
            $("#dnd-confirm").attr("checked", "checked");
        } else {
            $("#dnd-confirm").attr("checked", "");
        }

        var psDlg = $("#personal-settings-form").dialog({
            autoOpen: true,
            width: 500,
            modal: true,
            buttons: [
                {
                    text: "OK",
                    click: function () {
                        localStorage.cybozuAdvanceCalDefaultView = $("#cal-default-view").val();
                        localStorage.cybozuAdvanceGcalFeed = $("#gcal-feed").val();
                        localStorage.cybozuAdvanceDndConfirm = $("#dnd-confirm:checked").length ? "true" : "false";
                        psDlg.dialog("close");
                    }
                },
                {
                    text: "キャンセル",
                    click: function () {
                        psDlg.dialog("close");
                    }
                }
            ]
        });
    });
};
