// ==UserScript==
// @name         Kompass Tools
// @namespace    http://devhq.pl/
// @version      0.0.1
// @description  Kompass shortcuts
// @author       Hakier
// @match        http://dev.kompass.positiv.devhq.pl/*
// @grant        none
// @require      https://raw.githubusercontent.com/jeresig/jquery.hotkeys/master/jquery.hotkeys.js
// ==/UserScript==

jQuery(function ($) {
    var bindKey = function (keys, fn, preventDefault) {
            if (preventDefault) {
                return $(document).on('keydown', null, keys, function (e) {
                    e.preventDefault();

                    fn();
                });
            }

            return $(document).on('keydown', null, keys, fn);
        },
        debug = {
            isEnabled: false,
            dump: function () {
                if (this.isEnabled) {
                    console.log(arguments);
                }
            }
        },
        kompass = {
            init: function () {
                this.com.init();
                this.process.init();
            },
            com: {
                init: function () {
                    debug.dump('kompass.com.init');

                    this._bindKeys();
                },
                _bindKeys: function () {
                    debug.dump('kompass.com._bindKeys');

                    var toggleOptions = function () {
                        debug.dump('kompass.com._bindKeys:toggleOptions');

                        $('.mainSettingsMain > ul > li > ul').toggle();
                    };

                    bindKey('alt+o', toggleOptions);
                }
            },
            process: {
                init: function () {
                    debug.dump('kompass.process.init');

                    this.create.init();
                },
                create: {
                    init: function () {
                        debug.dump('kompass.process.create.init');

                        if (!kompass.isPath.process.create) {
                            return;
                        }

                        this._bindKeys();
                    },
                    _bindKeys: function () {
                        debug.dump('kompass.process.create:_bindKeys');

                        var addNewTask = function () {
                                debug.dump('kompass.process._bindKeys:addNewTask');

                                var $btnAddNewTask = $('.form-actions > button[name=btn_add_new_task]');

                                $btnAddNewTask.click();
                            },
                            triggerDateStartChange = function () {
                                var $dateStart = $('#tasks-container form:first').find('input[id$=data_start]');

                                $dateStart.val('2015-06-24T08:15:00+0200');

                                $dateStart.trigger('dp.change');
                            };

                        bindKey('alt+n', addNewTask);
                        bindKey('shift+s', triggerDateStartChange);
                    }
                }
            },
            isPath: {
                process: {
                    create: location.pathname.match('/task/process/create')
                }
            }
        };

    kompass.init();
});
