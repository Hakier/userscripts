// ==UserScript==
// @name         Redmine Tools
// @namespace    http://devhq.pl/
// @version      0.1
// @description  Set task data
// @author       Hakier
// @match        http://devhq.pl/redmine/*
// @match        http://redmine.positiv/*
// @grant        none
// @require     http://code.jquery.com/jquery-latest.js
// ==/UserScript==

jQuery(function ($) {
    redmine = {
        init: function () {
            this._addButtonToCreateListFromNotes();
        },
        _addButtonToCreateListFromNotes: function () {
            if (!location.pathname.match(/^\/issues\/[0-9]*$/)) {
                return;
            }

            var buttonHTML = '<span id="create-list-from-notes" class="icon icon-edit checklist-new-only save-new-by-button" style="cursor: pointer;">Utwórz listę z notatki</span>',
                checkList = {
                    $notes: $('#issue_notes'),
                    getInput: function () {
                        return $('#checklist_form_items .checklist-edit-box > input.edit-box');
                    },
                    getSubmit: function () {
                        return $('#checklist_form_items > span.checklist-item.new > span.icon.icon-add.checklist-new-only.save-new-by-button');
                    }
                };

            checkList.getSubmit().after(buttonHTML);

            $('body').on('click', '#create-list-from-notes', function () {
                var list = checkList.$notes.val().trim().split('\n');

                $.each(JSON.parse(JSON.stringify(list)), function (key, val) {
                    checkList.getInput().val(val);
                    checkList.getSubmit().click();
                });

                checkList.$notes.val('');

                $('#create-list-from-notes').remove();

                checkList.getSubmit().after(buttonHTML);
            });
        }
    };

    redmine.init();
});
