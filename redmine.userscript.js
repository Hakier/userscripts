// ==UserScript==
// @name         Redmine
// @namespace    http://devhq.pl/
// @version      0.1
// @description  Set task data
// @author       Hakier
// @match        http://devhq.pl/redmine/*
// @grant        none
// @require     http://code.jquery.com/jquery-latest.js
// ==/UserScript==

jQuery(function ($) {
    //localStorage.setItem('state', 1); return;

    var autoSubmit = true,
        getIdFromPath = function () {
            return parseInt(
                location.pathname.replace(/[^0-9]*/, '')
            );
        },
        task = {
            parent: null,
            subject: null,
            description: null,
            startDate: null,
            dueDate: null,
            timeForWork: null,
            status: null
        },
        time = {
            id: null,
            taskId: null,
            date: null,
            hours: 0
        },
        redmine = {
            init: function () {
                this.common.init();
            },
            common: {
                states: {
                    /**
                     * Task
                     */
                    CHECK_IF_ISSUE_NOT_EXIST: 1,
                    CREATE_ISSUE_FROM_PARENT_PAGE: 2,
                    COMPLETE_ISSUE_DATA: 3,
                    CLOSE_REDMINE: 4,
                    /**
                     * Time
                     */
                    CHECK_IF_TIME_NOT_EXIST: 11,
                    ADD_TIME: 12,
                    GO_TO_ISSUE_TIME_ENTRIES: 13,
                    CHECK_TIME_WAS_ADDED: 14
                },
                init: function () {
                    this._initStateIfEmpty();
                    
                    console.log(this._getState());

                    switch (this._getState()) {
                        case this.states.CHECK_IF_ISSUE_NOT_EXIST:
                            redmine.task._stateCheckIfIssueNotExist();
                            break;

                        case this.states.CREATE_ISSUE_FROM_PARENT_PAGE:
                            redmine.task._stateCreateIssueFromParentPage();
                            break;

                        case this.states.COMPLETE_ISSUE_DATA:
                            redmine.task._stateCompleteIssueData();
                            break;

                        case this.states.CLOSE_REDMINE:
                            redmine.task._stateCloseRedmine();
                            break;


                        case this.states.CHECK_IF_TIME_NOT_EXIST:
                            redmine.time._stateCheckIfTimeNotExist();
                            break;

                        case this.states.ADD_TIME:
                            redmine.time._stateAddTime();
                            break;

                        case this.states.GO_TO_ISSUE_TIME_ENTRIES:
                            redmine.time._stateGoToIssueTimeEntries();
                            break;

                        case this.states.CHECK_TIME_WAS_ADDED:
                            redmine.time._stateCheckTimeWasAdded();
                            break;

                        default:
                            alert('unknown state: ' + this._getState());
                    }
                },
                _initStateIfEmpty: function () {
                    if (redmine.task._hasTask() && (!this._getState() || this._getState() > 10)) {
                        this._setState(
                            this.states.CHECK_IF_ISSUE_NOT_EXIST
                        );
                        return;
                    }
                    if (redmine.time._hasTime() && (!this._getState() || this._getState() <= 10)) {
                        this._setState(
                            this.states.CHECK_IF_TIME_NOT_EXIST
                        );
                        return;
                    }
                },
                _isIssuePage: function () {
                    return location.pathname.match(/redmine\/issues\/[0-9]*/);
                },
                _alertWrongState: function() {
                    alert('WRONG STATE: ' + this._getState());
                },
                _getState: function () {
                    return parseInt(
                        localStorage.getItem('state')
                    );
                },
                _setState: function (state) {
                    localStorage.setItem('state', state)
                },
                _incrementState: function () {
                    this._setState(
                        this._getState() + 1
                    );
                },
                _getObjectFromHash: function () {
                    if (!location.hash) {
                        return null;
                    }

                    var hash = location.hash.split('::');

                    return JSON.parse(hash[1]);
                },
                _getHashType: function () {
                    if (!location.hash) {
                        return null;
                    }

                    var hash = location.hash.split('::');

                    return hash[0];
                }
            },
            task: {
                _stateCheckIfIssueNotExist: function () {
                    var id = getIdFromPath(),
                        $h2 = $('#content > h2');

                    if (!this._hasTask()) {
                        return;
                    }

                    this._setTask();

                    if (!redmine.common._isIssuePage() || !$h2.length || task.id != id || parseInt($h2.text().trim()) != 404) {
                        return redmine.common._alertWrongState();
                    }

                    redmine.common._incrementState();

                    location.href = location.pathname.replace(/[0-9]*$/, '') + task.parent + location.hash;
                },
                _stateCreateIssueFromParentPage: function () {
                    var $addSubIssue = $('#issue_tree > div > a');

                    if (!redmine.common._isIssuePage() || !this._hasTask()) {
                        return redmine.common._alertWrongState();
                    }

                    redmine.common._incrementState();
                    location.href = $addSubIssue.attr('href') + location.hash;
                },
                _stateCompleteIssueData: function () {
                    if (!location.pathname.match(/^\/redmine\/projects\/[^/]*\/issues\/new.*/) || !this._hasTask()) {
                        return redmine.common._alertWrongState();
                    }

                    this._setTask();
                    this.form.setData();

                    redmine.common._incrementState();

                    this.form.submit();
                },
                _stateCloseRedmine: function () {
                    redmine.common._setState(
                        this.states.CHECK_IF_ISSUE_NOT_EXIST
                    );

                    if (autoSubmit) {
                        location.href = 'http://fashioo.devhq.pl/task/' + (getIdFromPath() + 1);
                    }
                },
                form: {
                    setData: function () {
                        this
                            ._setSubject()
                            ._setDescription()
                            ._setStatus()
                            ._setAssignedTo()
                            ._setDoneRatio()
                            ._setStartDate()
                            ._setDueDate()
                            ._setEstimatedHours();
                    },
                    _setSubject: function () {
                        $('#issue_subject').val(task.subject);

                        return this;
                    },
                    _setDescription: function () {
                        $('#issue_description').val(task.description);

                        return this;
                    },
                    _setStatus: function () {
                        $('#issue_status_id > option[value=' + task.status + ']').attr('selected', true);

                        return this;
                    },
                    _setAssignedTo: function () {
                        $('#issue_assigned_to_id > option:nth-child(3)').attr('selected', true);

                        return this;
                    },
                    _setDoneRatio: function () {
                        $('#issue_done_ratio > option:nth-child(11)').attr('selected', true);

                        return this;
                    },
                    _setStartDate: function () {
                        $('#issue_start_date').val(task.startDate);

                        return this;
                    },
                    _setDueDate: function () {
                        $('#issue_due_date').val(task.dueDate);

                        return this;
                    },
                    _setEstimatedHours: function () {
                        var timeForWork = {
                                h: task.timeForWork.replace(/:[0-9]*/, ''),
                                min: task.timeForWork.replace(/[0-9]*:/, '')
                            },
                            estimatedHours = parseFloat(timeForWork.h) + parseFloat(timeForWork.min / 60);

                        if (parseFloat(estimatedHours) > 0) {
                            $('#issue_estimated_hours').val(estimatedHours);
                        }

                        return this;
                    },
                    submit: function () {
                        if (autoSubmit) {
                            $('#issue-form').submit();
                        }
                    }
                },
                _hasTask: function () {
                    return redmine.common._getHashType() == '#task';
                },
                _setTask: function () {
                    if (this._hasTask()) {
                        task = redmine.common._getObjectFromHash();
                    }
                }
            },
            time: {
                _stateCheckIfTimeNotExist: function () {
                    if (!this._hasTime()) {
                        return;
                    }

                    if (!location.pathname.match(/time_entries$/) || this._getTimeFromRedmine().length) {
                        return redmine.common._alertWrongState();
                    }

                    this._setTime();

                    location.pathname = 'redmine/issues/{taskId}/time_entries/new'.replace('{taskId}', time.taskId);

                    redmine.common._incrementState();
                },
                _stateAddTime: function () {
                    if (!this._hasTime()) {
                        return;
                    }

                    if (!location.pathname.match(/time_entries\/new$/) || $('#content > h2').text().trim() != 'Przepracowany czas') {
                        return redmine.common._alertWrongState();
                    }

                    this._setTimeToLocalStorage();
                    this.form.setData();

                    redmine.common._incrementState();

                    this.form.submit();
                },
                _stateGoToIssueTimeEntries: function () {
                    this._setTimeFromLocalStorage();

                    redmine.common._incrementState();

                    location.pathname = 'redmine/issues/{taskId}/time_entries'.replace('{taskId}', time.taskId);
                },
                _stateCheckTimeWasAdded: function () {
                    if (!location.pathname.match(/time_entries$/) || $('#content > h2').text().trim() != 'Przepracowany czas') {
                        return redmine.common._alertWrongState();
                    }

                    this._setTimeFromLocalStorage();

                    var $timeCheckbox = this._getTimeFromRedmine();

                    if (!$timeCheckbox.length) {
                        return alert('No such time');
                    }

                    var $timeTr = $timeCheckbox.closest('tr');

                    if ($timeTr.find('.hours').text().trim() != time.hours) {
                        return alert('Bad hours');
                    }

                    if ($timeTr.find('.issue a').attr('href').replace(/.*\//, '') != time.taskId) {
                        return alert('Bad taskId');
                    }

                    if ($timeTr.find('.spent_on').text().trim() != time.date) {
                        return alert('Bad date');
                    }

                    redmine.common._setState(
                        redmine.common.states.COMPLETE_ISSUE_DATA
                    );

                    location.href = 'http://fashioo.devhq.pl/task/time/edit/{timeId}'.replace('{timeId}', (parseInt(time.id) + 1));
                },
                _setTimeToLocalStorage: function () {
                    this._setTime();
                    localStorage.setItem('time', JSON.stringify(time));
                },
                _setTimeFromLocalStorage: function () {
                    time = JSON.parse(
                        localStorage.getItem('time')
                    );
                },
                _setTime: function () {
                    if (this._hasTime()) {
                        time = redmine.common._getObjectFromHash();
                    }
                },
                _hasTime: function () {
                    return redmine.common._getHashType() == '#time';
                },
                _getTimeFromRedmine: function () {
                    return $('#content .autoscroll table tr td.checkbox.hide-when-print > input[name="ids[]"][value="' + time.id + '"]');
                },
                form: {
                    setData: function () {
                        this
                            ._setDate()
                            ._setHours()
                            ._setActivity();
                    },
                    _setDate: function () {
                        $('#time_entry_spent_on').val(time.date);

                        return this;
                    },
                    _setHours: function () {
                        $('#time_entry_hours').val(time.hours);

                        return this;
                    },
                    _setActivity: function () {
                        $('#time_entry_activity_id > option[value=9]').attr('selected', true);

                        return this;
                    },
                    submit: function () {
                        $('form#new_time_entry').submit();
                    }
                }
            }
        };

    redmine.init();
});
