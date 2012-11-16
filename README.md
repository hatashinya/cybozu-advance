Cybozu Advance
==============

ラッグ＆ドロップ可能なスケジュール

![Cybozu Advance](http://developer.cybozu.co.jp/photos/uncategorized/2011/02/01/cybozuadvance_5.png)

概要
----
Cybozu Advance はサイボウズの連携APIを利用したWebアプリケーションです。

ライセンス
---------
[GNU GPL v2](http://www.gnu.org/licenses/old-licenses/gpl-2.0.html)

更新情報
--------
* 1.1.4 (2012/11/16)
  * [不具合改修](https://github.com/hatashinya/cybozu-advance/issues?milestone=1&page=1&state=closed)
* 1.1.3 (2012/08/03)
  * グループ、および設備グループの数が０のとき予定登録時にエラーとなる不具合を修正
* 1.1.2 (2012/04/01)
  * Cookie認証への対応
  * サイボウズ製品のライセンスが切れた場合のエラーメッセージ
  * 期間予定で終了日付が指定されていない場合に登録・変更できない不具合を修正
* 1.1.1 (2011/04/07)
  * [不具合改修](http://code.google.com/p/cybozu-advance/issues/detail?id=1)
* 1.1.0 (2011/03/02)
  * ドラッグ＆ドロップ時の確認ダイアログ
  * 元ページへのリンク
  * フォロー
  * ポートレット
  * Google Calendar の重ね合わせ表示
  * 個人設定
* 1.0.1 (2011/02/03)
  * XSS脆弱性を修正
* 1.0.0 (2011/02/01)
  * 初版

特徴
----
* HTML と JavaScript のみで実装されています。
* ドラッグ＆ドロップによる操作が行えます。
* Google Calendar を重ね合わせることができます。
* タイムゾーンに対応しています。
  * 注）サーバーのタイムゾーンではなく、ブラウザが動作するPCのタイムゾーンで時刻が表示されます。

機能
----
* スケジュール
  * ドラッグ＆ドロップによる予定の移動
  * ドラッグによる予定の時間変更
  * 予定の登録・変更・削除
  * 個人予定の月・週・日表示
  * グループ予定の週表示
  * 予定の詳細表示
  * [ポートレット](https://github.com/hatashinya/cybozu-advance/wiki/Portlet)
  * [Google Calendar の重ね合わせ表示](https://github.com/hatashinya/cybozu-advance/wiki/GoogleCalendar)

デモ
----
* [Cybozu Advance オンラインデモ](http://onlinedemo.cybozu.co.jp/cybozu-advance/index.html)
  * [サイボウズ ガルーン 3 のオンラインデモ](http://g.cybozu.co.jp/trial/index.html) のAPIにアクセスしています。

対応API
-------
* [サイボウズ(R) Office(R) 9 連携API](http://products.cybozu.co.jp/api/) 1.0.0
* [サイボウズ(R) ガルーン(R) 3 連携API](http://products.cybozu.co.jp/garoon/solution/api/information/index.html) 1.0.0

必要システム
------------
* 以下のいずれかのサイボウズ製品
  * [サイボウズ(R) Office(R)](http://products.cybozu.co.jp/office/) Version 9.1.0 以降
  * [サイボウズ(R) ガルーン(R)](http://products.cybozu.co.jp/garoon/) Version 3.0.0 以降
* 以下の JavaScript ライブラリに依存しています。（同梱しています。）
  * [jQuery](http://jquery.com/) v1.4.1 以降
  * [jQuery UI](http://jqueryui.com/) v.1.8.6 以降
  * [FullCalendar](http://arshaw.com/fullcalendar/) v1.4.10 以降
  * [jquery-treeview](http://bassistance.de/jquery-plugins/jquery-plugin-treeview/) v1.4.1 以降
  * [jquery-timeRangePicker](https://github.com/hatashinya/jquery-timeRangePicker)
  * [jquery-treeview-menu](https://github.com/hatashinya/jquery-treeview-menu)
  * [jquery-groupedItemPicker](https://github.com/hatashinya/jquery-groupedItemPicker)
  * [cybozu-connect](https://github.com/hatashinya/cybozu-connect)

動作確認済み製品バージョン、およびブラウザ
------------------------------------------
* 製品バージョン
  * サイボウズ Office 9.2
 * サイボウズ ガルーン 3.5
* ブラウザ
 * Internet Expolorer 9
 * Firefox 16
 * Google Chrome 23

インストール
------------
1. zip ファイルをダウンロードし、適当なディレクトリで展開します。
2. サイボウズ製品が動作するWebサーバー（IIS、Apache 等）の、ドキュメントルート以下の適当なディレクトリ（仮想ディレクトリでもよい）に、展開した内容をコピーします。
  * JavaScript では、基本的にクロスドメインでのデータソースへのアクセスが認められていないので、同じWebサーバー上にインストールする必要があります。
3. インストール先のディレクトリの config.js に、サイボウズ製品へアクセスするURLを記述してください。
  * Cookie認証を行う場合は次の１行を追加してください。 var useSSO = true;
4. インストール先のディレクトリの index.html に、ブラウザからアクセスします。

Cookie認証について
------------------
* Cookie認証はサイボウズ Office 9.1 以降でのみ対応しています。
* Cookie認証を行うと、サイボウズ Office から Cybozu Advance へシングルサインオンが実現します。

セキュリティ
------------
* APIアクセスの度に、ログイン名およびパスワードをプレーンテキストでサーバーに送信しています。セキュリティを確保するためには、SSLをご利用ください。

開発・提供元
------------
[サイボウズ・ラボ株式会社](http://labs.cybozu.co.jp/)

著作権
------
Copyright (C) 2011 [Cybozu Labs, Inc.](http://labs.cybozu.co.jp/)

備考
----
* Cybozu Advance はサイボウズの **サポートの対象外** となります。あらかじめご了承ください。
