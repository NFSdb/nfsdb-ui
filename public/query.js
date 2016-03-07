jQuery.fn.selectText = function() {
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

var gridElem = $("#resultGrid");
var statusElem = $('#statusMsg');

$(function() {
    var sqlEditor;

    ace.require("ace/ext/language_tools");
    sqlEditor = ace.edit("sqlEditor");
    sqlEditor.getSession().setMode("ace/mode/sql");
    sqlEditor.setTheme("ace/theme/textmate");
    sqlEditor.setOptions({
        enableBasicAutocompletion: true,
        enableSnippets: true
    });

    sqlEditor.commands.on("afterExec", function(e) {
        // activate autocomplete when paren or .(dot) is typed
        if (e.command.name == "insertstring" && /^[\\.\(.]$/.test(e.args)) {
            sqlEditor.execCommand("startAutocomplete");
        }
    });
    sqlEditor.setShowPrintMargin(false);
    sqlEditor.setDisplayIndentGuides(false);
    sqlEditor.setHighlightActiveLine(false);

    if (typeof (Storage) !== "undefined" && localStorage.getItem("lastQuery")) {
        sqlEditor.setValue(localStorage.getItem("lastQuery"));
    }

    sqlEditor.focus();

    var options = {
        enableCellNavigation: true,
        enableColumnReorder: false,
        enableTextSelectionOnCells: true
    };

    var model = new Slick.Data.RemoteModel();
    var grid = new Slick.Grid(gridElem, [], [], options);
    gridElem.dblclick(function(el) {
        if (el.target) {
            $(el.target).selectText();
        }
    });

    grid.resizeCanvas();
    grid.onViewportChanged.subscribe(function() {
        var vp = grid.getViewport();
        model.ensureData(vp.top, vp.bottom);
    });

    model.onDataLoaded.subscribe(function(e, args) {
        for (var i = args.from; i <= args.to; i++) {
            grid.invalidateRow(i);
        }

        grid.render();

    });

    model.onQueryExecuted.subscribe(function(e, args) {
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

    model.onError.subscribe(function(e, args) {
        var msg = "";
        if (args.position || args.position == 0) {
            // Find line.
            var query = model.getSearch();
            var line = 1;
            var linePos = 1;
            for (var i = 0; i < Math.min(query.length, args.position); i++) {
                if (query.charAt(i) == "\n") {
                    line++;
                    linePos = 1;
                } else {
                    linePos++;
                }

            }

            msg += "(" + line + ", " + linePos + ") ";
        }

        statusElem.text(msg + args.error);
        statusElem.addClass('msg-error');

        grid.setColumns([]);
        grid.setData([]);
        grid.updateRowCount();
        grid.render();
    });

    var exeRun = function(editor) {
        var query = editor.getValue();
        grid.scrollRowIntoView(0);
        model.setSearch(query);

        if (typeof (Storage) !== "undefined") {
            localStorage.setItem("lastQuery", query);
        }
    };
    sqlEditor.commands.addCommand({
        name: 'runQuery',
        bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
        exec: function(editor) {
            exeRun(editor);
        }
    });

    $('#btn_run').click(function() {
        exeRun(sqlEditor);
        sqlEditor.focus();
    });

    var top = $('#resultGrid').offset().top;
    var bodyheight = $(document).height();

    var reseizeGrid = function() {
        gridElem.height(bodyheight - top);
        gridElem.css('height', (bodyheight - top) + 'px');
        grid.resizeCanvas();
        grid.render();
    };

    $('.sp:not(.last)').resizable({
        handles: 's',
        start: function() {
            $('iframe').css('pointer-events', 'none');
        },
        stop: function() {
            $('iframe').css('pointer-events', 'auto');
        },
        resize: function(event, ui) {
            var x = ui.element.outerWidth();
            var y = ui.element.outerHeight();
            var par = $(this).parent().width();
            var ele = ui.element;

            if (x == par) {
                sqlEditor.resize();
                top = $('#resultGrid').offset().top;
                reseizeGrid();
                return;
            }

            $.each(ele.siblings(), function(idx) {
                ele.siblings().eq(idx).css('height', y + 'px');
            });


            sqlEditor.resize();
            reseizeGrid();
        }
    });

    $(window).resize(function() {
        bodyheight = $(document).height();
        reseizeGrid();
    }).resize();

});

$('.pane-settings').click(function() {
    $(this).next('.pane-panel').toggle("slide", { direction: "right" }, 400);
});