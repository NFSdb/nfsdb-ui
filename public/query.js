

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


    //var grid;
    //var columns = [
    //    { id: "title", name: "Title", field: "title" },
    //    { id: "duration", name: "Duration", field: "duration" },
    //    { id: "%", name: "% Complete", field: "percentComplete" },
    //    { id: "start", name: "Start", field: "start" },
    //    { id: "finish", name: "Finish", field: "finish" },
    //    { id: "effort-driven", name: "Effort Driven", field: "effortDriven" }
    //];

    //var options = {
    //    enableCellNavigation: true,
    //    enableColumnReorder: false
    //};

    //var data = [];
    //for (var i = 0; i < 500; i++) {
    //    data[i] = {
    //        title: "Task " + i,
    //        duration: "5 days",
    //        percentComplete: Math.round(Math.random() * 100),
    //        start: "01/01/2009",
    //        finish: "01/05/2009",
    //        effortDriven: (i % 5 == 0)
    //    };
    //}

    //grid = new Slick.Grid("#resultGrid", data, columns, options);
    //grid.resizeCanvas();

    //var top = $('.last').offset().top;
    //var bodyheight = $(document).height();

    //var reseizeGrid = function () {
    //    $('.last').css('height', (bodyheight - top) + 'px');
    //    grid.resizeCanvas();
    //}

    //$('.sp').resizable({
    //    handles: 's',
    //    start: function(event, ui) {
    //        $('iframe').css('pointer-events', 'none');
    //    },
    //    stop: function(event, ui) {
    //        $('iframe').css('pointer-events', 'auto');
    //    },
    //    resize: function(event, ui) {
    //        var x = ui.element.outerWidth();
    //        var y = ui.element.outerHeight();
    //        var par = $(this).parent().width();
    //        var ele = ui.element;

    //        if (x == par) {
    //            sqlEditor.resize();
    //            top = $('.last').offset().top;
    //            reseizeGrid();
    //            return;
    //        }

    //        $.each(ele.siblings(), function(idx, item) {
    //            ele.siblings().eq(idx).css('height', y + 'px');
    //        });


    //        sqlEditor.resize();
    //        top = $('.last').offset().top;
    //        reseizeGrid();
    //    }
    //});

    //$(window).resize(function () {
    //    bodyheight = $(document).height();
    //    reseizeGrid();
    //}).resize();

});

$('.pane-settings').click(function() {
    $(this).next('.pane-panel').toggle("slide", { direction: "right" }, 400);
});