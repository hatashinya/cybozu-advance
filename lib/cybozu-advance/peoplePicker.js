/*
* Cybozu Advance v1.1.3
*
* peoplePicker as jquery plugin
*
* @requires jQuery v1.4.1 or later.
* @requires cybozu-connect
* @requires jquery-groupedItemPicker
* @requires jquery-treeview-menu
*
* Copyright (C) 2011 Cybozu Labs, Inc.
* http://labs.cybozu.co.jp/
*
* Licensed under the GPL Version 2 license.
*/

(function ($) {

    // people picker

    var peoplePickerMethods = {
        appendResult: function (member, isOrg) {
            if (isOrg) {
                this.groupedItemPicker("appendResult", member.id, "[" + member.name + "]");
            } else {
                this.groupedItemPicker("appendResult", member);
            }
            return this;
        },

        setOrganization: function (org) {
            this.each(function () {
                var $this = $(this);
                var currentOrgId = $this.groupedItemPicker("getGroupValue");
                var orgId = (org == "0" || org == "all" || !org) ? "0" : org.id;
                if (currentOrgId == orgId) return; // already set

                if (orgId == "0") {
                    $this.groupedItemPicker("setGroup", "0", "（全員）");
                } else if (org) {
                    $this.groupedItemPicker("setGroup", orgId, org.name);
                } else {
                    $this.groupedItemPicker("setGroup", "", "");
                }
                $this.trigger("groupChange");
            });
            return this;
        },

        getResultUserIds: function () {
            var result = $(this).groupedItemPicker("getResultValues");
            var userIdList = new Array();
            for (var i = 0; i < result.length; i++) {
                if (result[i].indexOf("g-") >= 0) continue;
                userIdList[userIdList.length] = result[i];
            }
            return userIdList;
        },

        getResultOrganizationIds: function () {
            var result = $(this).groupedItemPicker("getResultValues");
            var orgIdList = new Array();
            for (var i = 0; i < result.length; i++) {
                if (result[i].indexOf("g-") >= 0) {
                    orgIdList[orgIdList.length] = result[i].substr(2);
                }
            }
            return orgIdList;
        }
    };

    $.fn.peoplePicker = function (options) {

        if (peoplePickerMethods[options]) {
            return peoplePickerMethods[options].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (options && typeof options != "object") {
            $.error("Method " + options + " does not exists on peoplePicker.");
        }

        var settings = {
            width: "17em",
            size: 8,
            buttonWidth: "7em",
            searchBoxWidth: "10em",
            searchButtonWidth: "7em",
            addLabel: "&larr; 追加",
            removeLabel: "削除 &rarr;",
            searchLabel: "ユーザー検索",
            choiceDescription: "複数選択できます。",
            search: true,
            includeAll: true
        };
        settings = $.extend(settings, options);

        var app = options.app;
        var Base = app.Base || new CBLabs.CybozuConnect.Base(app);

        settings.content = createOrgHierarchy(settings, Base);

        this.groupedItemPicker(settings);

        // event handlers

        this.bind("search", function () {
            var $this = $(this);
            var text = $this.groupedItemPicker("getSearchText");
            if (!text) return;

            var userResult = Base.userSearch(text);
            $this.groupedItemPicker("clearChoice").groupedItemPicker("appendChoice", userResult);
        });

        this.bind("groupChange", function () {
            var $this = $(this);
            $this.groupedItemPicker("clearChoice");

            var groupId = $this.groupedItemPicker("getGroupValue");
            if (groupId == "g") {
                var choiceSelect = $this.find(".gip-choice");
                var orgList = Base.organizationList();
                if (orgList) {
                    for (var i = 0; i < orgList.length; i++) {
                        var org = orgList[i];
                        $.cybozuAdvance.appendOption(choiceSelect, "g-" + org.id, "[" + org.name + "]");
                    }
                }
            } else if (groupId == "0") {
                var userList = Base.userList();
                if (userList) {
                    $this.groupedItemPicker("appendChoice", userList);
                }
            } else if (groupId) {
                var org = Base.organization(groupId);
                if (org) {
                    var choiceSelect = $this.find(".gip-choice");
                    if (settings.showGroup) {
                        $.cybozuAdvance.appendOption(choiceSelect, "g-" + org.id, "[" + org.name + "]");
                    }
                    for (var i = 0; i < org.userIdList.length; i++) {
                        var user = Base.user(org.userIdList[i]);
                        if (user) {
                            $.cybozuAdvance.appendOption(choiceSelect, user.id, user.name);
                        }
                    }
                }
            }
        });

        return this;
    };

    // organizationPicker

    var organizationPickerMethods = {
        getOrganizationId: function (org) {
            var sel = this.treeviewMenu("getSelection");
            return sel ? sel.value : null;
        },

        setOrganization: function (org) {
            if (org == "0" || org == "all") {
                this.treeviewMenu("setSelection", { value: "0", text: "（全員）" });
            } else if (org) {
                this.treeviewMenu("setSelection", { value: org.id, text: org.name });
            } else {
                this.treeviewMenu("setSelection", { value: "", text: "" });
            }
            return this;
        }
    };

    $.fn.organizationPicker = function (options) {

        if (organizationPickerMethods[options]) {
            return organizationPickerMethods[options].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (options && typeof options != "object") {
            $.error("Method " + options + " does not exists on organizationPicker.");
        }

        var picker = this;

        var app = options.app;
        var Base = app.Base || new CBLabs.CybozuConnect.Base(app);

        var menuHtml = createOrgHierarchy(options, Base);
        $(this).treeviewMenu({ content: menuHtml, chooseText: "（グループ選択）" });
        return this;
    };

    // private functions

    function createOrgHierarchy(options, Base) {
        var html = '<ul>';
        if (options.includeAll) {
            html += '<li><a href="#" id="0">（全員）</a></li>';
        }
        var orgList = Base.organizationList();
        if (orgList) {
            for (var i = 0; i < orgList.length; i++) {
                var topOrg = orgList[i];
                html += '<li><a href="#" id="' + topOrg.id + '">' + $.cybozuConnect.htmlEscape(topOrg.name) + "</a>";
                if (topOrg.orgIdList && topOrg.orgIdList.length) {
                    html += createSubOrgHierarchy(topOrg, Base);
                }
                html += "</li>";
            }
        }
        html += "</ul>";
        return html;
    }

    function createSubOrgHierarchy(org, Base) {
        var html = "<ul>";
        for (var i = 0; i < org.orgIdList.length; i++) {
            var childOrg = Base.organization(org.orgIdList[i]);
            if (childOrg) {
                html += '<li><a href="#" id="' + childOrg.id + '">' + $.cybozuConnect.htmlEscape(childOrg.name) + "</a>";
                if (childOrg.orgIdList && childOrg.orgIdList.length) {
                    html += createSubOrgHierarchy(childOrg, Base);
                }
                html += "</li>";
            }
        }
        html += "</ul>";
        return html;
    }

})(jQuery);
