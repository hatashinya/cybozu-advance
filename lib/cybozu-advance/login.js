/*
* Cybozu Advance v1.1.3
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

CBLabs.CybozuAdvance.LicenseError = {
    garoon: { code: "GRN_CBPAPI_63006", message: "サイボウズ ガルーンの試用期限、またはサービスライセンスの有効期限が切れています。\n\nCybozu Advance はサイボウズ ガルーンの連携APIを利用しています。製品のバージョンによっては、連携APIを利用するためには製品のサービスライセンスを購入する必要があります。" },
    office: { code: "19107", message: "サイボウズ Office の試用期限、または保守ライセンスの有効期限が切れています。\n\nCybozu Advance はサイボウズ Office の連携APIを利用しています。製品のバージョンによっては、連携APIを利用するためには製品の保守ライセンスを購入する必要があります。" }
};

CBLabs.CybozuAdvance.Login = function (options) {

    // private variables
    var app = options.app;
    var initArgs = null;
    var keypressBinded = false;

    this.init = function (selector, afterLogin) {

        initArgs = { selector: selector, afterLogin: afterLogin };

        useSSO = window.useSSO || false;
        if (useSSO) {
            // try single sign on
            if (app.sso()) {
                if (afterLogin) afterLogin();
                return;
            }
        }

        if (!keypressBinded) {
            $(selector + "-password").keypress(function (event) {
                if (event.which == 13) login();
            });
            keypressBinded = true;
        }

        if (sessionStorage.username && sessionStorage.password) {
            if (app.auth(sessionStorage.username, sessionStorage.password)) {
                if (afterLogin) afterLogin();
                return;
            }
            sessionStorage.username = null;
            sessionStorage.password = null;
        }

        openLoginDialog();
    };

    function openLoginDialog() {
        var selector = initArgs.selector;
        $(selector + "-username").val("");
        $(selector + "-password").val("");
        $(selector).dialog({
            autoOpen: true,
            width: 300,
            modal: true,
            buttons: [
                {
                    text: "ログイン",
                    click: function () {
                        login();
                    }
                }
            ]
        });

        $(selector + "-username").focus();
    }

    function login() {
        var selector = initArgs.selector;
        var username = $(selector + "-username").val();
        var password = $(selector + "-password").val();
        app.auth(username, password);
        if (app.error) {
            if (app.error.code == CBLabs.CybozuAdvance.LicenseError.garoon.code) {
                alert(CBLabs.CybozuAdvance.LicenseError.garoon.message);
            } else if (app.error.code == CBLabs.CybozuAdvance.LicenseError.office.code) {
                alert(CBLabs.CybozuAdvance.LicenseError.office.message);
            } else {
                alert(app.error.message);
            }
        } else {
            sessionStorage.username = username;
            sessionStorage.password = password;
            $(selector).dialog("close");
            if (initArgs.afterLogin) {
                initArgs.afterLogin();
            }
        }
    }

    this.logout = function (nextLogin) {
        sessionStorage.username = null;
        sessionStorage.password = null;
        app.clearAuth();

        if (nextLogin && initArgs) {
            openLoginDialog();
        }
    };
};
