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
    var selectOption = function ($element) {
            if (!$element.length) {
                return false;
            }

            $element.attr('selected', true);

            return true;
        },
        redmine = {
            $: {
                btn: {
                    edit: $('#content > .contextual > a.icon.icon-edit:first')
                }
            },
            issue: {
                $: {
                    statusOption: {
                        inProgress: $('#issue_status_id option[value=2]'),
                        done: $('#issue_status_id option[value=5]')
                    },
                    form: $('#issue-form')
                },
                assignToMe: function () {
                    var $assignedToMe = $('#issue_assigned_to_id option:contains("<< ja >>")');

                    selectOption($assignedToMe);

                    return this;
                },
                setRatioDone: function () {
                    var $doneRatio = $('#issue_done_ratio option:last');

                    selectOption($doneRatio);

                    return this;
                },
                setStatus: {
                    _setStatus: function (name) {
                        selectOption(redmine.issue.$.statusOption[name]);

                        return this;
                    },
                    inProgress: function () {
                        return this._setStatus('inProgress');
                    },
                    done: function () {
                        return this._setStatus('done');
                    }
                },
                submitForm: function () {
                    this.$.form.submit();
                }
            },
            init: function () {
                this._addBtnToCreateListFromNotes();
                this._addBtnToCreateListOfChildrenFromNotes();

                this._createChild();

                this._createBtnToMarkIssueDone();
                this._createBtnToMarkIssueInProgress();
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

                var $btnMarkAsDone = $('<a class="icon icon-save" style="margin-left: 20px; cursor: pointer;">Mark as done</a>');

                $btnMarkAsDone.on('click', function () {
                        redmine.issue
                            .assignToMe()
                            .setRatioDone()
                            .setStatus.inProgress().done();

                        redmine.issue.submitForm();
                    }
                );

                $('#content > .contextual').prepend($btnMarkAsDone);
            },
            _createBtnToMarkIssueInProgress: function () {
                if (!location.pathname.match(/issues\/[0-9]+/)) {
                    return;
                }

                var $btnMarkAsInProgress = $('<a class="icon icon-save" style="margin-left: 20px; cursor: pointer;">Mark as in progress</a>');

                $btnMarkAsInProgress.on('click', function () {
                        redmine.issue
                            .assignToMe()
                            .setStatus.inProgress();

                        redmine.issue.submitForm();
                    }
                );

                $('#content > .contextual').prepend($btnMarkAsInProgress);
            }
        };

    redmine.init();
})
;
