/*
* Cybozu Advance v1.1.3
*
* CBLabs.CybozuAdvance.Calendar class
*
* @requires jQuery v1.4.1 or later.
* @requires jQuery UI v1.8.6 or later.
* @requires FullCalendar v1.4.10 or later.
* @requires cybozu-connect
* @requires jquery-groupedItemPicker
* @requires jquery-timeRangePicker
* @requires jquery-treeview-menu
*
* Copyright (C) 2011 Cybozu Labs, Inc.
* http://labs.cybozu.co.jp/
*
* Licensed under the GPL Version 2 license.
*/

var CBLabs = window.CBLabs || new Object;
if (!CBLabs.CybozuAdvance) { CBLabs.CybozuAdvance = {}; }

CBLabs.CybozuAdvance.Calendar = function (options) {

    // private variables

    var _calendar = this;

    var app = options.app;
    var schedule = app.Schedule || new CBLabs.CybozuConnect.Schedule(app);

    var elementId = options.elementId;
    var selector = "#" + elementId;
    var formSelector = "#" + elementId + "-form";
    var viewSelector = "#" + elementId + "-view";

    var calendarStart, calendarEnd;
    var currentOrg;
    var currentOffset;
    var currentLimit;
    var currentMax;

    var personalCalendarId = elementId + "-personal";
    var groupCalendarHeaderId = elementId + "-header";

    // initialized status
    var isFormInitialized = false;
    var isViewInitialized = false;
    var isGcalInitialized = false;

    var formatDateOptions = { dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"] };

    // initialize at end of the class definition

    // public attributes

    this.Schedule = function () { return schedule; }

    this.Selector = function () { return selector; }

    this.PersonalCalendarId = function () { return personalCalendarId; }

    // public methods

    this.init = function () {
        var status = loadStatus();
        status.view = status.view || options.defaultView || "agendaWeek";
        status.date = status.date || options.date || new Date();
        saveStatus(status);
        if (status.view == "basicWeek") {
            this.initGroupCalendar(status);
        } else {
            this.initPersonalCalendar(status);
        }
        CBLabs.CybozuAdvance.LastCalendar = this;
    };

    this.clearStatus = function () {
        sessionStorage.scheduleView = "";
        sessionStorage.scheduleDate = "";
    }

    function saveStatus(status) {
        sessionStorage.scheduleView = status.view;
        if (status.date) {
            sessionStorage.scheduleDate = $.cybozuConnect.formatXSDDate(status.date);
        }
    }

    function loadStatus() {
        var status = { view: sessionStorage.scheduleView };
        if (sessionStorage.scheduleDate) {
            status.date = $.cybozuConnect.parseXSDDate(sessionStorage.scheduleDate);
        }
        return status;
    }

    this.initEvents = function () {
        if (sessionStorage.scheduleView == "basicWeek") {
            this.initGroupEvents();
        } else {
            this.initPersonalEvents();
        }
    };

    this.destroy = function () {
        if (sessionStorage.scheduleView == "basicWeek") {
            currentOrg = null;
            $("#" + groupCalendarHeaderId).fullCalendar("destroy");
            $(".user-calendar").fullCalendar("destory");
        } else {
            $("#" + personalCalendarId).fullCalendar("destroy");
        }
        $(selector).empty();
    };

    this.initPersonalCalendar = function (viewOptions) {

        // reset
        var container = $(selector);
        container.empty();

        // personal calendar
        container.append('<div id="' + personalCalendarId + '"></div>');
        var personalCalendar = $("#" + personalCalendarId);

        var dragStart;

        var defaultView = viewOptions.view || "agendaWeek";
        var date = viewOptions.date || new Date();
        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var calendarHeight = $(window).height() - 70;
        personalCalendar.fullCalendar({
            // Display Options
            header: { left: "basicWeek,month,agendaWeek,agendaDay", center: "title", right: "today prev,next" },
            defaultView: defaultView,
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
            slotMinutes: 30,
            defaultEventMinutes: 30,
            firstHour: 8,

            // Event Handlers

            viewDisplay: function (view) {
                if (!calendarStart || !calendarEnd) { // necessary
                    return;
                }

                var currentDate = personalCalendar.fullCalendar("getDate");

                if (view.name == "basicWeek") {
                    personalCalendar.fullCalendar("destroy");
                    personalCalendar.remove();
                    personalCalendar = null;
                    isGcalInitialized = false;
                    _calendar.initGroupCalendar({ date: currentDate });
                    _calendar.initGroupEvents();
                } else {
                    saveStatus({ view: view.name, date: currentDate });
                    if (view.visStart < calendarStart || calendarEnd < view.visEnd) {
                        _calendar.initPersonalEvents();
                    }
                }
            },

            dayClick: function (date, allDay, jsEvent, view) {
                //_calendar.openAddFormDialog(date, allDay, view, this);
            },

            selectable: true,
            selectHelper: true,
            unselectAuto: false,

            select: function (startDate, endDate, allDay, jsEvent, view) {
                if (!jsEvent) return;
                _calendar.openAddFormDialog(startDate, endDate, allDay, view, this);
                personalCalendar.fullCalendar("unselect");
            },

            eventClick: function (event, jsEvent, view) {
                if (event.className != "event-gcal") {
                    _calendar.openViewDialog(event, view);
                }
            },

            editable: true,

            eventDragStart: function (event, jsEvent, ui, view) {
                personalCalendar.fullCalendar("select", event.start, event.end, event.allDay);
                dragStart = ui.offset.top;
            },

            eventDragStop: function (event, jsEvent, ui, view) {
                if (Math.abs(ui.offset.top - dragStart) < 5) {
                    personalCalendar.fullCalendar("unselect");
                }
            },

            eventDrop: function (event, dayDelta, minuteDelta, allDay, revertFunc) {
                CBLabs.CybozuAdvance.CalendarDragDrop.moveOrResizeEvent(_calendar, event, dayDelta, minuteDelta, allDay, revertFunc, unselect, false);
            },

            eventResize: function (event, dayDelta, minuteDelta, revertFunc) {
                CBLabs.CybozuAdvance.CalendarDragDrop.moveOrResizeEvent(_calendar, event, dayDelta, minuteDelta, false, revertFunc, unselect, true);
            },

            eventRender: function (event, element, view) {
                if (event.public_type == "private") {
                    $('span.fc-event-title', element).append('（非公開）');
                }
            }
        });
    };

    function unselect() {
        $("#" + personalCalendarId).fullCalendar("unselect");
    }

    this.initPersonalEvents = function () {
        var personalCalendar = $("#" + personalCalendarId);
        personalCalendar.fullCalendar("removeEvents");

        $.cybozuAdvance.openLoadingDialog("", "読み込み中");

        var view = personalCalendar.fullCalendar("getView");

        calendarStart = view.visStart;
        calendarEnd = view.visEnd;
        var events = schedule.getEventsByTarget({ start: calendarStart, end: calendarEnd, userId: app.userId });

        //personalCalendar.fullCalendar("addEventSource", events);
        this.putEvents(events, view);

        if (!isGcalInitialized && localStorage.cybozuAdvanceGcalFeed) {
            isGcalInitialized = true;
            personalCalendar.fullCalendar("addEventSource", $.fullCalendar.gcalFeed(localStorage.cybozuAdvanceGcalFeed, { className: "event-gcal", editable: false }));
        }

        $.cybozuAdvance.closeLoadingDialog();
    };

    this.initGroupCalendar = function (viewOptions) {

        // reset
        var container = $(selector);
        container.empty();

        var date = viewOptions.date || new Date();
        var org = app.Base.primaryOrganization(app.userId, false);

        this.createGroupHeader(date);
        this.createGroupChanger(org);
        container.append('<div id="' + elementId + '-calendars"></div>');
        this.createGroupPager();
        this.changeGroupCalendar(org, date);
    };

    this.createGroupHeader = function (date) {

        // header
        var container = $(selector);
        container.append('<div id="' + groupCalendarHeaderId + '"></div>');
        var groupCalendarHeader = $("#" + groupCalendarHeaderId);

        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();

        groupCalendarHeader.fullCalendar({
            // Display Options
            header: { left: "basicWeek,month,agendaWeek,agendaDay", center: "title", right: "today prev,next" },
            defaultView: "basicWeek",
            year: year,
            month: month,
            date: day,
            theme: true,
            height: 30,

            // Text/Time Customization
            timeFormat: "HH:mm{-HH:mm}",
            columnFormat: { month: "ddd", week: "M/d（ddd）", day: "yyyy 年 M 月 d 日 （ddd）" },
            titleFormat: { month: "yyyy 年 M 月", week: "yyyy 年 M 月", day: "yyyy 年 M 月 d 日 （ddd）" },
            buttonText: { today: "今日", month: "月", basicWeek: "グループ週", week: "週", day: "日" },
            dayNames: ["日", "月", "火", "水", "木", "金", "土"],
            dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],

            viewDisplay: function (view) {
                if (!calendarStart || !calendarEnd) { // necessary
                    return;
                }

                // get current date from header
                var currentDate = groupCalendarHeader.fullCalendar("getDate");
                var status = { view: view.name, date: currentDate };

                if (view.name != "basicWeek") {
                    currentOrg = null;
                    // destroy header and user calendars
                    groupCalendarHeader.fullCalendar("destroy");
                    groupCalendarHeader = null;
                    $(".user-calendar").fullCalendar("destroy");
                    container.empty();
                    _calendar.initPersonalCalendar(status);
                    _calendar.initPersonalEvents();
                } else {
                    saveStatus(status);
                    // set current date to user calenders
                    $(".user-calendar").fullCalendar("gotoDate", currentDate);
                    if (view.visStart < calendarStart || calendarEnd < view.visEnd) {
                        _calendar.initGroupEvents();
                    }
                }
            }
        });
        groupCalendarHeader.find(".fc-content").hide();
    };

    this.createGroupChanger = function (org) {

        var container = $(selector);
        var changerId = elementId + "-changer";
        container.append('<div id="' + changerId + '" style="margin-bottom: 1em;"></div><div style="clear: both; padding: 2px;"></div>');
        //container.append('<div id="' + changerId + '" style="display:inline; margin-bottom: 1em;"></div>');

        var changer = $("#" + changerId);
        changer.organizationPicker({ app: app, includeAll: true });
        changer.organizationPicker("setOrganization", org ? org : '0');
        changer.change(function () {
            var orgId = $(this).organizationPicker("getOrganizationId");
            var org = (!orgId || orgId == "0") ? null : app.Base.organization(orgId);

            var groupCalendarHeader = $("#" + groupCalendarHeaderId);
            var date = groupCalendarHeader.fullCalendar("getDate");
            _calendar.changeGroupCalendar(org, date);
            _calendar.initGroupEvents();
        });
    };

    this.changeGroupCalendar = function (org, date) {

        currentOrg = org;
        currentOffset = 0;
        currentLimit = Math.max(3, Math.floor(($(window).height() - 150) / 120));
        currentMax = 0;
        if (currentOrg) {
            if (currentOrg.userIdList) {
                currentMax = currentOrg.userIdList.length;
            }
        } else {
            var userList = app.Base.userList();
            if (userList) {
                currentMax = userList.length;
            }
        }
        $(selector + "-start").button("disable");
        $(selector + "-prev").button("disable");
        if (currentLimit < currentMax) {
            $(selector + "-next").button("enable");
        } else {
            $(selector + "-next").button("disable");
        }

        this.recreateUserCalendars(date);
    };

    this.recreateUserCalendars = function (date) {

        var year = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();

        var calendars = $("#" + elementId + "-calendars");

        $(".user-calendar").fullCalendar("removeEvents").fullCalendar("destroy").remove();
        $(".user-calendar-header").remove();

        function appendUserCalendarContainer(user) {
            if (!user) return;
            var headerId = userCalendarHeaderId(user.id);
            calendars.append('<div id="' + headerId + '" class="user-calendar-header"><span class="user-calendar-name">' + $.cybozuConnect.htmlEscape(user.name) + '</span></div>');
            var calId = userCalendarId(user.id);
            calendars.append('<div id="' + calId + '" class="user-calendar"></div>');
        }

        if (currentOrg) {
            for (var i = 0; i < currentOrg.userIdList.length; i++) {
                if (currentOffset <= i && i < currentOffset + currentLimit) {
                    var userId = currentOrg.userIdList[i];
                    var user = app.Base.user(userId);
                    appendUserCalendarContainer(user);
                }
            }
        } else {
            var userList = app.Base.userList();
            if (userList) {
                for (var i = 0; i < userList.length; i++) {
                    if (currentOffset <= i && i < currentOffset + currentLimit) {
                        appendUserCalendarContainer(userList[i]);
                    }
                }
            }
        }

        // user calendars
        $(".user-calendar").fullCalendar({
            // Display Options
            header: false,
            defaultView: "basicWeek",
            year: year,
            month: month,
            date: day,
            theme: true,
            height: 100,

            // Text/Time Customization
            timeFormat: "HH:mm{-HH:mm}",
            columnFormat: { month: "ddd", week: "M/d（ddd）", day: "yyyy 年 M 月 d 日 （ddd）" },
            //titleFormat: { month: "yyyy 年 M 月", week: "yyyy 年 M 月", day: "yyyy 年 M 月 d 日 （ddd）" },
            //buttonText: { today: "今日", month: "月", basicWeek: "グループ週", week: "週", day: "日" },
            dayNames: ["日", "月", "火", "水", "木", "金", "土"],
            dayNamesShort: ["日", "月", "火", "水", "木", "金", "土"],

            dayClick: function (date, allDay, jsEvent, view) {
                //_calendar.openAddFormDialog(date, date, allDay, view, this);
            },

            selectable: true,
            selectHelper: true,

            select: function (startDate, endDate, allDay, jsEvent, view) {
                _calendar.openAddFormDialog(startDate, endDate, allDay, view, this);
            },

            eventClick: function (event, jsEvent, view) {
                _calendar.openViewDialog(event, view);
            },

            eventRender: function (event, element, view) {
                if (event.public_type == "private") {
                    $('span.fc-event-title', element).append('（非公開）');
                }
            }
        });
    };

    this.createGroupPager = function () {
        var container = $(selector);
        container.append('<div><button id="' + elementId + '-start"></button><button id="' + elementId + '-prev"></button><button id="' + elementId + '-next"></button></div>');
        $(selector + "-start").button({
            label: "先頭へ",
            icons: {
                primary: "ui-icon-seek-start"
            }

        }).click(function () {
            if (currentOffset == 0) return;
            currentOffset = 0;
            changePage();
            $(this).button("disable");
            $(selector + "-prev").button("disable");
            $(selector + "-next").button("enable");

        }).addClass("ui-widget-content ui-corner-all");
        $(selector + "-prev").button({
            label: "前へ",
            icons: {
                primary: "ui-icon-seek-prev"
            }
        }).click(function () {
            if (currentOffset == 0) return;
            currentOffset = Math.max(0, currentOffset - currentLimit);
            changePage();
            if (currentOffset == 0) {
                $(this).button("disable");
                $(selector + "-start").button("disable");
            }
            $(selector + "-next").button("enable");

        }).addClass("ui-widget-content ui-corner-all");
        $(selector + "-next").button({
            label: "次へ",
            icons: {
                primary: "ui-icon-seek-next"
            }
        }).click(function () {
            if (currentOffset + currentLimit >= currentMax) return;
            currentOffset += currentLimit;
            changePage();
            $(selector + "-start").button("enable");
            $(selector + "-prev").button("enable");
            if (currentOffset + currentLimit >= currentMax) {
                $(this).button("disable");
            }

        }).addClass("ui-widget-content ui-corner-all");
    };

    function changePage() {
        var date = $("#" + groupCalendarHeaderId).fullCalendar("getDate");
        _calendar.recreateUserCalendars(date);
        _calendar.initGroupEvents();
    }

    this.initGroupEvents = function () {
        $(".user-calendar").fullCalendar("removeEvents");

        $.cybozuAdvance.openLoadingDialog("", "読み込み中");

        var groupCalendarHeader = $("#" + groupCalendarHeaderId);
        var view = groupCalendarHeader.fullCalendar("getView");

        calendarStart = view.visStart;
        calendarEnd = view.visEnd;

        var options = { start: calendarStart, end: calendarEnd, orgIdList: new Array(), userIdList: new Array(), facilityIdList: new Array() };
        if (currentOrg) {
            for (var i = 0; i < currentOrg.userIdList.length; i++) {
                if (currentOffset <= i && i < currentOffset + currentLimit) {
                    options.userIdList[options.userIdList.length] = currentOrg.userIdList[i];
                }
            }
        } else {
            var userList = app.Base.userList();
            if (userList) {
                for (var i = 0; i < userList.length; i++) {
                    if (currentOffset <= i && i < currentOffset + currentLimit) {
                        options.userIdList[options.userIdList.length] = userList[i].id;
                    }
                }
            }
        }

        var events = schedule.getEvents(options);
        for (var i = 0; i < options.userIdList.length; i++) {
            var id = options.userIdList[i];
            var calId = userCalendarId(id);
            $("#" + calId).fullCalendar("addEventSource", events.users[id]);
        }

        $.cybozuAdvance.closeLoadingDialog();
    };

    this.putEvents = function (events, view) {
        if (!events) return;

        if (!view || view.name != "basicWeek") {
            // personal calendar
            $("#" + personalCalendarId).fullCalendar("addEventSource", events);
        } else {
            for (var i = 0; i < events.length; i++) {
                this.putEvent(events[i], view);
            }
        }
    };

    this.putEvent = function (event, view) {
        var events = new Array();
        events[0] = event;
        if (!view || view.name != "basicWeek") {
            $("#" + personalCalendarId).fullCalendar("addEventSource", events);
        } else {
            for (var i = 0; i < event.users.length; i++) {
                var userId = event.users[i].id;
                if (!currentOrg || $.inArray(userId, currentOrg.userIdList) >= 0) {
                    var calId = userCalendarId(userId);
                    $("#" + calId).fullCalendar("addEventSource", events);
                }
            }
        }
    };

    this.removeEvent = function (eventId, view) {
        if (!view || view.name != "basicWeek") {
            $("#" + personalCalendarId).fullCalendar("removeEvents", eventId);
        } else {
            $(".user-calendar").fullCalendar("removeEvents", eventId);
        }
    };

    this.leaveEvent = function (eventId, view) {
        if (!view || view.name != "basicWeek") {
            $("#" + personalCalendarId).fullCalendar("removeEvents", eventId);
        } else {
            $("#" + userCalendarId(app.userId)).fullCalendar("removeEvents", eventId);
        }
    };

    this.initFormDialog = function () {
        prefix = formSelector;
        var datePickerOptions = { dateFormat: "yy/mm/dd", showOn: "both", buttonImage: "lib/cybozu-advance/images/calendarPicker20.gif", buttonImageOnly: true };
        $(prefix + "-date").datepicker(datePickerOptions);
        $(prefix + "-time").timeRangePicker({ timeSeparator: "：", rangeSeparator: "～" });
        $(prefix + "-start-date").datepicker(datePickerOptions);
        $(prefix + "-end-date").datepicker(datePickerOptions);
        $(prefix + "-start-time").timePicker({ timeSeparator: ":" });
        $(prefix + "-end-time").timePicker({ timeSeparator: ":" });
        $(prefix + "-banner-start-date").datepicker(datePickerOptions);
        $(prefix + "-banner-end-date").datepicker(datePickerOptions);
        $(prefix + "-modify-date").datepicker(datePickerOptions);
        $(prefix + "-repeat-start-date").datepicker(datePickerOptions);
        $(prefix + "-repeat-end-date").datepicker(datePickerOptions);
        $(prefix + "-repeat-time").timeRangePicker({ timeSeparator: ":", rangeSeparator: "～" });

        initPlanMenu(prefix);

        $(prefix + "-members").peoplePicker({ app: app, zIndex: 100, showGroup: schedule.systemProfile().show_group_event() }).find("select").css("font-family", "monospace");
        $(prefix + "-facilities").facilityPicker({ app: app, zIndex: 90 });

        $(prefix + "-modify-date").change(function () {
            $(prefix + "-modify-type-one").get(0).checked = true;
            $(prefix + "-repeat-start-date").datepicker("disable");
            $(prefix + "-repeat-end-date").datepicker("disable");
        });

        $(prefix + "-modify-type-one").change(function () {
            if (this.checked) {
                $(prefix + "-repeat-start-date").datepicker("disable");
                $(prefix + "-repeat-end-date").datepicker("disable");
            }
        });

        $(prefix + "-modify-type-after").change(function () {
            if (this.checked) {
                $(prefix + "-repeat-start-date").datepicker("disable");
                $(prefix + "-repeat-end-date").datepicker("enable");
                $(prefix + "-repeat-start-date").datepicker("setDate", $(prefix + "-modify-type").data("baseDate"));
            }
        });

        $(prefix + "-modify-type-all").change(function () {
            if (this.checked) {
                $(prefix + "-repeat-start-date").datepicker("enable");
                $(prefix + "-repeat-end-date").datepicker("enable");
                $(prefix + "-repeat-start-date").datepicker("setDate", $.cybozuConnect.parseXSDDate($(prefix + "-modify-type").data("start_date")));
            }
        });

        // delivering variables when tab changed
        $(prefix + "-tabs").tabs({
            select: function (event, ui) {
                var prevTab = $(this).tabs("option", "selected");
                var nextTab = ui.index;
                if (prevTab == nextTab) return;

                var startDate, endDate, startTime, endTime;

                // from
                if (prevTab == 0) { // normal
                    startDate = endDate = $(prefix + "-date").datepicker("getDate");
                    if (startDate) {
                        startTime = $(prefix + "-time").timeRangePicker("getStartTime", startDate);
                        endTime = $(prefix + "-time").timeRangePicker("getEndTime", endDate);
                    }
                } else if (prevTab == 1) { // long
                    startDate = $(prefix + "-start-date").datepicker("getDate");
                    if (startDate) {
                        startTime = $(prefix + "-start-time").timePicker("getTime", startDate);
                    }
                    endDate = $(prefix + "-end-date").datepicker("getDate");
                    if (endDate) {
                        endTime = $(prefix + "-end-time").timePicker("getTime", endDate);
                    }
                } else if (prevTab == 2) { // banner
                    startDate = $(prefix + "-banner-start-date").datepicker("getDate");
                    endDate = $(prefix + "-banner-end-date").datepicker("getDate");
                } else if (prevTab == 3) { // repeat
                    startDate = endDate = $(prefix + "-repeat-start-date").datepicker("getDate");
                    if (startDate) {
                        startTime = $(prefix + "-repeat-time").timeRangePicker("getStartTime", startDate);
                        endTime = $(prefix + "-repeat-time").timeRangePicker("getEndTime", endDate);
                    }
                }

                if (nextTab == 2) { // to banner
                    $(prefix + "-facilities-field").hide();
                } else if (prevTab == 2) { // from banner
                    $(prefix + "-facilities-field").show();
                }

                if (!startDate) return;

                var startHours, startMinutes, endHours, endMinutes;
                if (startTime) {
                    startHours = startTime.getHours();
                    startMinutes = startTime.getMinutes();
                    endHours = Math.min(23, startHours + 1);
                    endMinutes = startMinutes;

                    if (endTime) {
                        if ($.cybozuConnect.equalDate(startDate, endDate) && startTime.getTime() <= endTime.getTime()) {
                            endHours = endTime.getHours();
                            endMinutes = endTime.getMinutes();
                        }
                    }
                }

                // to
                if (nextTab == 0) { // normal
                    $(prefix + "-date").datepicker("setDate", startDate);
                    if (startTime) {
                        $(prefix + "-time").timeRangePicker("setTimeRange", startHours, startMinutes, endHours, endMinutes);
                    }
                } else if (nextTab == 1) { // long
                    $(prefix + "-start-date").datepicker("setDate", startDate);
                    $(prefix + "-end-date").datepicker("setDate", endDate);
                    if (startTime) {
                        $(prefix + "-start-time").timePicker("setTime", startHours, startMinutes);
                        $(prefix + "-end-time").timePicker("setTime", endHours, endMinutes);
                    }
                } else if (nextTab == 2) { // banner
                    $(prefix + "-banner-start-date").datepicker("setDate", startDate);
                    $(prefix + "-banner-end-date").datepicker("setDate", endDate);
                } else if (nextTab == 3) { // repeat
                    $(prefix + "-repeat-start-date").datepicker("setDate", startDate);
                    var repeatEndDate = get3MonthAfter(startDate);
                    $(prefix + "-repeat-end-date").datepicker("setDate", repeatEndDate);
                    if (startTime) {
                        $(prefix + "-repeat-time").timeRangePicker("setTimeRange", startHours, startMinutes, endHours, endMinutes);
                    }

                    $(prefix + "-week").val(startDate.getDay());
                    $(prefix + "-day").val(startDate.getDate());
                }
            }
        }).css("border", "0");
    };

    this.openAddFormDialog = function (start, end, allDay, view, cell) {

        if (!view) {
            if (sessionStorage.scheduleView == "basicWeek") {
                view = $("#" + groupCalendarHeaderId).fullCalendar("getView");
            } else {
                view = $("#" + personalCalendarId).fullCalendar("getView");
            }
        }

        var loading = false;
        if (!isFormInitialized) {
            $.cybozuAdvance.openLoadingDialog("予定の登録", "準備中です。");
            loading = true;
            this.initFormDialog();
            isFormInitialized = true;
        }

        var dialogWidth = $(window).width() * 0.80;
        var dialogHeight = $(window).height() * 0.95;

        // initialize event form dialog
        var prefix = formSelector;
        $(prefix).dialog({
            autoOpen: false,
            width: dialogWidth,
            height: dialogHeight,
            modal: true,
            title: "予定の登録",
            buttons: [
                {
                    text: "OK",
                    click: function () {
                        var event;

                        var prefix = formSelector;
                        var tab = $(prefix + "-tabs").tabs("option", "selected");
                        if (tab == 0) { // normal
                            event = setShortTimeRange();

                        } else if (tab == 1) { // long
                            event = setLongTimeRange();

                        } else if (tab == 2) { // banner
                            event = setBannerDateRange();

                        } else if (tab == 3) { // repeat
                            event = setRepeatCondition(null, null);

                        } else { // unexpected
                            return;
                        }

                        if (!event) return;

                        setEventInformationFromForm(event);

                        $.cybozuAdvance.whileLoadingDialog("予定の登録", "予定を登録中です。", function () {
                            var events = schedule.addEvent(event, view.visStart, view.visEnd);
                            if (events) {
                                _calendar.putEvents(events, view);
                                CBLabs.CybozuAdvance.LastInsertEvents = events;
                            }
                        });
                        $(this).dialog("close");
                    }
                },
                {
                    text: "キャンセル",
                    click: function () {
                        $(this).dialog("close");
                    }
                }
            ]
        });

        // tab/date/time
        var tabs = $(prefix + "-tabs").tabs("option", "disabled", []);
        var overDay = ($.cybozuConnect.compareDate(start, end) != 0);
        if (allDay && overDay) { // banner tab
            // tab
            tabs.tabs("select", 2);

            // date
            $(prefix + "-banner-start-date").datepicker("setDate", new Date(start));
            $(prefix + "-banner-end-date").datepicker("setDate", new Date(end));

            // time (clear)
            $(prefix + "-time").timeRangePicker("clearTimeRange");
            $(prefix + "-start-time").timePicker("clearTime");
            $(prefix + "-end-time").timePicker("clearTime");
        } else if (overDay) { // long tab
            // tab
            tabs.tabs("select", 1);

            // date
            $(prefix + "-start-date").datepicker("setDate", new Date(start));
            $(prefix + "-end-date").datepicker("setDate", new Date(end));

            // time
            $(prefix + "-start-time").timePicker("setTime", start.getHours(), start.getMinutes());
            $(prefix + "-end-time").timePicker("setTime", end.getHours(), end.getMinutes());

        } else { // normal tab
            // tab
            tabs.tabs("select", 0);

            // date
            $(prefix + "-date").datepicker("setDate", new Date(start));

            // time
            if (allDay) {
                $(prefix + "-time").timeRangePicker("clearTimeRange");
            } else {
                $(prefix + "-time").timeRangePicker("setTimeRange", start.getHours(), start.getMinutes(), end.getHours(), end.getMinutes());
            }
        }

        // hide repeat modify type
        $(prefix + "-modify-type").hide();

        // reset repeat type
        $(prefix + "-repeat-type-week").get(0).checked = true;
        $(prefix + "-week-type").val("week");

        // plan
        var plan = $(prefix + "-plan");
        var firstOption = plan.children().first();
        if (firstOption.val()) {
            firstOption.remove();
        }
        plan.attr("selectedIndex", 0);

        // detail
        $(prefix + "-detail").val("");

        // memo
        $(prefix + "-memo").val("");

        // members
        var members = $(prefix + "-members");
        members.groupedItemPicker("clearResult");
        if (view.name != "basicWeek") {
            var user = app.Base.user(app.userId);
            members.peoplePicker("appendResult", user);
        } else if (cell) {
            var calId = $(cell).parents(".user-calendar").attr("id");
            if (calId) {
                var vals = calId.split("-");
                var id = vals[vals.length - 1];
                var user = app.Base.user(id);
                if (user) {
                    members.peoplePicker("appendResult", user);
                } else {
                    var org = app.Base.organization(id);
                    if (org) {
                        members.peoplePicker("appendResult", org, true);
                    }
                }
            }
        }
        members.peoplePicker("setOrganization", app.Base.primaryOrganization(app.userId, true));

        // facilities
        var facilities = $(prefix + "-facilities");
        facilities.groupedItemPicker("clearResult");
        var facilityGroupList = schedule.facilityGroupList();
        if (facilityGroupList && facilityGroupList.length) {
            facilities.facilityPicker("setFacilityGroup", facilityGroupList[0]); // first facility
        } else {
            facilities.facilityPicker("setFacilityGroup", "0"); // all facilities
        }

        if (loading) {
            $.cybozuAdvance.closeLoadingDialog();
        }

        // open event form dialog
        $(prefix).dialog("open");
        $(prefix + "-title").focus();
    };

    this.openModifyFormDialog = function (event, view) {

        var loading = false;
        if (!isFormInitialized) {
            $.cybozuAdvance.openLoadingDialog("予定の変更", "準備中です。");
            loading = true;
            this.initFormDialog();
            isFormInitialized = true;
        }

        var dialogWidth = $(window).width() * 0.80;
        var dialogHeight = $(window).height() * 0.95;

        var prefix = formSelector;

        // tab
        var tabIndex;
        var tabs = $(prefix + "-tabs").tabs("option", "disabled", []);
        if (event.event_type == "normal") {
            if (!event.end || $.cybozuConnect.equalDate(event.start, event.end)) {
                tabIndex = 0;
            } else {
                tabIndex = 1;
            }
            tabs.tabs("select", tabIndex).tabs("option", "disabled", [2, 3]);
        } else if (event.event_type == "banner") {
            tabIndex = 2;
            tabs.tabs("select", 2).tabs("option", "disabled", [0, 1, 3]);
        } else if (event.event_type == "repeat") {
            tabIndex = 3;
            tabs.tabs("select", 3).tabs("option", "disabled", [0, 1, 2]);
        } else {
            // unexpected
            return;
        }

        var baseDate = new Date(event.start); // also used in dialog

        // initialize event form dialog
        $(prefix).dialog({
            autoOpen: false,
            width: dialogWidth,
            height: dialogHeight,
            modal: true,
            title: "予定の変更",
            buttons: [
                {
                    text: "OK",
                    click: function () {
                        var e;

                        var prefix = formSelector;
                        var tab = $(prefix + "-tabs").tabs("option", "selected");
                        var modifyType, modifyDate;
                        if (tab == 0) { // normal
                            e = setShortTimeRange();

                        } else if (tab == 1) { // long
                            e = setLongTimeRange();

                        } else if (tab == 2) { // banner
                            e = setBannerDateRange();

                        } else if (tab == 3) { // repeat
                            if ($(prefix + "-modify-type-this:checked").length) {
                                modifyType = "this";
                                modifyDate = $(prefix + "-modify-date").datepicker("getDate");
                                if (!modifyDate) {
                                    alert("変更先の日付を指定してください。");
                                }
                            } else if ($(prefix + "-modify-type-after:checked").length) {
                                modifyType = "after";
                                modifyDate = baseDate;
                            } else if ($(prefix + "-modify-type-all:checked").length) {
                                modifyType = "all";
                            } else {
                                alert("条件を選択してください。");
                                return;
                            }

                            e = setRepeatCondition(modifyType, modifyDate);

                        } else { // unexpected
                            return;
                        }

                        if (!e) return;

                        e.id = event.id;
                        e.version = event.version;
                        e.public_type = event.public_type;

                        setEventInformationFromForm(e);

                        $.cybozuAdvance.whileLoadingDialog("予定の変更", "予定を変更中です。", function () {
                            if (tab == 3) { // repeat
                                if (schedule.modifyRepeatEvent(e, modifyType, baseDate, modifyDate)) {
                                    _calendar.initEvents();
                                } else {
                                    // fail
                                }
                            } else {
                                if (schedule.modifyEvent(e)) {
                                    _calendar.initEvents();
                                } else {
                                    // fail
                                }
                            }
                        });
                        $(this).dialog("close");
                    }
                },
                {
                    text: "キャンセル",
                    click: function () {
                        $(this).dialog("close");
                    }
                }
            ]
        });

        // show and clear repeat modify type
        $(prefix + "-modify-type").show();
        $(prefix + "-modify-type-none").attr("checked", true);

        // set date and time
        if (tabIndex == 0) { // short
            $(prefix + "-date").datepicker("setDate", new Date(event.start));
            if (event.allDay) {
                $(prefix + "-time").timeRangePicker("clearTimeRange");
            } else {
                if (event.start_only || !event.end) {
                    $(prefix + "-time").timeRangePicker("setTimeRange", event.start.getHours(), event.start.getMinutes(), null, null);
                } else {
                    $(prefix + "-time").timeRangePicker("setTimeRange", event.start.getHours(), event.start.getMinutes(), event.end.getHours(), event.end.getMinutes());
                }
            }
        } else if (tabIndex == 1) { // long
            $(prefix + "-start-date").datepicker("setDate", new Date(event.start));
            $(prefix + "-end-date").datepicker("setDate", new Date(event.end));
            if (event.allDay) {
                $(prefix + "-start-time").timePicker("clearTime");
                $(prefix + "-end-time").timePicker("clearTime");
            } else {
                $(prefix + "-start-time").timePicker("setTime", event.start.getHours(), event.start.getMinutes());
                $(prefix + "-end-time").timePicker("setTime", event.end.getHours(), event.end.getMinutes());
            }
        } else if (tabIndex == 2) { // banner
            $(prefix + "-banner-start-date").datepicker("setDate", new Date(event.start));
            if (event.end) {
                $(prefix + "-banner-end-date").datepicker("setDate", new Date(event.end));
            }
        } else { // repeat
            $(prefix + "-modify-type").data("baseDate", baseDate).data("start_date", event.repeatInfo.start_date);

            $("span." + elementId + "-form-selected-date").text($.fullCalendar.formatDate(baseDate, "yyyy/MM/dd（ddd）", formatDateOptions));
            $(prefix + "-modify-date").datepicker("setDate", baseDate);

            var repeatType = event.repeatInfo.type;
            switch (repeatType) {
                case "day":
                case "weekday":
                    $(prefix + "-repeat-type-" + repeatType).get(0).checked = true;
                    $(prefix + "-week-type").val("week");
                    $(prefix + "-week").val(baseDate.getDay());
                    $(prefix + "-day").val(baseDate.getDate());
                    break;

                case "week":
                case "1stweek":
                case "2ndweek":
                case "3rdweek":
                case "4thweek":
                case "lastweek":
                    $(prefix + "-repeat-type-week").get(0).checked = true;
                    $(prefix + "-week-type").val(repeatType);
                    $(prefix + "-week").val(event.repeatInfo.week);
                    $(prefix + "-day").val(baseDate.getDate());
                    break;

                case "month":
                    $(prefix + "-repeat-type-month").get(0).checked = true;
                    $(prefix + "-week-type").val("week");
                    $(prefix + "-week").val(baseDate.getDay());
                    $(prefix + "-day").val(event.repeatInfo.day);
                    break;
            }

            $(prefix + "-repeat-start-date").datepicker("setDate", $.cybozuConnect.parseXSDDate(event.repeatInfo.start_date));
            if (event.repeatInfo.end_date) {
                $(prefix + "-repeat-end-date").datepicker("setDate", $.cybozuConnect.parseXSDDate(event.repeatInfo.end_date));
            } else {
                $(prefix + "-repeat-end-date").datepicker("setDate", null);
            }
            var $timeRange = $(prefix + "-repeat-time");
            if (event.allDay) {
                $timeRange.timeRangePicker("clearTimeRange");
            } else if (event.start && event.end) {
                $timeRange.timeRangePicker("setTimeRange", event.start.getHours(), event.start.getMinutes(), event.end.getHours(), event.end.getMinutes());
            } else if (event.start) {
                $timeRange.timeRangePicker("setTimeRange", event.start.getHours(), event.start.getMinutes());
            }
        }

        // plan
        var plan = $(prefix + "-plan");
        var firstOption = plan.children().first();
        if (firstOption.val()) {
            firstOption.remove();
        }
        if (event.plan) {
            plan.prepend("<option>" + $.cybozuConnect.htmlEscape(event.plan) + "</option>");
        }
        plan.attr("selectedIndex", 0);

        // detail
        if (event.detail) {
            $(prefix + "-detail").val(event.detail);
        } else {
            $(prefix + "-detail").val("");
        }

        // memo
        if (event.description) {
            $(prefix + "-memo").val(event.description);
        } else {
            $(prefix + "-memo").val("");
        }

        // members
        var members = $(prefix + "-members");
        members.groupedItemPicker("clearResult");
        for (var i = 0; i < event.organizations.length; i++) {
            members.peoplePicker("appendResult", event.organizations[i], true);
        }
        members.peoplePicker("appendResult", event.users);
        members.peoplePicker("setOrganization", app.Base.primaryOrganization(app.userId, true));

        // facilities
        var facilities = $(prefix + "-facilities");
        facilities.groupedItemPicker("clearResult").groupedItemPicker("appendResult", event.facilities);
        var facilityGroupList = schedule.facilityGroupList();
        if (facilityGroupList && facilityGroupList.length) {
            facilities.facilityPicker("setFacilityGroup", facilityGroupList[0]); // first facility
        } else {
            facilities.facilityPicker("setFacilityGroup", "0"); // all facilities
        }

        if (loading) {
            $.cybozuAdvance.closeLoadingDialog();
        }

        // open event form dialog
        $(prefix).dialog("open");
        $(prefix + "-title").focus();
    };

    function get3MonthAfter(date) {
        var year = date.getFullYear();
        var month = date.getMonth() + 3;
        var mday = date.getDate() - 1;
        if (mday == 0) {
            month--;
        }
        if (month > 11) {
            month -= 12;
            year++;
        }
        var lastDay = $.cybozuConnect.getLastDay(year, month);
        if (mday == 0 || lastDay < mday) {
            mday = lastDay;
        }
        return new Date(year, month, mday);
    }

    function setShortTimeRange() {
        var prefix = formSelector;

        var d = $(prefix + "-date").datepicker("getDate");
        if (!d) return null;

        var event = { event_type: "normal" };

        var timeRange = $(prefix + "-time");
        event.start = timeRange.timeRangePicker("getStartTime", d);
        event.end = null;
        if (event.start) {
            event.allDay = false;
            event.end = timeRange.timeRangePicker("getEndTime", d);
        } else {
            event.allDay = true;
            event.start = d;
            event.end = d;
        }

        return event;
    }

    function setLongTimeRange() {
        var prefix = formSelector;
        var startDate = $(prefix + "-start-date").datepicker("getDate");
        if (!startDate) return null;
        var endDate = $(prefix + "-end-date").datepicker("getDate");

        var event = { event_type: "normal" };

        event.start = $(prefix + "-start-time").timePicker("getTime", startDate);
        if (event.start) {
            event.allDay = false;
            event.end = null;
            if (endDate) {
                event.end = $(prefix + "-end-time").timePicker("getTime", endDate);
                if (!event.end) {
                    event.end = new Date();
                    event.end.setTime(endDate.getTime() + 24 * 60 * 60 * 1000);
                }
            }
        } else {
            event.allDay = true;
            event.start = startDate;
            event.end = endDate ? endDate : startDate;
        }

        return event;
    }

    function setBannerDateRange() {
        var prefix = formSelector;
        var event = { event_type: "banner" };
        event.allDay = true;
        event.start = $(prefix + "-banner-start-date").datepicker("getDate");
        if (!event.start) return null;
        var endDate = $(prefix + "-banner-end-date").datepicker("getDate");
        event.end = endDate ? endDate : event.start;
        return event;
    }

    function setRepeatCondition(modifyType, modifyDate) {
        var event = { event_type: "repeat" };
        var repeatInfo = {};
        if ($(prefix + "-repeat-type-day:checked").length) {
            repeatInfo.type = "day";
        } else if ($(prefix + "-repeat-type-weekday:checked").length) {
            repeatInfo.type = "weekday";
        } else if ($(prefix + "-repeat-type-week:checked").length) {
            repeatInfo.type = $(prefix + "-week-type").val();
        } else if ($(prefix + "-repeat-type-month:checked").length) {
            repeatInfo.type = "month";
        } else {
            alert("繰り返し条件を指定してください。");
            return null;
        }
        repeatInfo.week = $(prefix + "-week").val();
        repeatInfo.day = $(prefix + "-day").val();
        var startDate = (modifyType == "after") ? modifyDate : $(prefix + "-repeat-start-date").datepicker("getDate");
        var endDate = $(prefix + "-repeat-end-date").datepicker("getDate");
        if (!startDate || !endDate) {
            if (modifyDate == "this") {
                // dummy
                repeatInfo.start_date = $.cybozuConnect.formatXSDDate(modifyDate);
                repeatInfo.end_date = $.cybozuConnect.formatXSDDate(modifyDate);
            } else {
                alert("繰り返す期間を設定してください。");
                return null;
            }
        } else {
            repeatInfo.start_date = $.cybozuConnect.formatXSDDate(startDate);
            repeatInfo.end_date = $.cybozuConnect.formatXSDDate(endDate);
        }
        repeatInfo.start_time = $(prefix + "-repeat-time").timeRangePicker("getStartXSDTime");
        if (repeatInfo.start_time) {
            event.allDay = false;
            repeatInfo.end_time = $(prefix + "-repeat-time").timeRangePicker("getEndXSDTime");
        } else {
            event.allDay = true;
        }

        event.repeatInfo = repeatInfo;
        return event;
    }

    function setEventInformationFromForm(event) {
        var prefix = formSelector;
        event.plan = $(prefix + "-plan").val();
        event.detail = $(prefix + "-detail").val();
        event.description = $(prefix + "-memo").val();
        event.userIdList = $(prefix + "-members").peoplePicker("getResultUserIds");
        event.orgIdList = $(prefix + "-members").peoplePicker("getResultOrganizationIds");
        if (event.event_type != "banner") {
            event.facilityIdList = $(prefix + "-facilities").groupedItemPicker("getResultValues");
        } else {
            event.facilityIdList = new Array();
        }
    }

    this.openViewDialog = function (event, view) {

        if (!isViewInitialized) {
            $(viewSelector + "-modify").button({ text: true, icons: { primary: "ui-icon-pencil"} });
            $(viewSelector + "-delete").button({ text: true, icons: { primary: "ui-icon-trash"} });
            $(viewSelector + "-leave").button({ text: true, icons: { primary: "ui-icon-cancel"} });
            $(viewSelector + "-reuse").button({ text: true, disabled: true });
            $(viewSelector + "-src").button({ text: true, icons: { primary: "ui-icon-extlink"} });
            isViewInitialized = true;
        }

        var dialogHeight = $(window).height() * 0.95;

        // initialize event form dialog
        $(viewSelector).dialog({
            autoOpen: true,
            width: 700,
            height: dialogHeight,
            modal: true,
            buttons: [
                {
                    text: "閉じる",
                    click: function () {
                        $(this).dialog("close");
                    }
                }
            ]
        });

        var memberCount = event.users.length + event.organizations.length + event.facilities.length;

        // modify button
        $(viewSelector + "-modify").button("enable").unbind("click").click(function () {
            $(viewSelector).dialog("close");
            _calendar.openModifyFormDialog(event, view);
        });

        // delete button
        $(viewSelector + "-delete").button("enable").unbind("click");
        if (event.event_type == "temporary") {
            // not support
            $(viewSelector + "-delete").button("disable");
        } else if (event.event_type == "repeat") {
            if (memberCount <= 1) {
                $(viewSelector + "-delete").click(function () {
                    var date = new Date(event.start);
                    var prefix = selector + "-delete";
                    $(prefix + "-this-date").text($.fullCalendar.formatDate(date, "yyyy/MM/dd （ddd）", formatDateOptions));
                    $(prefix + "-after-date").text($.fullCalendar.formatDate(date, "yyyy/MM/dd （ddd）", formatDateOptions));
                    $(prefix + "-type-none").attr("checked", true);
                    $(prefix + "-repeat-confirm").dialog({
                        autoOpen: true,
                        width: 500,
                        modal: true,
                        buttons: [{
                            text: "削除する",
                            click: function () {
                                var rangeType = $('[name="delete-type"]:checked', this).attr("value");
                                if (!rangeType) {
                                    alert("削除する範囲を選んでください。");
                                    return;
                                }
                                $(this).dialog("close");
                                $.cybozuAdvance.whileLoadingDialog("予定の削除", "予定を削除中です。", function () {
                                    if (schedule.removeEventFromRepeatEvent(event.id, rangeType, date)) {
                                        $(viewSelector).dialog("close");
                                        _calendar.initEvents();
                                    }
                                });
                            }
                        }, {
                            text: "キャンセル",
                            click: function () {
                                $(this).dialog("close");
                            }
                        }]
                    });
                });
            } else {
                $(viewSelector + "-delete").click(function () {
                    var date = new Date(event.start);
                    var prefix = selector + "-delete-sr";
                    $(prefix + "-this-date").text($.fullCalendar.formatDate(date, "yyyy/MM/dd （ddd）", formatDateOptions));
                    $(prefix + "-after-date").text($.fullCalendar.formatDate(date, "yyyy/MM/dd （ddd）", formatDateOptions));
                    $(prefix + "-members-none").attr("checked", true);
                    $(prefix + "-type-none").attr("checked", true);
                    $(prefix + "-confirm").dialog({
                        autoOpen: true,
                        width: 500,
                        modal: true,
                        buttons: [{
                            text: "削除する",
                            click: function () {
                                var membersType = $('[name="delete-members"]:checked', this).attr("value");
                                if (!membersType) {
                                    alert("削除する参加者を選んでください。");
                                    return;
                                }
                                var rangeType = $('[name="delete-type"]:checked', this).attr("value");
                                if (!rangeType) {
                                    alert("削除する範囲を選んでください。");
                                    return;
                                }
                                $(this).dialog("close");
                                if (membersType == "all") {
                                    // delete
                                    $.cybozuAdvance.whileLoadingDialog("予定の削除", "予定を削除中です。", function () {
                                        if (schedule.removeEventFromRepeatEvent(event.id, rangeType, date)) {
                                            $(viewSelector).dialog("close");
                                            _calendar.initEvents();
                                        }
                                    });
                                } else {
                                    // leave
                                    $.cybozuAdvance.whileLoadingDialog("予定から抜ける", "更新中です。", function () {
                                        if (schedule.leaveEventFromRepeatEvent(event.id, rangeType, date)) {
                                            $(viewSelector).dialog("close");
                                            _calendar.initEvents();
                                        }
                                    });
                                }
                            }
                        }, {
                            text: "キャンセル",
                            click: function () {
                                $(this).dialog("close");
                            }
                        }]
                    });
                });
            }
        } else {
            if (memberCount <= 1) {
                $(viewSelector + "-delete").click(function () {
                    $.cybozuAdvance.openConfirmDialog({
                        title: "予定の削除",
                        message: "予定を削除します。よろしいですか？",
                        loadingMessage: "予定を削除中です。",
                        okHandler: function () {
                            if (schedule.removeEvent(event.id)) {
                                $(viewSelector).dialog("close");
                                _calendar.removeEvent(event.id, view);
                            }
                        }
                    });
                });
            } else {
                $(viewSelector + "-delete").click(function () {
                    var prefix = selector + "-delete";
                    $(prefix + "-members-none").attr("checked", true);
                    $(prefix + "-shared-confirm").dialog({
                        autoOpen: true,
                        resizable: false,
                        modal: true,
                        buttons: [{
                            text: "削除する",
                            click: function () {
                                if ($(prefix + "-members-all:checked").length) {
                                    $(this).dialog("close");
                                    $.cybozuAdvance.whileLoadingDialog("予定の削除", "予定を削除中です。", function () {
                                        if (schedule.removeEvent(event.id)) {
                                            $(viewSelector).dialog("close");
                                            _calendar.removeEvent(event.id, view);
                                        }
                                    });
                                } else if ($(prefix + "-members-one:checked").length) {
                                    $(this).dialog("close");
                                    $.cybozuAdvance.whileLoadingDialog("予定から抜ける", "更新中です。", function () {
                                        if (schedule.leaveEvent(event.id)) {
                                            $(viewSelector).dialog("close");
                                            _calendar.leaveEvent(event.id, view);
                                        }
                                    });
                                } else {
                                    alert("いずれかを選んでください。");
                                }
                            }
                        }, {
                            text: "キャンセル",
                            click: function () {
                                $(this).dialog("close");
                            }
                        }]
                    });
                });
            }
        }

        // leave button
        $(viewSelector + "-leave").unbind("click");
        if (event.event_type == "temporary") {
            // not support
            $(viewSelector + "-leave").button("disable");

        } else if (memberCount > 1 && schedule.inMembers(app.userId, event)) {
            $(viewSelector + "-leave").button("enable");
            if (event.event_type == "repeat") {
                $(viewSelector + "-leave").click(function () {
                    var date = new Date(event.start);
                    var prefix = selector + "-modify";
                    $(prefix + "-message").text("予定から抜ける範囲を指定してください。");
                    $(prefix + "-this-date").text($.fullCalendar.formatDate(date, "yyyy/MM/dd （ddd）", formatDateOptions));
                    $(prefix + "-after-date").text($.fullCalendar.formatDate(date, "yyyy/MM/dd （ddd）", formatDateOptions));
                    $(prefix + "-type-none").attr("checked", true);
                    $(prefix + "-repeat-confirm").dialog({
                        autoOpen: true,
                        width: 500,
                        modal: true,
                        title: "繰り返し予定から抜ける",
                        buttons: [{
                            text: "予定から抜ける",
                            click: function () {
                                var type = $('[name="modify-type"]:checked', this).attr("value");
                                if (!type) {
                                    alert("いずれかを選んでください。");
                                    return;
                                }
                                $(this).dialog("close");
                                $.cybozuAdvance.whileLoadingDialog("予定から抜ける", "更新中です。", function () {
                                    if (schedule.leaveEventFromRepeatEvent(event.id, type, date)) {
                                        $(viewSelector).dialog("close");
                                        _calendar.initEvents();
                                    }
                                });
                            }
                        }, {
                            text: "キャンセル",
                            click: function () {
                                $(this).dialog("close");
                            }
                        }]
                    });
                });
            } else {
                $(viewSelector + "-leave").click(function () {
                    $.cybozuAdvance.openConfirmDialog({
                        title: "予定から抜ける",
                        message: "予定から抜けます。よろしいですか？",
                        loadingMessage: "更新中です。",
                        okHandler: function () {
                            if (schedule.leaveEvent(event.id)) {
                                $(viewSelector).dialog("close");
                                _calendar.leaveEvent(event.id, view);
                            }
                        }
                    });
                });
            }
        } else {
            $(viewSelector + "-leave").button("disable");
        }

        // src url
        var viewUrl;
        if (app.cybozuType() == "Garoon") {
            viewUrl = app.cybozuURL() + '/schedule/view?event=' + event.id + '&bdate=' + $.cybozuConnect.formatXSDDate(event.start);
        } else if (app.cybozuType() == "Office") {
            viewUrl = app.cybozuURL() + '?page=ScheduleView&sEID=' + event.id + '&Date=da.' + $.fullCalendar.formatDate(event.start, "yyyy.M.d");
        }
        $(viewSelector + "-src").attr("href", viewUrl);

        // event data

        var prefix = viewSelector;

        // when
        var when;
        if (event.allDay) {
            when = $.fullCalendar.formatDate(event.start, "yyyy/MM/dd（ddd）", formatDateOptions);
            if (!event.start_only && event.end && event.start != event.end) {
                when += " ～ " + $.fullCalendar.formatDate(event.end, "yyyy/MM/dd（ddd）", formatDateOptions);
            }
        } else {
            when = $.fullCalendar.formatDate(event.start, "yyyy/MM/dd（ddd） HH:mm", formatDateOptions);
            if (!event.start_only && event.end && event.start != event.end) {
                if (event.start.getYear() == event.end.getYear() && event.start.getMonth() == event.end.getMonth() && event.start.getDate() == event.end.getDate()) {
                    when += " ～ " + $.fullCalendar.formatDate(event.end, "HH:mm");
                } else {
                    when += " ～ " + $.fullCalendar.formatDate(event.end, "yyyy/MM/dd（ddd） HH:mm", formatDateOptions);
                }
            }
        }
        $(prefix + "-when").text(when);

        // title
        var eventTitle = event.title;
        if (event.public_type == "private") eventTitle += "（非公開）";
        $(prefix + "-title").text(eventTitle);

        // memo
        if (event.description) {
            var memo = $.cybozuConnect.htmlEscape(event.description).replace(/ /g, "&nbsp;").replace(/\n/g, "<br />").replace(/\r/g, "");
            $(prefix + "-memo").html(memo);
        } else {
            $(prefix + "-memo").html("");
        }

        // members
        var members = "";
        var count = 0;
        for (var i = 0; i < event.organizations.length; i++) {
            if (members) members += ", ";
            members += "<nobr>[" + $.cybozuConnect.htmlEscape(event.organizations[i].name) + "]</nobr>";
            count++;
        }
        for (var i = 0; i < event.users.length; i++) {
            if (members) members += ", ";
            members += "<nobr>" + $.cybozuConnect.htmlEscape(event.users[i].name) + "</nobr>";
            count++;
        }
        members += " <nobr>（" + count + "名）</nobr>";
        $(prefix + "-members").html(members);

        // facilities
        var facilities = "";
        for (var i = 0; i < event.facilities.length; i++) {
            if (facilities) facilities += ", ";
            facilities += "<nobr>" + $.cybozuConnect.htmlEscape(event.facilities[i].name) + "</nobr>";
        }
        $(prefix + "-facilities").html(facilities);

        // follow
        var followList = $(prefix + "-follow-list");
        showFollows(followList, event);

        // follow write
        $(prefix + "-follow-text").val("");
        if (event.event_type == "temporary") {
            $(prefix + "-follow-form").css("display", "none");
        } else {
            $(prefix + "-follow-form").css("display", "");
            $(prefix + "-follow-write").unbind("click").click(function () {
                var followTextarea = $(prefix + "-follow-text");
                var followText = followTextarea.val();
                followTextarea.val("");
                $.cybozuAdvance.whileLoadingDialog("フォローの書き込み", "フォローを書き込み中です。", function () {
                    if (event.event_type == "repeat") {
                        var followedEvent = schedule.addFollowToRepeatEvent(event, event.start, followText);
                        if (followedEvent) {
                            _calendar.initEvents();
                            _calendar.openViewDialog(followedEvent, view); // re-open
                        }
                    } else {
                        var followedEvent = schedule.addFollow(event, followText);
                        if (followedEvent) {
                            showFollows(followList, followedEvent);
                        }
                    }
                });
            });
        }
    };

    function showFollows(followList, event) {
        followList.empty();

        if (!event || !event.follows) return;

        event.follows.each(function () {
            var $follow = $(this);
            var followId = $follow.attr("id");
            var $creator = $follow.find("creator");
            var created = $.cybozuConnect.parseISO8601($creator.attr("date"), true);
            var followItem = $('<div id="cal-view-follow-' + followId + '" class="cal-view-follow-item"></div>').appendTo(followList);
            var followInfo = $('<div class="cal-view-follow-info"></div>').appendTo(followItem);
            followInfo.append('<span class="cal-view-follow-creator">' + $.cybozuConnect.htmlEscape($creator.attr("name")) + '</span>');
            followInfo.append('<span class="cal-view-follow-created">' + $.fullCalendar.formatDate(created, "yyyy/MM/dd（ddd） HH:mm", formatDateOptions) + '</span>');
            if ($creator.attr("user_id") == app.userId) {
                $('<a href="#" class="cal-view-follow-del ui-widget-content ui-corner-all ui-state-default">削除する</a>').appendTo(followInfo).bind('click', { followId: followId }, function (e) {
                    var followIdToDelete = e.data.followId;
                    $("#cal-follow-delete-message").css("display", "");
                    $("#cal-follow-delete-waiting").css("display", "none");
                    $.cybozuAdvance.openConfirmDialog({
                        title: "フォローの削除",
                        message: "フォローを削除します。よろしいですか？",
                        loadingMessage: "フォローを削除中です。",
                        okHandler: function () {
                            if (schedule.removeFollows(followIdToDelete)) {
                                $("#cal-view-follow-" + followIdToDelete).remove();
                            }
                        }
                    });
                });
            }
            followItem.append('<div class="cal-view-follow-text">' + $.cybozuConnect.htmlEscape($follow.attr("text")).replace(/ /g, "&nbsp;").replace(/\n/g, "<br />").replace(/\r/g, "") + "</div>");
        });
    }

    // private functions

    function userCalendarId(userId) {
        return elementId + "-user-" + userId;
    }

    function userCalendarHeaderId(userId) {
        return elementId + "-user-header-" + userId;
        //return userCalendarId(userId) + "-header";
    }

    function initPlanMenu(prefix) {

        // plan menus
        var perMenus = schedule.personalProfile().plan_menu();
        var sysMenus = schedule.systemProfile().plan_menu();
        var planMenu = $(prefix + "-plan");
        planMenu.empty();
        $.cybozuAdvance.appendOption(planMenu, "");
        for (var i = 0; i < perMenus.length; i++) {
            $.cybozuAdvance.appendOption(planMenu, perMenus[i]);
        }
        if (perMenus.length && sysMenus.length) {
            $.cybozuAdvance.appendOption(planMenu, "", "--");
        }
        for (var i = 0; i < sysMenus.length; i++) {
            $.cybozuAdvance.appendOption(planMenu, sysMenus[i]);
        }
    }

    // initialize
    this.init();
};

(function ($) {

    var facilityPickerMethods = {
        appendResult: function (facility) {
            this.groupedItemPicker("appendResult", facility);
            return this;
        },

        setFacilityGroup: function (facilityGroup) {
            this.each(function () {
                var $this = $(this);
                var currentGroupId = $this.groupedItemPicker("getGroupValue");
                var groupId = (facilityGroup == "0" || facilityGroup == "all" || !facilityGroup) ? facilityGroup : facilityGroup.id;
                if (currentGroupId == groupId) return; // already set

                if (groupId == "0" || groupId == "all") {
                    $this.groupedItemPicker("setGroup", groupId, "（全設備）");
                } else if (facilityGroup) {
                    $this.groupedItemPicker("setGroup", groupId, facilityGroup.name);
                } else {
                    $this.groupedItemPicker("setGroup", "", "");
                }
                $this.trigger("groupChange");
            });
            return this;
        }
    };

    $.fn.facilityPicker = function (options) {

        if (facilityPickerMethods[options]) {
            return facilityPickerMethods[options].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (options && typeof options != "object") {
            $.error("Method " + options + " does not exists on facilityPicker.");
        }

        var settings = {
            width: "17em",
            size: 8,
            buttonWidth: "7em",
            searchBoxWidth: "10em",
            searchButtonWidth: "7em",
            addLabel: "&larr; 追加",
            removeLabel: "削除 &rarr;",
            searchLabel: "設備検索",
            choiceDescription: "複数選択できます。",
            search: true,
            includeAll: true
        };
        settings = $.extend(settings, options);

        var app = options.app;
        var Schedule = app.Schedule || new CBLabs.CybozuConnect.Schedule(app);

        function createFacilityGroupHierarchy() {
            var html = "<ul>";
            if (settings.includeAll) {
                html += '<li><a href="#" id="0">（全設備）</a></li>';
            }
            var facilityGroupList = Schedule.facilityGroupList();
            if (facilityGroupList) {
                for (var i = 0; i < facilityGroupList.length; i++) {
                    var topGroup = facilityGroupList[i];
                    html += '<li><a href="#" id="' + topGroup.id + '">' + $.cybozuConnect.htmlEscape(topGroup.name) + "</a>";
                    if (topGroup.facilityGroupIdList && topGroup.facilityGroupIdList.length) {
                        html += createSubFacilityGroupHerarchy(topGroup);
                    }
                    html += "</li>";
                }
            }
            html += "</ul>";
            return html;
        }

        function createSubFacilityGroupHerarchy(group) {
            var html = "<ul>";
            for (var i = 0; i < group.facilityGroupIdList.length; i++) {
                var childGroup = Schedule.facilityGroup(group.facilityGroupIdList[i]);
                if (childGroup) {
                    html += '<li><a href="#" id="' + childGroup.id + '">' + $.cybozuConnect.htmlEscape(childGroup.name) + "</a>";
                    if (childGroup.facilityGroupIdList && childGroup.facilityGroupIdList.length) {
                        html += createSubFacilityGroupHerarchy(childGroup);
                    }
                    html += "</li>";
                }
            }
            html += "</ul>";
            return html;
        }
        
        // facility group picker
        settings.content = createFacilityGroupHierarchy();

        this.groupedItemPicker(settings);

        // event handlers

        this.bind("search", function () {
            var $this = $(this);
            var text = $this.groupedItemPicker("getSearchText");
            if (!text) return;

            var facilityResult = Schedule.facilitySearch(text);
            $this.groupedItemPicker("clearChoice").groupedItemPicker("appendChoice", facilityResult);
        });

        this.bind("groupChange", function () {
            var $this = $(this);
            $this.groupedItemPicker("clearChoice");

            var groupId = $this.groupedItemPicker("getGroupValue");
            if (groupId == "0") {
                var facilityList = Schedule.facilityList();
                if (facilityList) {
                    $this.groupedItemPicker("appendChoice", facilityList);
                }
            } else if (groupId) {
                var group = Schedule.facilityGroup(groupId);
                if (group) {
                    var choiceSelect = $this.find(".gip-choice");
                    for (var i = 0; i < group.facilityIdList.length; i++) {
                        var facility = Schedule.facility(group.facilityIdList[i]);
                        if (facility) {
                            $.cybozuAdvance.appendOption(choiceSelect, facility.id, facility.name);
                        }
                    }
                }
            }
        });

        return this;
    };

})(jQuery);
