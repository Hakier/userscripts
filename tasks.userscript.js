// ==UserScript==
// @name         Tasklist
// @namespace    http://devhq.pl/
// @version      0.2
// @description  Get task data
// @author       Hakier
// @match        http://fashioo.devhq.pl/task/*
// @grant        none
// @require     http://code.jquery.com/jquery-latest.js
// ==/UserScript==

jQuery.extend({
    isUndefined: function (value) {
        return typeof value === 'undefined';
    },
    isDefined: function (value) {
        return typeof value !== 'undefined';
    }
});

jQuery(function ($) {
    var getIdFromPath = function () {
            return location.pathname.replace(/[^0-9]*/, '');
        },
        redmine = {
            taskUrl: 'http://devhq.pl/redmine/issues/{taskId}',
            taskTimeListUrl: 'http://devhq.pl/redmine/issues/{taskId}/time_entries'
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
        taskList = {
            init: function () {
                if (!location.pathname.match(/^\/task\/[0-9]*$/)) {
                    return;
                }

                var $parent = $('#task-breadcrumb > li:last-child > a');

                task = {
                    id: getIdFromPath(),
                    parent: taskList._getParentId($parent),
                    subject: taskList._getSubject(),
                    description: taskList._getDescription(),
                    startDate: taskList._getStartDate(),
                    dueDate: taskList._getDueDate(),
                    timeForWork: taskList._getTimeForWork(),
                    status: taskList._getStatus()
                };

                $parent.attr('href', redmine.taskUrl.replace('{taskId}', task.id) + '#task::' + JSON.stringify(task));
            },
            _removeTimeSummary: function () {
                $('#properties-right > div:nth-child(5) > div > table > tbody > tr:last-child').remove();
            },
            _getParentId: function ($parent) {
                return $parent.attr('href').trim().replace(/[^0-9]*/, '');
            },
            _getSubject: function () {
                return $('#task-title a').text().trim().replace(/^#[0-9]* */, '');
            },
            _getDescription: function () {
                return $('#task-detail pre').text().trim();
            },
            _getStartDate: function () {
                return $('#properties-right > div:nth-child(1) > span').text().trim();
            },
            _getDueDate: function () {
                return $('#properties-right > div:nth-child(5) > div > table > tbody > tr:last-child > td:nth-child(3)').text().trim().replace(/ .*/, '');
            },
            _getTimeForWork: function () {
                var timeForWork = $('#properties-right > div:nth-child(5) > div > table > tbody > tr:last-child > td:nth-child(2)').text().trim();

                this._removeTimeSummary();

                return timeForWork;
            },
            _getStatus: function () {
                var status = $('#task-status > strong').text().trim();

                switch (status) {
                    case 'New':
                        return 1;
                    case 'Done':
                        return 5;
                    default:
                        alert('Unknown status: ' + status);
                }
            }
        },
        timeList = {
            init: function () {
                this._getTimeData();
                this._getTimeHours();
            },
            _getTimeData: function () {
                if (!location.pathname.match(/^\/task\/time\/edit\/[0-9]*$/)) {
                    return;
                }

                time = {
                    id: getIdFromPath(),
                    taskId: timeList._getTaskId(),
                    date: timeList._getDate()
                };

                if (time.id && time.taskId) {
                    localStorage.setItem('time', JSON.stringify(time));
                    location.pathname = '/task/time/{taskId}'.replace('{taskId}', time.taskId);
                }
            },
            _getTimeHours: function () {
                if (!location.pathname.match(/^\/task\/time\/[0-9]*$/)) {
                    return;
                }

                time = JSON.parse(
                    localStorage.getItem('time')
                );

                if ($.isUndefined(time.id) || $.isUndefined(time.taskId)) {
                    console.log(time);
                    return alert('Bad time object');
                }

                var $tdWithTimeId = $('.container table tr td > a[href="/task/time/edit/' + time.id + '"]');
                
                console.log($tdWithTimeId);

                if (!$tdWithTimeId.length) {
                    alert(
                        'not find time row with timeId: {timeId}'.replace('{timeId}', time.id)
                    );

                    return;
                }

                var hours = $tdWithTimeId.closest('tr').find('td:nth-child(4)').text().trim().split(':');

                if (hours.length < 2) {
                    alert('Bad hours');
                    console.log(hours);

                    return;
                }

                time.hours = parseInt(hours[0]) + parseFloat(parseInt(hours[1]) / 60);

                $('body > div.jumbotron > div > p > a').attr('href', redmine.taskTimeListUrl.replace('{taskId}', time.taskId) + '#time::' + JSON.stringify(time)).text('Add time to task');

                console.log(time);
            },
            _getTaskId: function () {
                return $('body > div.jumbotron > div > h1').text().trim().replace(/^#([0-9]*) .*$/, '$1');
            },
            _getDate: function () {
                return $('body > div.container.text-center > div > form > div:nth-child(1) > div.col-xs-9.text-left').text().trim().replace(/ .*/, '');
            }
        };

    taskList.init();
    timeList.init();
});
