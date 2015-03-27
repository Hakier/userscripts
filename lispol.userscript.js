// ==UserScript==
// @name         Lispol
// @namespace    http://devhq.pl/
// @version      0.1
// @description  Set sort order
// @author       Hakier
// @match        http://lispol.pl/*
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
    setItem: function (key, object) {
        return localStorage.setItem(key, JSON.stringify(object));
    },
    getItem: function (key) {
        return JSON.parse(
            localStorage.getItem(key)
        );
    }
});

jQuery.fn.extend({
    tagName: function () {
        return this.prop('tagName');
    },
    tagNameLowerCase: function () {
        return this.prop('tagName').toLowerCase();
    }
});

jQuery(function ($) {
    var lispol = function () {
        var common = {
                init: function () {
                    this
                        ._sortByPrice()
                        ._setLimit(500);

                    order
                        .getItems()
                        .getDetails()
                        //.addQtyToProductOnList()
                        .setItems();

                    //basket.getDetails();

                },
                findQtyNthInHeader: function ($element) {
                    var i = 1,
                        quantityNthChildNumber = null;

                    $element.each(function () {
                        if ($(this).text().trim().match('Ilość')) {
                            quantityNthChildNumber = i;
                        }

                        i++;
                    });

                    return quantityNthChildNumber;
                },
                _setLimit: function (limit) {
                    if (location.search.match('limit=' + limit)) {
                        return this;
                    }

                    var $limit = $('input.form_text[name=limit]:first');

                    if ($limit.length) {
                        $limit
                            .val(limit)
                            .closest('form')
                            .submit();
                    }

                    return this;
                },
                _sortByPrice: function () {
                    if (location.search.match(/sort=2-0/)) {
                        return this;
                    }

                    var $sortByPrice = $('a:contains(Zmień sposób wyświetlania):first').closest('form').find('a:contains(Cena):first').click();

                    if ($sortByPrice.length && $sortByPrice.attr('href')) {
                        location.href = 'http://lispol.pl/' + $sortByPrice.attr('href');
                    }

                    return this;
                }
            },
            productList = {
                $: {
                    itemQtyElements: $('div.product_list_item table.links tbody tr td.a p.pr_sztuk')
                },
                getIdFromQtyElement: function ($qtyElement) {
                    return $qtyElement
                        .closest('tr')
                        .find('a')
                        .attr('onclick')
                        .trim()
                        .replace(/^basket\.add\(([0-9]*)\).*$/, '$1');
                }
            },
            order = {
                $: {
                    heading: {
                        order: {
                            details: null,
                            number: null,
                            positions: null
                        }
                    },
                    order: {
                        number: null,
                        positionsTable: null
                    }
                },
                getDetails: function () {
                    if (!location.search.match(/\?a=order&b=show&id=[0-9]*/)) {
                        return;
                    }

                    if (!this._setHeadingOrderDetails() || !this._setHeadingOrderNumber() || !this._setOrderNumber()) {
                        console.log(this);

                        return this;
                    }

                    var orderNumber = this.$.order.number.text().trim(),
                        quantityNthChildNumber = null;

                    if (this._setHeadingOrderPositions()) {
                        this.$.order.positionsTable = this.$.heading.order.positions.next('table.list1');

                        quantityNthChildNumber = common.findQtyNthInHeader(
                            this.$.order.positionsTable.find('thead td')
                        );
                        this.items[orderNumber] = this._findItemsInTableBody(
                            this.$.order.positionsTable.find('tbody tr')
                        );
                    }

                    this.items.summary = {};

                    $.each(this.items, function (orderId, order) {
                        if (orderId !== 'summary') {
                            $.each(order, function (itemId, item) {
                                if ($.isUndefined(order.items.summary[itemId])) {
                                    order.items.summary[itemId] = 0;
                                }

                                order.items.summary[itemId] += parseFloat(item.qty);
                            })
                        }
                    });

                    console.log(order.items.summary);

                    return this;
                },
                addQtyToProductOnList: function () {
                    productList.$.itemQtyElements.each(function () {
                        var $qty = $(this),
                            id = productList.getIdFromQtyElement($qty);

                        if ($.isDefined(order.items.summary[id])) {
                            $qty.append(
                                '<span style="color: red;">({qty})</span>'.replace('{qty}', order.items.summary[id])
                            );
                        }
                    });

                    return this;
                },
                setItems: function () {
                    $.setItem('order.items', order.items);
                },
                getItems: function () {
                    order.items = $.getItem('order.items');

                    if (!$.isObject(order.items)) {
                        order.items = {};
                    }

                    console.log(order.items);

                    return this;
                },
                _findItemsInTableBody: function ($trElements, quantityNthChildNumber) {
                    var items = {};

                    if (!$trElements.length) {
                        console.log('bad $trElements');

                        return;
                    }

                    if ($.isUndefined(quantityNthChildNumber)) {
                        console.log('quantityNthChildNumber not defined');

                        return;
                    }

                    $trElements.each(function () {
                        var $tr = $(this),
                            $a = null,
                            id = null;

                        if ($tr.tagNameLowerCase() != 'tr') {
                            console.log('$trElements has no tr');
                        }

                        $a = $tr.find('a');
                        id = $a.attr('href').replace(/.*id=/, '');

                        items[id] = {
                            qty: order._findQtyInTr($tr, quantityNthChildNumber)
                        };
                    });

                    return items;
                },
                _findQtyInTr: function ($element, quantityNthChildNumber) {
                    var selector = 'td:nth-child({quantityNthChildNumber})'.replace(
                        '{quantityNthChildNumber}',
                        quantityNthChildNumber
                    );

                    return parseFloat(
                        $element
                            .find(selector)
                            .text()
                            .trim()
                            .replace(/^([0-9]*)[^0-9]*([0-9]*)[^0-9]*.*$/, '$2')
                    );
                },
                _setOrderNumber: function () {
                    this.$.order.number = this.$.heading.order.details.closest('tr').find('td.big');

                    if (!this.$.order.number.length) {
                        console.log('order.number not found', this.$.order.number);

                        return false;
                    }

                    return true;
                },
                _setHeadingOrderPositions: function () {
                    this.$.heading.order.positions = this._getHeadingContaining('Lista pozycji zamówienia');

                    if (!this.$.heading.order.positions.length) {
                        console.log('heading.order.positions not found', this.$.heading.order.positions);

                        return false;
                    }

                    return true;
                },
                _setHeadingOrderNumber: function () {
                    this.$.heading.order.number = this._getDetailsRowContaining('Numer zamówienia');

                    if (!this.$.heading.order.number.length) {
                        console.log('heading.order.number not found', this.$.heading.order.number);

                        return false;
                    }

                    return true;
                },
                _setHeadingOrderDetails: function () {
                    this.$.heading.order.details = this._getHeadingContaining('Szczegóły zamówienia');

                    return this.$.heading.order.details.length && this.$.heading.order.details.text().trim() == 'Szczegóły zamówienia';
                },
                _getDetailsRowContaining: function (containsString) {
                    return this.$.heading.order.details.parent('td').find('table.view tr td.a.first:contains(' + containsString + ')');
                },
                _getHeadingContaining: function (containsString) {
                    return $('div.naglowek:contains(' + containsString + ')');
                }
            },
            basket = {
                items: {},
                getDetails: function () {
                    if (location.search != '?a=basket&b=show') {
                        return;
                    }

                    var $table = $('table.list1'),
                        $theadTd = $table.find('thead td'),
                        $tbodyTr = $table.find('tbody tr'),
                        quantityNthChildNumber = common.findQtyNthInHeader($theadTd);

                    this.items = this._findItemsInTableBody($tbodyTr, quantityNthChildNumber);
                },
                addQtyToProductOnList: function () {
                    productList.$.itemQtyElements.each(function () {
                        var $qty = $(this),
                            id = productList.getIdFromQtyElement($qty);

                        if ($.isDefined(basket.items[id])) {
                            $qty.append(
                                '<span style="color: green;">({qty})</span>'.replace('{qty}', basket.items[id])
                            );
                        }
                    });

                    return this;
                },
                _findItemsInTableBody: function ($trElements, quantityNthChildNumber) {
                    var items = {};

                    if (!$trElements.length) {
                        console.log('bad $trElements');

                        return;
                    }

                    if ($.isUndefined(quantityNthChildNumber)) {
                        console.log('quantityNthChildNumber not defined');

                        return;
                    }

                    $trElements.each(function () {
                        var $tr = $(this),
                            $a = null,
                            id = null;

                        if ($tr.tagNameLowerCase() != 'tr') {
                            console.log('$trElements has no tr');
                        }

                        $a = $tr.find('a.pr_name');
                        id = $a.attr('href').replace(/.*id=/, '');

                        items[id] = {
                            qty: $tr.find('input[id^=produkt_ile_item]')
                        };
                    });

                    return items;
                }
            };

        console.log('lispol');

        common.init();
    };

    lispol();
});
