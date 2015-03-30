// ==UserScript==
// @name         History logger
// @namespace    http://devhq.pl/
// @version      0.1
// @description  Store history of visited pages
// @author       Hakier
// @match        *
// @grant        none
// @require     http://code.jquery.com/jquery-latest.js
// ==/UserScript==

jQuery.extend({
    isUndefined: function (value) {
        return typeof value === 'undefined';
    },
    isDefined: function (value) {
        return typeof value !== 'undefined';
    },
    isObject: function (value) {
        return value !== null && typeof value === 'object';
    },
    replacePattern: function (pattern, replacement) {
        if (typeof replacement !== 'object') {
            throw 'Replacement is not an object: ' + (typeof replacement);
        }

        $.each(replacement, function (key, val) {
            pattern = pattern.replace(
                '{' + key + '}',
                val
            );
        });

        return pattern;
    },
    changePath: function (pathPattern, replacement) {
        location.pathname = this.replacePattern(pathPattern, replacement);
    },
    incrementDay: function (dateString, incrementDays) {
        var date = new Date(dateString);

        date.setTime(date.getTime() + incrementDays * 86400000);

        var month = parseInt(date.getMonth()) + 1,
            day = date.getDate();

        if (month < 10) {
            month = '0' + month;
        }

        if (day < 10) {
            day = '0' + day;
        }

        return date.getFullYear() + '-' + month + '-' + day;
    },
    dateStringToDate: function (dateString) {
        var dateArray = dateString.split('-'),
            dayArray = dateArray[2].split(' '),
            hourArray = dayArray[1].split(':'),
            dateMap = {
                year: dateArray[0],
                month: dateArray[1],
                day: dayArray[0],
                hour: hourArray[0],
                minute: hourArray[1]
            };

        return new Date(dateMap.year, dateMap.month - 1, dateMap.day, dateMap.hour, dateMap.minute);
    },
    getNumberWithLeadingZeroes: function(number, numberLength) {
        var numberWithLeadingZeroes = number.toString(),
            currentLength = numberWithLeadingZeroes.length;

        for (; currentLength < numberLength; currentLength++) {
            numberWithLeadingZeroes = '0' + numberWithLeadingZeroes;
        }

        return numberWithLeadingZeroes;
    },
    dateToString: function (date, template) {
        if ($.isUndefined(template)) {
            template = '{year}-{month}-{day}';
        }

        return $.replacePattern(template, {
            year: date.getFullYear(),
            month: $.getNumberWithLeadingZeroes(date.getMonth() + 1, 2),
            day: $.getNumberWithLeadingZeroes(date.getDate(), 2)
        })
    }
});

jQuery(function ($) {
    var host = location.protocol + '//' + location.hostname,
        currentHref = location.href.replace(
            host,
            ''
        ),
        visited = JSON.parse(
            localStorage.getItem('visited')
        ),
        date = new Date();

    if (!$.isObject(visited)) {
        visited = {};
    }

    visited[currentHref] = date;

    localStorage.setItem(
        'visited',
        JSON.stringify(visited)
    );

    $('a').each(function () {
        var $a = $(this),
            href = $a.attr('href').trim().replace(
                host,
                ''
            );

        if ($.isDefined(visited[href])) {
            $a.css({
                outline: '10px solid #FF0 !important'
            }).addClass('visited');
            
            console.log($a);
        }
    });

    $('.bannerTop .logo').on('click', function() {
        if (confirm('wyczyścić historię?')) {
            localStorage.setItem(
                'visited',
                JSON.stringify({})
            );
        }
    });
});
