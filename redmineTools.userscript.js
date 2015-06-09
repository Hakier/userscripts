// ==UserScript==
// @name         Redmine Tools
// @namespace    http://devhq.pl/
// @version      0.1
// @description  Set task data
// @author       Hakier
// @match        http://devhq.pl/redmine/*
// @match        http://redmine.dpserver.pl/*
// @grant        none
// @require     http://code.jquery.com/jquery-latest.js
// ==/UserScript==

jQuery(function ($) {
    redmine = {
        $: {
            btn: {
                edit: $('#content > .contextual > a.icon.icon-edit:first')
            }
        },
        init: function () {
            this._addBtnToCreateListFromNotes();
            this._addBtnToCreateListOfChildrenFromNotes();

            this._createChild();

            this._createBtnToMarkIssueDone();
        },
        _isIssuePage: function () {
            return location.pathname.match(/^\/issues\/[0-9]*$/);
        },
        _addBtnToCreateListFromNotes: function () {
            if (!this._isIssuePage()) {
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
        },
        localStorageKeys: {
            childrenList: 'childrenList',
            createChildrenUrl: 'createChildrenUrl'
        },
        _addBtnToCreateListOfChildrenFromNotes: function () {
            if (!this._isIssuePage()) {
                return;
            }

            var $addChildBtn = $('#issue_tree .contextual a:last-child'),
                $addChildrenFromNotesBtn = $('<span id="add-children-from-notes" class="icon icon-edit checklist-new-only save-new-by-button" style="cursor: pointer;">Add children from notes</span>'),
                $notes = $('#issue_notes');

            $addChildrenFromNotesBtn
                .css({
                    marginRight: 20
                })
                .on('click', function () {
                    var list = $notes.val().trim().split('\n'),
                        createChildrenUrl = $addChildBtn.attr('href');

                    localStorage.setItem(
                        redmine.localStorageKeys.childrenList,
                        JSON.stringify(list)
                    );

                    localStorage.setItem(
                        redmine.localStorageKeys.createChildrenUrl,
                        createChildrenUrl
                    );

                    if (list.length > 1) {
                        $notes.val('');
                        location.href = createChildrenUrl;
                    }
                });

            $addChildBtn.before($addChildrenFromNotesBtn);
        },
        _createChild: function () {
            if (!location.pathname.match('/issues/new')) {
                return;
            }

            var list = JSON.parse(
                    localStorage.getItem(redmine.localStorageKeys.childrenList)
                ),
                first = list[0],
                $addAndContinueBtn = $('#issue-form > input[name="continue"]');

            if (first == undefined) {
                return;
            }

            list.shift();

            localStorage.setItem(
                redmine.localStorageKeys.childrenList,
                JSON.stringify(list)
            );

            $('#issue_subject').val(first);

            //if (first.length > 3) {
            //    $addAndContinueBtn.click();
            //}
        },
        _createBtnToMarkIssueDone: function () {
            if (!location.pathname.match(/issues\/[0-9]+/)) {
                return;
            }

            var $containerDescriptionEdit = $('#issue_description_and_toolbar').closest('p'),
                $btnDescriptionEdit = $containerDescriptionEdit.find('a:first'),
                $btnMarkAsDone = $('<a class="icon icon-save" style="margin-left: 20px; cursor: pointer;">Mark as done</a>');

            $btnMarkAsDone.on('click', function () {
                    var markAsDoneAndSubmit = function () {
                            var statusOption = {
                                    $inProgress: $('#issue_status_id option[value=2]'),
                                    $done: $('#issue_status_id option[value=5]')
                                },
                                $assignedToMe = $('#issue_assigned_to_id option:contains("<< ja >>")'),
                                $doneRatio = $('#issue_done_ratio option:last'),
                                $form = $('#issue-form'),
                                selectOption = function ($element) {
                                    if (!$element.length) {
                                        return false;
                                    }

                                    $element.attr('selected', true);

                                    return true;
                                };

                            selectOption($doneRatio);
                            selectOption($assignedToMe);
                            selectOption(statusOption.$done) || selectOption(statusOption.$inProgress);

                            $form.submit();
                        };

                    //redmine.$.btn.edit.click();
                    markAsDoneAndSubmit();
                }
            );
            
            $('#content > .contextual').prepend($btnMarkAsDone);
        }
    };

    redmine.init();
})
;
