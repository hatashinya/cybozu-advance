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

CBLabs.CybozuAdvance.CalendarPortlet = function (options) {

    // private variables

    var _calendar = this;

    var app = options.app;
    var schedule = app.Schedule || new CBLabs.CybozuConnect.Schedule(app);

    var elementId = options.elementId;
    var selector = "#" + elementId;

    var calendarStart, calendarEnd;

    var personalCalendarId = elementId + "-personal";

    // initialized status
    var isGcalInitialized = false;

    var formatDateOptions = { dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"] };

    // public attributes

    this.Schedule = function () { return schedule; }

    this.Selector = function () { return selector; }

    // public methods

    this.clearStatus = function () {
        sessionStorage.scheduleDate = "";
    }

    function saveStatus(status) {
        if (status.view == "") {
            sessionStorage.scheduleView = "";
        }
        if (status.date) {
            sessionStorage.scheduleDate = $.cybozuConnect.formatXSDDate(status.date);
        }
    }

    function loadStatus() {
        var status = {};
        if (sessionStorage.scheduleDate) {
            status.date = $.cybozuConnect.parseXSDDate(sessionStorage.scheduleDate);
        }
        return status;
    }

    this.navigateTo = function (hash) {
        saveStatus({ view: "" });
        window.top.location.href = "./index.html#" + hash;
    }

    this.initCalendar = function () {

        // reset
        var container = $(selector);
        container.empty();

        // personal calendar
        container.append('<div id="' + personalCalendarId + '"></div>');
        var personalCalendar = $("#" + personalCalendarId);

        var status = loadStatus();
        var date = status.date || new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var calendarHeight = $(window).height() - 15;
        personalCalendar.fullCalendar({
            // Display Options
            header: { left: "", center: "title", right: "today prev,next" },
            defaultView: "agendaWeek",
            year: year,
            month: month,
            date: day,
            theme: true,
            height: calendarHeight,

            // Text/Time Customization
            timeFormat: "HH:mm{-HH:mm}",
            columnFormat: { month: "ddd", week: "M/d（ddd）", day: "yyyy 年 M 月 d 日 （ddd）" },
            titleFormat: { month: "yyyy 年 M 月", week: "yyyy 年 M 月", day: "yyyy 年 M 月 d 日 （ddd）" },
            buttonText: { today: "今日", month: "月", basicWeek: "グループ週", week: "週", day: "日" },
            dayNames: ["日", "月", "火", "水", "木", "金", "土"],
            dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],

            // Agenda Options
            allDayText: "終日",
            axisFormat: "H{:mm}",
            slotMinutes: 60,
            defaultEventMinutes: 60,
            firstHour: 8,

            // Event Handlers

            viewDisplay: function (view) {
                if (!calendarStart || !calendarEnd) { // necessary
                    return;
                }

                if (view.visStart < calendarStart || calendarEnd < view.visEnd) {
                    var currentDate = personalCalendar.fullCalendar("getDate");
                    saveStatus({ date: currentDate });
                    _calendar.initEvents();
                }
            },

            dayClick: function (date, allDay, jsEvent, view) {
            },

            selectable: true,
            selectHelper: true,
            unselectAuto: false,

            select: function (startDate, endDate, allDay, jsEvent, view) {
                if (!jsEvent) return;
                personalCalendar.fullCalendar("unselect");
                saveStatus({ view: "" });
                window.top.location.href = "./index.html#page-cal-week:event-new:start-" + $.cybozuAdvance.formatUrlHashDateTime(startDate) +
                    ":end-" + $.cybozuAdvance.formatUrlHashDateTime(endDate) + ":allDay-" + (allDay ? "true" : "false");
            },

            eventClick: function (event, jsEvent, view) {
                if (event.className == "event-gcal") {
                    window.top.location.href = event.url;
                    return false;
                } else {
                    saveStatus({ view: "" });
                    window.top.location.href = "./index.html#page-cal-week:date-" + $.cybozuConnect.formatXSDDate(event.start) + ":event-" + event.id;
                }
            },

            editable: true,

            eventDragStart: function (event, jsEvent, ui, view) {
                $(personalCalendar).fullCalendar("select", event.start, event.end, event.allDay);
                dragStart = ui.offset.top;
            },

            eventDragStop: function (event, jsEvent, ui, view) {
                if (Math.abs(ui.offset.top - dragStart) < 5) {
                    $(personalCalendar).fullCalendar("unselect");
                }
            },

            eventDrop: function (event, dayDelta, minuteDelta, allDay, revertFunc) {
                CBLabs.CybozuAdvance.CalendarDragDrop.moveOrResizeEvent(_calendar, event, dayDelta, minuteDelta, allDay, revertFunc, unselect, false);
            },

            eventResize: function (event, dayDelta, minuteDelta, revertFunc) {
                CBLabs.CybozuAdvance.CalendarDragDrop.moveOrResizeEvent(_calendar, event, dayDelta, minuteDelta, false, revertFunc, unselect, true);
            }
        });
    };

    this.initEvents = function () {
        var personalCalendar = $("#" + personalCalendarId);
        personalCalendar.fullCalendar("removeEvents");

        var view = personalCalendar.fullCalendar("getView");

        calendarStart = view.visStart;
        calendarEnd = view.visEnd;
        var events = schedule.getEventsByTarget({ start: calendarStart, end: calendarEnd, userId: app.userId });

        personalCalendar.fullCalendar("addEventSource", events);
        //this.putEvents(events, view);

        if (!isGcalInitialized && localStorage.cybozuAdvanceGcalFeed) {
            isGcalInitialized = true;
            personalCalendar.fullCalendar("addEventSource", $.fullCalendar.gcalFeed(localStorage.cybozuAdvanceGcalFeed, { className: "event-gcal", editable: false }));
        }
    };

    // initialize
    this.initCalendar();

    // private functions

    function unselect() {
        $("#" + personalCalendarId).fullCalendar("unselect");
    }
};
