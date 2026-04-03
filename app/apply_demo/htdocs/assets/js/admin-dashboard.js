(function () {
    function init() {
        var mock = window.ADMIN_MOCK;
        if (!mock || !window.AdminUtils) return;

        var now = new Date();
        var w0 = window.AdminUtils.startOfWeekMonday(now);
        var w1 = window.AdminUtils.endOfWeekSunday(now);

        function inWeekYmd(ymd) {
            var t = new Date(
                Number(ymd.slice(0, 4)),
                Number(ymd.slice(5, 7)) - 1,
                Number(ymd.slice(8, 10))
            );
            return t >= w0 && t <= w1;
        }

        var weekUsers = mock.users.filter(function (u) {
            return u.registeredAt && inWeekYmd(u.registeredAt);
        });
        var weekOrders = mock.orders.filter(function (o) {
            return o.date && inWeekYmd(o.date);
        });

        var userTbody = document.getElementById("admin-dash-users");
        var orderTbody = document.getElementById("admin-dash-orders");

        if (userTbody) {
            if (!weekUsers.length) {
                userTbody.innerHTML =
                    '<tr><td colspan="3" class="muted">該当する新規ユーザーはありません。</td></tr>';
            } else {
                userTbody.innerHTML = weekUsers
                    .map(function (u) {
                        return (
                            "<tr><td class=\"cell-name\">" +
                            escapeHtml(u.name) +
                            "</td><td class=\"muted\">" +
                            escapeHtml(u.company || "—") +
                            "</td><td class=\"muted\">" +
                            escapeHtml(window.AdminUtils.formatYmdJa(u.registeredAt)) +
                            "</td></tr>"
                        );
                    })
                    .join("");
            }
        }

        if (orderTbody) {
            if (!weekOrders.length) {
                orderTbody.innerHTML =
                    '<tr><td colspan="3" class="muted">該当するお申し込みはありません。</td></tr>';
            } else {
                weekOrders.sort(function (a, b) {
                    return String(b.date).localeCompare(String(a.date));
                });
                orderTbody.innerHTML = weekOrders
                    .map(function (o) {
                        return (
                            "<tr><td class=\"muted\">" +
                            escapeHtml(window.AdminUtils.formatYmdJa(o.date)) +
                            "</td><td>" +
                            escapeHtml(o.ordererName) +
                            "</td><td>" +
                            escapeHtml(o.content) +
                            "</td></tr>"
                        );
                    })
                    .join("");
            }
        }
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
