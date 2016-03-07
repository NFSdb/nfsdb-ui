(function($) {

    function RemoteModel() {
        // private
        var PAGESIZE = 50;
        var data = { length: 0 };
        var columns = [];
        var searchstr = "";
        var h_request = null;
        var currentSearchstr = true;
        var req = null; // ajax request

        // events
        var onDataLoading = new Slick.Event();
        var onDataLoaded = new Slick.Event();
        var onError = new Slick.Event();
        var onQueryExecuted = new Slick.Event();

        function init() {
        }


        function isDataLoaded(from, to) {
            for (var i = from; i <= to; i++) {
                if (data[i] == undefined || data[i] == null) {
                    return false;
                }
            }

            return true;
        }


        function clear() {
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    delete data[key];
                }
            }
            data.length = 0;
            while (columns.length > 0) {
                columns.pop();
            }
            //loadingFrom = 0;
            //loadingTo = 0;
        }

        function ensureData(fromRow, to) {
            if (fromRow < 0) {
                fromRow = 0;
            }

            if (data.length > 0) {
                to = Math.min(to, data.length - 1);
            }

            var fromPage = Math.floor(fromRow / PAGESIZE);
            var toPage = Math.floor(to / PAGESIZE);

            while (data[fromPage * PAGESIZE] !== undefined && fromPage < toPage)
                fromPage++;

            while (data[toPage * PAGESIZE] !== undefined && fromPage < toPage)
                toPage--;

            if (fromPage > toPage || ((fromPage == toPage) && data[fromPage * PAGESIZE] !== undefined)) {
                // TODO:  look-ahead
                onDataLoaded.notify({ from: fromRow, to: to });
                return;
            }
            var fromRowLoading = (fromPage * PAGESIZE);
            var toRowLoading = fromRowLoading + (((toPage - fromPage) * PAGESIZE) + PAGESIZE);

            if (req && (req.fromPage != fromPage || req.toPage != toPage)) {
                req.abort();
                for (var i = req.fromPage; i <= req.toPage; i++) {
                    if (data[i * PAGESIZE] == null) {
                        data[i * PAGESIZE] = undefined;
                    }
                }
            }

            if (h_request != null) {
                clearTimeout(h_request);
            }

            h_request = setTimeout(function () {

                for (var i = fromPage; i <= toPage; i++)
                    data[i * PAGESIZE] = null; // null indicates a 'requested but not available yet'

                var queryStart = new Date().getTime();
                var ff = fromRowLoading;
                onDataLoading.notify({ from: fromRowLoading, to: toRowLoading });

                req = $.get('/js', { query: searchstr, limit: fromRowLoading + "," + toRowLoading, withCount: (currentSearchstr !=  searchstr)}, function (resp) {

                    var duration = (new Date().getTime() - queryStart);
                    var from = ff;
                    var newRequest = false;
                    if (currentSearchstr != resp.query) {
                        data.length = Math.max(parseInt(resp.totalCount), resp.result.length);
                        currentSearchstr = resp.query;
                        newRequest = true;
                    }

                    for (var i = 0; i < resp.result.length; i++) {
                        data[from + i] = resp.result[i];
                    }

                    if (newRequest) {
                        req = null;
                        while (columns.length > 0) {
                            columns.pop();
                        }
                        var cw = 8;
                        var offset = 35;
                        for (var c = 0; c < resp.columns.length; c++) {
                            var col = resp.columns[c];
                            var minWidth = cw * col.name.length + offset;
                            if (col.type == "DOUBLE" || col.type == "LONG" || col.type == "FLOAT") {
                                minWidth = Math.max(150, minWidth);
                            } else if (col.type == "INT") {
                                minWidth = Math.max(120, minWidth);
                            } else if (col.type == "BYTE") {
                                minWidth = Math.max(30, minWidth);
                            } else if (col.type == "DATE") {
                                minWidth = Math.max(150, minWidth);
                            } else if (col.type == "SHORT") {
                                minWidth = Math.max(100, minWidth);
                            } else if (col.type == "STRING" || col.type == "SYMBOL") {
                                for (var d = 0; d < resp.result.length; d++) {
                                    var str = resp.result[d][col.name];
                                    if (str && (str.length * cw + offset > minWidth)) {
                                        minWidth = str.length * cw + offset;
                                    }
                                }
                            }
                            columns.push({ id: col.name, name: col.name, field: col.name, minWidth: minWidth });
                        }

                        onQueryExecuted.notify({ from: from, to: to, count: resp.totalCount, duration: duration });
                    } else {
                        onDataLoaded.notify({ from: from, to: to});
                    }

                }).fail(function (jqXHR, textStatus) {
                    if (currentSearchstr != searchstr) {
                        if (jqXHR.status == 400) {
                            if (jqXHR.responseJSON && jqXHR.responseJSON.error) {
                                onError.notify({ position: jqXHR.responseJSON.position, error: jqXHR.responseJSON.error });
                                return;
                            }
                        }
                        onError.notify({ error: "Error. Server response code " + jqXHR.status });
                    }
                });

                req.fromPage = fromPage;
                req.toPage = toPage;
            }, 50);
        }

        function reloadData(from, to) {
            for (var i = from; i <= to; i++)
                delete data[i];

            ensureData(from, to);
        }


        function setSort(column, dir) {
            sortcol = column;
            sortdir = dir;
            clear();
        }

        function setSearch(str) {
            currentSearchstr = "";
            searchstr = str;
            clear();
            ensureData(0, PAGESIZE);
        }

        function getSearch() {
            return searchstr;
        }


        init();

        return {
            // properties
            "data": data,
            "columns": columns,

            // methods
            "clear": clear,
            "isDataLoaded": isDataLoaded,
            "ensureData": ensureData,
            "reloadData": reloadData,
            "setSort": setSort,
            "setSearch": setSearch,
            "getSearch": getSearch,

            // events
            "onDataLoading": onDataLoading,
            "onDataLoaded": onDataLoaded,
            "onQueryExecuted": onQueryExecuted,
            "onError": onError
        };
    }

    // Slick.Data.RemoteModel
    $.extend(true, window, { Slick: { Data: { RemoteModel: RemoteModel } } });
})(jQuery);