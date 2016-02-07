

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
        enableColumnReorder: false
    };


    var loader = new Slick.Data.RemoteModel();
    var grid = new Slick.Grid("#resultGrid", [], [], options);
    grid.resizeCanvas();
    grid.onViewportChanged.subscribe(function (e, args) {
        var vp = grid.getViewport();
        loader.ensureData(vp.top, vp.bottom);
    });
    
    loader.onDataLoaded.subscribe(function (e, args) {
        for (var i = args.from; i <= args.to; i++) {
            grid.invalidateRow(i);
        }

        grid.render();
        grid.resizeCanvas();

    });

    loader.onQueryExecuted.subscribe(function (e, args) {
        for (var i = args.from; i <= args.to; i++) {
            grid.invalidateRow(i);
        }

        $('#statusMsg').removeClass('msg-error');
        var status = args.count + ' rows retuned in ' + args.duration + ' ms';
        $('#statusMsg').text(status);

        $('#statusMsg').text(status);
        grid.setColumns(loader.columns);
        grid.setData(loader.data);
        grid.updateRowCount();
        grid.autosizeColumns();
        grid.render();
        grid.resizeCanvas();

    });

    loader.onError.subscribe(function (e, args) {
        $('#statusMsg').text(args.error);
        $('#statusMsg').addClass('msg-error');

        grid.setColumns([]);
        grid.setData([]);
        grid.updateRowCount();
        grid.render();
    });

    var lastRequest = null;
    var queryStart;

    var exeRun = function(editor) {
        var query = editor.getValue();
        grid.scrollRowIntoView(0);
        loader.setSearch(query);

        if (typeof (Storage) !== "undefined") {
            localStorage.setItem("lastQuery", query);
        }

        lastRequest = $.get('/js', { query: query, limit:1000 }, function (response) {
            if (response.error) {
                alert(response.error);
            } else {
                var duration = (new Date().getTime() - queryStart);
                
            }
        }).fail(function (jqXHR, textStatus) {
            if (jqXHR.status == 400) {
                if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                }
            }
        });

    }

    sqlEditor.commands.addCommand({
        name: 'runQuery',
        bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
        exec: function (editor) {
            exeRun(editor);
        }
    });

    $('#btn_run').click(function() {
        exeRun(sqlEditor);
    });

    var top = $('#resultGrid').offset().top;
    var bodyheight = $(document).height();

    var reseizeGrid = function () {
        $('#resultGrid').height(bodyheight - top);
        $('#resultGrid').css('height', (bodyheight - top) + 'px');
        grid.resizeCanvas();
    }

    $('.sp:not(.last)').resizable({
        handles: 's',
        start: function(event, ui) {
            $('iframe').css('pointer-events', 'none');
        },
        stop: function(event, ui) {
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

            $.each(ele.siblings(), function(idx, item) {
                ele.siblings().eq(idx).css('height', y + 'px');
            });


            sqlEditor.resize();
            top = $('#resultGrid').offset().top;
            reseizeGrid();
        }
    });

    $(window).resize(function () {
        bodyheight = $(document).height();
        reseizeGrid();
    }).resize();

});

$('.pane-settings').click(function() {
    $(this).next('.pane-panel').toggle("slide", { direction: "right" }, 400);
});