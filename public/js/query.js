jQuery.fn.selectText = function () {
    var doc = document,
        element = this[0],
        range,
        selection;
    if (!element) return;
    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    }
};

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

var createSqlEditor = function () {
    ace.require("ace/ext/language_tools");
    var sqlEditor = ace.edit("sqlEditor");
    sqlEditor.getSession().setMode("ace/mode/sql");

    sqlEditor.setOptions({
        enableBasicAutocompletion: false,
        enableSnippets: true,
        fontSize: "11pt"
    });

    /*
     sqlEditor.commands.on("afterExec", function(e) {
     // activate autocomplete when paren or .(dot) is typed
     if (e.command.name == "insertstring" && /^[\\.\(.]$/.test(e.args)) {
     sqlEditor.execCommand("startAutocomplete");
     }
     });
     */

    sqlEditor.setShowPrintMargin(false);
    sqlEditor.setDisplayIndentGuides(false);
    sqlEditor.setHighlightActiveLine(false);

    if (typeof (Storage) !== "undefined" && localStorage.getItem("lastQuery")) {
        sqlEditor.setValue(localStorage.getItem("lastQuery"));
    }

    sqlEditor.focus();

    return sqlEditor;
};

var gridElem = $('#resultGrid');
var statusElem = $('#statusMsg');


$(function () {

    var sqlEditor = createSqlEditor();

    sqlEditor.commands.addCommand({
        name: 'runQuery',
        bindKey: {win: 'Ctrl-Enter', mac: 'Command-Enter'},
        exec: function (editor) {
            exeRun(editor);
        }
    });

    var grid = new Slick.Grid(gridElem, [], [], {
        enableCellNavigation: true,
        enableColumnReorder: false,
        enableTextSelectionOnCells: true
    });

    gridElem.dblclick(function (el) {
        if (el.target) {
            $(el.target).selectText();
        }
    });

    grid.resizeCanvas();

    var model = new nfsDb.Data.Model();

    grid.onViewportChanged.subscribe(function () {
        var vp = grid.getViewport();
        model.ensureData(vp.top, vp.bottom);
    });

    model.onDataLoaded.subscribe(function (e, args) {
        for (var i = args.from; i <= args.to; i++) {
            grid.invalidateRow(i);
        }
        grid.render();
    });

    model.onQueryExecuted.subscribe(function (e, args) {
        for (var i = args.from; i <= args.to; i++) {
            grid.invalidateRow(i);
        }

        statusElem.removeClass('msg-error');
        statusElem.text(args.count + ' rows retuned in ' + args.duration + ' ms');
        grid.setColumns(model.columns);
        grid.setData(model.data);
        grid.updateRowCount();
        grid.render();
    });

    model.onError.subscribe(function (e, args) {
        var msg = "";
        if (args.position || args.position == 0) {
            // Find row.
            var query = model.getSearch();
            var row = 0;
            var col = 0;
            for (var i = 0; i < Math.min(query.length, args.position); i++) {
                if (query.charAt(i) == "\n") {
                    row++;
                    col = 0;
                } else {
                    col++;
                }

            }
        }

        statusElem.text(args.error);
        statusElem.addClass('msg-error');
        sqlEditor.gotoLine(row + 1 + sqlEditor.lastQueryRow, row === 0 ? col + sqlEditor.lastQueryCol : col);

        grid.setColumns([]);
        grid.setData([]);
        grid.updateRowCount();
        grid.render();
    });

    var exeRun = function (editor) {

        var query = editor.getSelectedText();
        if (query == null || query == "") {
            query = editor.getValue();
            editor.lastQueryRow = 0;
            editor.lastQueryCol = 0;
        } else {
            var range = editor.getSelectionRange();
            editor.lastQueryRow = range.start.row;
            editor.lastQueryCol = range.start.column;
        }

        grid.scrollRowIntoView(0);
        model.setSearch(query);

        if (typeof (Storage) !== "undefined") {
            localStorage.setItem("lastQuery", editor.getValue());
        }
    };

    $('#btn_run').click(function () {
        exeRun(sqlEditor);
        sqlEditor.focus();
    });

    var top = gridElem.offset().top;
    var bodyHeight = $(document).height();

    var resizeGrid = function () {
        gridElem.height(bodyHeight - top);
        gridElem.css('height', (bodyHeight - top) + 'px');
        grid.resizeCanvas();
        grid.render();
    };

    $('.sp:not(.last)').resizable({
        handles: 's',
        start: function () {
            $('iframe').css('pointer-events', 'none');
        },
        stop: function () {
            $('iframe').css('pointer-events', 'auto');
        },
        resize: function (event, ui) {
            var x = ui.element.outerWidth();
            var y = ui.element.outerHeight();
            var par = $(this).parent().width();
            var ele = ui.element;

            if (x == par) {
                sqlEditor.resize();
                top = gridElem.offset().top;
                resizeGrid();
                return;
            }

            $.each(ele.siblings(), function (idx) {
                ele.siblings().eq(idx).css('height', y + 'px');
            });


            sqlEditor.resize();
            resizeGrid();
        }
    });

    $(window).resize(function () {
        bodyHeight = $(document).height();
        resizeGrid();
    }).resize();

});

$('.pane-settings').click(function () {
    $(this).next('.pane-panel').toggle("slide", {direction: "right"}, 400);
});