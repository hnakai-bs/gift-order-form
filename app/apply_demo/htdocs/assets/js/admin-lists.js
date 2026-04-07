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
        /** 「検索」ボタン押下時のみ反映（入力中は一覧を変えない） */
        var appliedUsersFilter = { q: "", from: "", to: "" };

        function getFilteredRows() {
            var rows = mock.users.slice();
            rows = U.filterBySearch(rows, appliedUsersFilter.q, [
                "name",
                "kana",
                "company",
                "companyKana",
                "email",
                "tel",
            ]);
            rows = U.filterByPeriod(rows, "latestOrderDate", appliedUsersFilter.from, appliedUsersFilter.to);
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
                    var emailCell = u.email
                        ? escapeHtml(u.email)
                        : '<span class="muted">—</span>';
                    var editHref = "user_edit.html?id=" + encodeURIComponent(u.id);
                    return (
                        "<tr><td class=\"cell-name\">" +
                        escapeHtml(u.name) +
                        "</td><td>" +
                        escapeHtml(u.company || "—") +
                        "</td><td class=\"cell-email\">" +
                        emailCell +
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
                if (thCol !== "name" && thCol !== "company") return;
                if (choice !== "gojuon" && choice !== "date") return;
                applySortMenuChoice(thCol, choice);
                details.removeAttribute("open");
                render();
            });
        }

        function applyUsersKeywordFilter() {
            appliedUsersFilter.q = getVal("admin-users-search");
            render();
        }

        function applyUsersPeriodFilter() {
            appliedUsersFilter.from = getVal("admin-users-from");
            appliedUsersFilter.to = getVal("admin-users-to");
            render();
        }

        function applyUsersFiltersCombined() {
            appliedUsersFilter.q = getVal("admin-users-search");
            appliedUsersFilter.from = getVal("admin-users-from");
            appliedUsersFilter.to = getVal("admin-users-to");
            render();
        }

        function resetUsersFilters() {
            appliedUsersFilter = { q: "", from: "", to: "" };
            ["admin-users-search", "admin-users-from", "admin-users-to"].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.value = "";
            });
            render();
        }

        var usersFilterSubmit = document.getElementById("admin-users-filter-submit");
        if (usersFilterSubmit) {
            usersFilterSubmit.addEventListener("click", applyUsersFiltersCombined);
        } else {
            var usersSearchBtn = document.getElementById("admin-users-search-btn");
            if (usersSearchBtn) usersSearchBtn.addEventListener("click", applyUsersKeywordFilter);

            var usersPeriodSearchBtn = document.getElementById("admin-users-period-search-btn");
            if (usersPeriodSearchBtn) usersPeriodSearchBtn.addEventListener("click", applyUsersPeriodFilter);
        }

        var usersResetBtn = document.getElementById("admin-users-filter-reset");
        if (usersResetBtn) usersResetBtn.addEventListener("click", resetUsersFilters);

        var usersSearchInput = document.getElementById("admin-users-search");
        if (usersSearchInput) {
            usersSearchInput.addEventListener("keydown", function (e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    if (usersFilterSubmit) applyUsersFiltersCombined();
                    else applyUsersKeywordFilter();
                }
            });
        }

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
        /** 「検索」ボタン押下時のみ反映（入力中は一覧を変えない） */
        var appliedAppsFilter = { q: "", from: "", to: "" };

        function getFilteredRows() {
            var rows = mock.orders.slice();
            rows = U.filterBySearch(rows, appliedAppsFilter.q, [
                "ordererName",
                "destName",
                "content",
                "managementNo",
            ]);
            rows = U.filterByPeriod(rows, "date", appliedAppsFilter.from, appliedAppsFilter.to);
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
            if (thCol !== "date") return;
            if (choice === "date_desc") sortState = { col: "date", dir: "desc" };
            else if (choice === "date_asc") sortState = { col: "date", dir: "asc" };
        }

        function render() {
            var rows = getFilteredRows();
            rows = U.sortOrdersByColumn(rows, sortState.col, sortState.dir);

            if (!rows.length) {
                tbody.innerHTML =
                    '<tr><td colspan="6" style="text-align:center;color:var(--admin-text-muted, #64748b);padding:28px;">条件に一致するお申し込みが見つかりません。</td></tr>';
                resetSortHeaderVisualState();
                return;
            }

            tbody.innerHTML = rows
                .map(function (o) {
                    var dtSrc = o.appliedAt || o.date;
                    var dateCell = dtSrc
                        ? escapeHtml(U.formatYmdHmJa(dtSrc))
                        : '<span class="muted">—</span>';
                    var mgmtCell =
                        o.managementNo != null && String(o.managementNo).trim()
                            ? escapeHtml(String(o.managementNo).trim())
                            : '<span class="muted">—</span>';
                    var detailHref = "order_detail.html?id=" + encodeURIComponent(o.id);
                    return (
                        "<tr><td class=\"cell-date\">" +
                        dateCell +
                        "</td><td class=\"cell-management-no\">" +
                        mgmtCell +
                        "</td><td>" +
                        escapeHtml(o.ordererName) +
                        "</td><td class=\"cell-name2\">" +
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
                ["申し込み日時", "管理No.", "ご注文者", "お届け先宛名", "注文内容", "ID"],
                rows.map(function (o) {
                    var dt = o.appliedAt || o.date || "";
                    return [dt, o.managementNo != null ? o.managementNo : "", o.ordererName, o.destName, o.content, o.id];
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
                if (thCol !== "date") return;
                if (choice !== "date_desc" && choice !== "date_asc") return;
                applySortMenuChoice(thCol, choice);
                details.removeAttribute("open");
                render();
            });
        }

        function applyKeywordFilter() {
            appliedAppsFilter.q = getVal("admin-apps-search");
            render();
        }

        function applyPeriodFilter() {
            appliedAppsFilter.from = getVal("admin-apps-from");
            appliedAppsFilter.to = getVal("admin-apps-to");
            render();
        }

        function applyAppsFiltersCombined() {
            appliedAppsFilter.q = getVal("admin-apps-search");
            appliedAppsFilter.from = getVal("admin-apps-from");
            appliedAppsFilter.to = getVal("admin-apps-to");
            render();
        }

        function resetAppsFilters() {
            appliedAppsFilter = { q: "", from: "", to: "" };
            var ids = ["admin-apps-search", "admin-apps-from", "admin-apps-to"];
            ids.forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.value = "";
            });
            render();
        }

        var appsFilterSubmit = document.getElementById("admin-apps-filter-submit");
        if (appsFilterSubmit) {
            appsFilterSubmit.addEventListener("click", applyAppsFiltersCombined);
        } else {
            var searchBtn = document.getElementById("admin-apps-search-btn");
            if (searchBtn) searchBtn.addEventListener("click", applyKeywordFilter);

            var periodSearchBtn = document.getElementById("admin-apps-period-search-btn");
            if (periodSearchBtn) periodSearchBtn.addEventListener("click", applyPeriodFilter);
        }

        var resetBtn = document.getElementById("admin-apps-filter-reset");
        if (resetBtn) resetBtn.addEventListener("click", resetAppsFilters);

        var searchInput = document.getElementById("admin-apps-search");
        if (searchInput) {
            searchInput.addEventListener("keydown", function (e) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    if (appsFilterSubmit) applyAppsFiltersCombined();
                    else applyKeywordFilter();
                }
            });
        }

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
