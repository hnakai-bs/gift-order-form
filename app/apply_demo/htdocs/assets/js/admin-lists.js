(function () {
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function getVal(id) {
        var el = document.getElementById(id);
        return el ? el.value : "";
    }

    /**
     * 注文内容: 1行目は summary のみ。開いたときは 2 行目以降（1 行目が省略された場合はその続き＋2 行目以降）
     */
    function orderContentCellHtml(content) {
        var s = content != null ? String(content) : "";
        if (!s.trim()) {
            return '<span class="muted">—</span>';
        }
        var lines = s.split(/\r?\n/);
        var hasMultipleLines = lines.length > 1;
        var normalized = s.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();

        var preview;
        var panelBody;

        if (!hasMultipleLines) {
            if (normalized.length <= 52) {
                return escapeHtml(s);
            }
            preview = normalized.slice(0, 52) + "…";
            panelBody = s.slice(52);
            if (!panelBody) {
                return escapeHtml(s);
            }
        } else {
            var line1 = lines[0];
            preview =
                line1.length > 52 ? line1.slice(0, 52) + "…" : line1.length > 0 ? line1 + "…" : "…";
            var line1Tail = line1.length > 52 ? line1.slice(52) : "";
            var fromLine2 = lines.slice(1).join("\n");
            var chunks = [];
            if (line1Tail) chunks.push(line1Tail);
            if (fromLine2.length > 0) chunks.push(fromLine2);
            panelBody = chunks.join("\n");
            if (!panelBody.trim()) {
                return escapeHtml(s);
            }
        }

        return (
            '<details class="admin-order-content-acc">' +
            '<summary class="admin-order-content-acc__summary" aria-label="2行目以降を表示">' +
            '<span class="admin-order-content-acc__preview">' +
            escapeHtml(preview) +
            "</span>" +
            '<span class="material-icons-outlined admin-order-content-acc__icon" aria-hidden="true">expand_more</span>' +
            "</summary>" +
            '<div class="admin-order-content-acc__panel">' +
            escapeHtml(panelBody) +
            "</div>" +
            "</details>"
        );
    }

    function initUsers() {
        var mock = window.ADMIN_MOCK;
        var U = window.AdminUtils;
        if (!mock || !U || !U.sortUsersByColumn) return;

        var tbody = document.getElementById("admin-users-tbody");
        if (!tbody) return;

        var sortState = { col: "date", dir: "desc" };

        function getFilteredRows() {
            var q = getVal("admin-users-search");
            var from = getVal("admin-users-from");
            var to = getVal("admin-users-to");
            var rows = mock.users.slice();
            rows = U.filterBySearch(rows, q, ["name", "kana", "company", "companyKana", "email", "tel"]);
            rows = U.filterByPeriod(rows, "latestOrderDate", from, to);
            return rows;
        }

        /** 並び替え後もアイコンは非選択の見た目に戻す（ハイライトを残さない） */
        function resetSortHeaderVisualState() {
            document.querySelectorAll(".admin-col-sort").forEach(function (details) {
                details.classList.remove("is-sort-active");
                var th = details.closest("th");
                if (th) th.setAttribute("aria-sort", "none");
            });
        }

        function applySortMenuChoice(thCol, choice) {
            if (thCol === "date") {
                if (choice === "date_desc") sortState = { col: "date", dir: "desc" };
                else if (choice === "date_asc") sortState = { col: "date", dir: "asc" };
                return;
            }
            if (choice === "gojuon") {
                if (thCol === "name") sortState = { col: "name", dir: "asc" };
                else if (thCol === "company") sortState = { col: "company", dir: "asc" };
                else sortState = { col: "name", dir: "asc" };
            } else if (choice === "date") {
                sortState = { col: "date", dir: "desc" };
            }
        }

        function render() {
            var rows = getFilteredRows();
            rows = U.sortUsersByColumn(rows, sortState.col, sortState.dir);

            if (!rows.length) {
                tbody.innerHTML =
                    '<tr><td colspan="4" style="text-align:center;color:var(--admin-text-muted, #64748b);padding:28px;">条件に一致する会員が見つかりません。</td></tr>';
                resetSortHeaderVisualState();
                return;
            }

            tbody.innerHTML = rows
                .map(function (u) {
                    var dateCell = u.latestOrderDate
                        ? escapeHtml(U.formatYmdJa(u.latestOrderDate, false))
                        : '<span class="muted">—</span>';
                    var editHref = "user_edit.html?id=" + encodeURIComponent(u.id);
                    return (
                        "<tr><td class=\"cell-name\">" +
                        escapeHtml(u.name) +
                        "</td><td>" +
                        escapeHtml(u.company || "—") +
                        "</td><td class=\"cell-date\">" +
                        dateCell +
                        "</td><td class=\"cell-actions\"><a class=\"admin-link-btn\" href=\"" +
                        editHref +
                        "\"><span class=\"material-icons-outlined\" aria-hidden=\"true\">edit</span>編集する</a></td></tr>"
                    );
                })
                .join("");
            resetSortHeaderVisualState();
        }

        function exportCsv() {
            var rows = getFilteredRows();
            rows = U.sortUsersByColumn(rows, sortState.col, sortState.dir);
            U.downloadCsv(
                "users_export.csv",
                ["お名前", "会社名", "メール", "電話", "注文日", "登録日"],
                rows.map(function (u) {
                    return [
                        u.name,
                        u.company || "",
                        u.email || "",
                        u.tel || "",
                        u.latestOrderDate || "",
                        u.registeredAt || "",
                    ];
                })
            );
        }

        var table = tbody.closest("table");
        var thead = table ? table.querySelector("thead") : null;
        if (thead) {
            thead.addEventListener("click", function (e) {
                var opt = e.target.closest(".admin-col-sort__option");
                if (!opt) return;
                e.preventDefault();
                var choice = opt.getAttribute("data-sort-choice");
                var details = opt.closest(".admin-col-sort");
                if (!details) return;
                var thCol = details.getAttribute("data-sort-col");
                if (thCol !== "name" && thCol !== "company" && thCol !== "date") return;
                if (thCol === "date") {
                    if (choice !== "date_desc" && choice !== "date_asc") return;
                } else if (choice !== "gojuon" && choice !== "date") {
                    return;
                }
                applySortMenuChoice(thCol, choice);
                details.removeAttribute("open");
                render();
            });
        }

        ["admin-users-search", "admin-users-from", "admin-users-to"].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener("input", render);
        });

        var csvBtn = document.getElementById("admin-users-csv");
        if (csvBtn) csvBtn.addEventListener("click", exportCsv);

        render();
    }

    function initApplications() {
        var mock = window.ADMIN_MOCK;
        var U = window.AdminUtils;
        if (!mock || !U || !U.sortOrdersByColumn) return;

        var tbody = document.getElementById("admin-apps-tbody");
        if (!tbody) return;

        var sortState = { col: "date", dir: "desc" };

        function getFilteredRows() {
            var q = getVal("admin-apps-search");
            var from = getVal("admin-apps-from");
            var to = getVal("admin-apps-to");
            var rows = mock.orders.slice();
            rows = U.filterBySearch(rows, q, ["ordererName", "destName", "content"]);
            rows = U.filterByPeriod(rows, "date", from, to);
            return rows;
        }

        function resetSortHeaderVisualState() {
            document.querySelectorAll(".admin-col-sort").forEach(function (details) {
                details.classList.remove("is-sort-active");
                var th = details.closest("th");
                if (th) th.setAttribute("aria-sort", "none");
            });
        }

        function applySortMenuChoice(thCol, choice) {
            if (thCol === "date") {
                if (choice === "date_desc") sortState = { col: "date", dir: "desc" };
                else if (choice === "date_asc") sortState = { col: "date", dir: "asc" };
                return;
            }
            if (choice === "gojuon") {
                if (thCol === "orderer") sortState = { col: "orderer", dir: "asc" };
                else if (thCol === "dest") sortState = { col: "dest", dir: "asc" };
            } else if (choice === "date") {
                sortState = { col: "date", dir: "desc" };
            }
        }

        function render() {
            var rows = getFilteredRows();
            rows = U.sortOrdersByColumn(rows, sortState.col, sortState.dir);

            if (!rows.length) {
                tbody.innerHTML =
                    '<tr><td colspan="5" style="text-align:center;color:var(--admin-text-muted, #64748b);padding:28px;">条件に一致するお申し込みが見つかりません。</td></tr>';
                resetSortHeaderVisualState();
                return;
            }

            tbody.innerHTML = rows
                .map(function (o) {
                    var dateCell = o.date
                        ? escapeHtml(U.formatYmdJa(o.date, false))
                        : '<span class="muted">—</span>';
                    var detailHref = "order_detail.html?id=" + encodeURIComponent(o.id);
                    return (
                        "<tr><td class=\"cell-date\">" +
                        dateCell +
                        "</td><td>" +
                        escapeHtml(o.ordererName) +
                        "</td><td class=\"cell-name\">" +
                        escapeHtml(o.destName) +
                        "</td><td class=\"cell-order-content\">" +
                        orderContentCellHtml(o.content) +
                        "</td><td class=\"cell-actions\"><a class=\"admin-link-btn\" href=\"" +
                        detailHref +
                        "\">詳細を見る</a></td></tr>"
                    );
                })
                .join("");
            resetSortHeaderVisualState();
        }

        function exportCsv() {
            var rows = getFilteredRows();
            rows = U.sortOrdersByColumn(rows, sortState.col, sortState.dir);
            U.downloadCsv(
                "applications_export.csv",
                ["申込日", "ご注文者", "お届け先宛名", "注文内容", "ID"],
                rows.map(function (o) {
                    return [o.date, o.ordererName, o.destName, o.content, o.id];
                })
            );
        }

        var table = tbody.closest("table");
        var thead = table ? table.querySelector("thead") : null;
        if (thead) {
            thead.addEventListener("click", function (e) {
                var opt = e.target.closest(".admin-col-sort__option");
                if (!opt) return;
                e.preventDefault();
                var choice = opt.getAttribute("data-sort-choice");
                var details = opt.closest(".admin-col-sort");
                if (!details) return;
                var thCol = details.getAttribute("data-sort-col");
                if (thCol !== "date" && thCol !== "orderer" && thCol !== "dest") return;
                if (thCol === "date") {
                    if (choice !== "date_desc" && choice !== "date_asc") return;
                } else if (choice !== "gojuon" && choice !== "date") {
                    return;
                }
                applySortMenuChoice(thCol, choice);
                details.removeAttribute("open");
                render();
            });
        }

        ["admin-apps-search", "admin-apps-from", "admin-apps-to"].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener("input", render);
        });

        var csvBtn = document.getElementById("admin-apps-csv");
        if (csvBtn) csvBtn.addEventListener("click", exportCsv);

        render();
    }

    function boot() {
        var page = document.body && document.body.getAttribute("data-admin-page");
        if (page === "users") initUsers();
        else if (page === "applications") initApplications();
    }

    document.addEventListener(
        "toggle",
        function (e) {
            var t = e.target;
            if (!t || !t.classList) return;
            if (t.classList.contains("admin-row-menu") && t.open) {
                document.querySelectorAll("details.admin-row-menu[open]").forEach(function (d) {
                    if (d !== t) d.removeAttribute("open");
                });
                document.querySelectorAll("details.admin-col-sort[open]").forEach(function (d) {
                    d.removeAttribute("open");
                });
                return;
            }
            if (t.classList.contains("admin-order-content-acc") && t.open) {
                document.querySelectorAll("details.admin-col-sort[open]").forEach(function (d) {
                    d.removeAttribute("open");
                });
                document.querySelectorAll("details.admin-row-menu[open]").forEach(function (d) {
                    d.removeAttribute("open");
                });
                return;
            }
            if (t.classList.contains("admin-col-sort") && t.open) {
                document.querySelectorAll("details.admin-col-sort[open]").forEach(function (d) {
                    if (d !== t) d.removeAttribute("open");
                });
                document.querySelectorAll("details.admin-row-menu[open]").forEach(function (d) {
                    d.removeAttribute("open");
                });
                document.querySelectorAll("details.admin-order-content-acc[open]").forEach(function (d) {
                    d.removeAttribute("open");
                });
            }
        },
        true
    );

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
