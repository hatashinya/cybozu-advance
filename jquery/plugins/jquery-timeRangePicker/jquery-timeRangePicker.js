/*
* jquery-timeRangePicker v1.0.0
*
* @requires jQuery v1.4.1 or later.
*
* Copyright (c) 2011 Cybozu Labs, Inc.
* http://labs.cybozu.co.jp/
*
* Licensed under the GPL Version 2 license.
*/

(function ($) {

    // timePicker

    $.fn.timePicker = function (options) {

        if (timePickerMethods[options]) {
            return timePickerMethods[options].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (options && typeof options != "object") {
            $.error("Method " + options + " does not exists on timePicker.");
        }

        var settings = { required: false, minutesStep: 10, include24: false, timeSeparator: ":" };
        settings = $.extend(settings, options);

        this.each(function () {
            var $this = $(this);
            $this.empty();
            $this.data("options", settings);
            var hoursSelect = createHoursSelect($this, "trp-hours", settings);
            if (settings.timeSeparator) {
                $this.append(settings.timeSeparator);
            }
            var minutesSelect = createMinutesSelect($this, "trp-minutes", settings);

            if (!settings.required) {
                hoursSelect.change(function () {
                    var hours = $(this).val();
                    if (hours == "") {
                        minutesSelect.val("");
                    } else if (minutesSelect.val() == "") {
                        minutesSelect.val("00");
                    }
                });
            }
        });

        return this;
    };

    var timePickerMethods = {
        clearTime: function () {
            this.each(function () {
                if ($(this).data("options").required) {
                    throw "Cannot clear time.";
                }
                $("select", this).val("");
            });
            return this;
        },

        setTime: function (hours, minutes) {
            if (hours < 0 || 24 < hours || minutes < 0 || 59 < minutes) {
                throw "Invalid range of specified time.";
            }
            this.each(function () {
                var $this = $(this);
                var options = $this.data("options");
                if (hours === 24 && !options.include24) {
                    throw "Cannot specify 24 to hours.";
                }
                var min = minutes;
                if (min % options.minutesStep) {
                    min = options.minutesStep * Math.floor(min / options.minutesStep);
                }
                $("select.trp-hours", this).val(zeroPaddingNumber(hours));
                $("select.trp-minutes", this).val(zeroPaddingNumber(min));
            });
            return this;
        },

        getTime: function (date) {
            var hours = $("select.trp-hours", this).val();
            if (!hours) {
                return null;
            }
            var minutes = $("select.trp-minutes", this).val();
            if (!minutes) {
                minutes = 0;
            }
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(hours, 10), parseInt(minutes, 10));
        },

        getXSDTime: function () {
            var hours = $("select.trp-hours", this).val();
            if (!hours) {
                return null;
            }
            var minutes = $("select.trp-minutes", this).val();
            if (!minutes) {
                minutes = "00";
            }
            return hours + ":" + minutes + ":00";
        }
    };

    // timeRangePicker

    $.fn.timeRangePicker = function (options) {

        if (timeRangePickerMethods[options]) {
            return timeRangePickerMethods[options].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (options && typeof options != "object") {
            $.error("Method " + options + " does not exists on timeRangePicker.");
        }

        var settings = { required: false, minutesStep: 10, include24: false, timeSeparator: ":", rangeSeparator: "-" };
        settings = $.extend(settings, options);

        this.each(function () {
            var $this = $(this);
            $this.empty();
            $this.data("options", settings);

            var include24 = settings.include24;
            settings.include24 = false; // once off
            createHoursSelect($this, "trp-start-hours", settings);
            if (settings.timeSeparator) {
                $this.append(settings.timeSeparator);
            }
            createMinutesSelect($this, "trp-start-minutes", settings);

            if (settings.rangeSeparator) {
                $this.append(settings.rangeSeparator);
            }

            settings.include24 = include24; // recover
            createHoursSelect($this, "trp-end-hours", settings);
            if (settings.timeSeparator) {
                $this.append(settings.timeSeparator);
            }
            createMinutesSelect($this, "trp-end-minutes", settings);

            // reset previous selected hours
            $this.data("prevHours", null);

            bindChange(this, settings.include24);
        });

        return this;
    };

    var timeRangePickerMethods = {
        clearTimeRange: function () {
            this.each(function () {
                if ($(this).data("options").required) {
                    throw "Cannot clear time range";
                }
                $("select", this).val("");
                $(this).data("prevHours", null);
            });
            return this;
        },

        setTimeRange: function (startHours, startMinutes, endHours, endMinutes) {
            if (startHours < 0 || 23 < startHours || startMinutes < 0 || 59 < startMinutes) {
                throw "Invalid range of specified start time.";
            }
            if ((endHours || endHours === 0) && (endHours < 0 || 24 < endHours || endMinutes < 0 || 59 < endMinutes)) {
                throw "Invalid range of specified end time.";
            }
            this.each(function () {
                var $this = $(this);
                var options = $this.data("options");
                if (options.required && !endHours && endHours !== 0) {
                    throw "Cannot clear end time.";
                }
                startHoursSelect(this).val(zeroPaddingNumber(startHours));
                var min = startMinutes;
                if (min % options.minutesStep) {
                    min = options.minutesStep * Math.floor(min / options.minutesStep);
                }
                startMinutesSelect(this).val(zeroPaddingNumber(min));
                if (endHours || endHours === 0) {
                    if (endHours === 24 && !options.include24) {
                        throw "Cannot specify 24 to end hours.";
                    }
                    endHoursSelect(this).val(zeroPaddingNumber(endHours));
                    min = endMinutes;
                    if (min % options.minutesStep) {
                        min = options.minutesStep * Math.floor(min / options.minutesStep);
                    }
                    endMinutesSelect(this).val(zeroPaddingNumber(min));
                    $this.data("prevHours", startHours);
                } else {
                    endHoursSelect(this).val("");
                    endMinutesSelect(this).val("");
                    $this.data("prevHours", null);
                }
            });
            return this;
        },

        getStartTime: function (date) {
            var hours = startHoursSelect(this).val();
            if (!hours) {
                return null;
            }
            var minutes = startMinutesSelect(this).val();
            if (!minutes) {
                minutes = 0;
            }
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(hours, 10), parseInt(minutes, 10));
        },

        getStartXSDTime: function () {
            var hours = startHoursSelect(this).val();
            if (!hours) {
                return null;
            }
            var minutes = startMinutesSelect(this).val();
            if (!minutes) {
                minutes = "00";
            }
            return hours + ":" + minutes + ":00";
        },

        getEndTime: function (date) {
            var hours = endHoursSelect(this).val();
            if (!hours) {
                return null;
            }
            var minutes = endMinutesSelect(this).val();
            if (!minutes) {
                minutes = 0;
            }
            return new Date(date.getFullYear(), date.getMonth(), date.getDate(), parseInt(hours, 10), parseInt(minutes, 10));
        },

        getEndXSDTime: function () {
            var hours = endHoursSelect(this).val();
            if (!hours) {
                return null;
            }
            var minutes = endMinutesSelect(this).val();
            if (!minutes) {
                minutes = "00";
            }
            return hours + ":" + minutes + ":00";
        }
    };

    // private functions

    function zeroPaddingNumber(num) {
        return ((num < 10) ? "0" : "") + num;
    }

    function createSelect(parent, cssClass) {
        return $('<select class="' + cssClass + ' ui-widget-content"></select>').appendTo(parent);
    }

    function createHoursSelect(parent, cssClass, options) {
        var hoursSelect = createSelect(parent, cssClass);
        if (!options.required) {
            hoursSelect.append("<option></option>");
        }
        var hoursMax = options.include24 ? 24 : 23;
        for (var i = 0; i <= hoursMax; i++) {
            var option = "<option>" + zeroPaddingNumber(i) + "</option>";
            hoursSelect.append(option);
        }
        return hoursSelect;
    }

    function createMinutesSelect(parent, cssClass, options) {
        var minutesSelect = createSelect(parent, cssClass);
        if (!options.required) {
            minutesSelect.append("<option></option>");
        }
        for (var i = 0; i < 60; i += options.minutesStep) {
            var option = "<option>" + zeroPaddingNumber(i) + "</option>";
            minutesSelect.append(option);
        }
        return minutesSelect;
    }

    function startHoursSelect(parent) {
        return $("select.trp-start-hours", parent);
    }

    function startMinutesSelect(parent) {
        return $("select.trp-start-minutes", parent);
    }

    function endHoursSelect(parent) {
        return $("select.trp-end-hours", parent);
    }

    function endMinutesSelect(parent) {
        return $("select.trp-end-minutes", parent);
    }

    function bindChange(parent, include24) {
        startHoursSelect(parent).change(function () {
            var startHours = $(this).val();
            var sm = startMinutesSelect(parent);
            var eh = endHoursSelect(parent);
            var em = endMinutesSelect(parent);
            if (!startHours) {
                sm.val("");
                eh.val("");
                em.val("");
                $(parent).data("prevHours", null);
                return;
            }

            startHours = parseInt(startHours, 10);
            var startMinutes = sm.val();
            if (!startMinutes) {
                sm.val("00");
                startMinutes = 0;
            } else {
                startMinutes = parseInt(startMinutes, 10);
            }
            var endHours;
            var prevEndHours = eh.val();
            var prevStartHours = $(parent).data("prevHours");
            if (prevStartHours != null && prevEndHours) {
                prevEndHours = parseInt(prevEndHours, 10);
                if (prevEndHours - prevStartHours >= 0) {
                    endHours = startHours + (prevEndHours - prevStartHours);
                } else {
                    endHours = startHours + 1;
                }
            } else {
                endHours = startHours + 1;
            }
            var maxHours = include24 ? 24 : 23;
            if (endHours > maxHours) endHours = maxHours;
            eh.val(zeroPaddingNumber(endHours));
            var endMinutes = em.val();
            if (!endMinutes || endHours == 24) {
                em.val("00");
            } else if (startHours == endHours && startMinutes > endMinutes) {
                em.val(zeroPaddingNumber(startMinutes));
            }
            $(parent).data("prevHours", startHours);
        });
        endHoursSelect(parent).change(function () {
            var endHours = $(this).val();
            var minutesSelect = endMinutesSelect(parent);
            if (endHours == "") {
                minutesSelect.val("");
            } else if (minutesSelect.val() == "") {
                minutesSelect.val("00");
            }
        });
    }

})(jQuery);
