

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

    var grid = new Slick.Grid("#resultGrid", [], [], options);
    grid.resizeCanvas();
    var lastRequest = null;
    var queryStart;

    var exeRun = function(editor) {
        var query = editor.getValue();
        if (typeof (Storage) !== "undefined") {
            localStorage.setItem("lastQuery", query);
        }
        if (lastRequest) {
            lastRequest.abort();
        }

        queryStart = new Date().getTime();
        lastRequest = $.get('/js', { query: query, limit:1000 }, function (response) {
            if (response.error) {
                alert(response.error);
            } else {
                var duration = (new Date().getTime() - queryStart);
                var columns = [];
                response.columns.forEach(function (col) {
                    columns.push({ id: col.name, name: col.name, field: col.name });
                });
                $('#statusMsg').removeClass('msg-error');
                var status = response.result.length + ' rows retuned in ' + duration + ' ms';
                if (response.moreExist) {
                    status += ". More records exist";
                }
                $('#statusMsg').text(status);

                grid.setColumns(columns);
                grid.setData(response.result);
                grid.updateRowCount();
                grid.autosizeColumns();
                grid.render();
                grid.resizeCanvas();
            }
        }).fail(function (jqXHR, textStatus) {
            if (jqXHR.status == 400) {
                if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                    $('#statusMsg').text(jqXHR.responseJSON && jqXHR.responseJSON.error);
                    $('#statusMsg').addClass('msg-error');
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