(function () {
    function pad(n) {
        return String(n).padStart(2, "0");
    }

    function parseYmd(s) {
        if (!s) return null;
        const p = String(s).split("-");
        if (p.length !== 3) return null;
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }

    function startOfWeekMonday(d) {
        const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const day = x.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        x.setDate(x.getDate() + diff);
        x.setHours(0, 0, 0, 0);
        return x;
    }

    function endOfWeekSunday(d) {
        const s = startOfWeekMonday(d);
        const e = new Date(s);
        e.setDate(e.getDate() + 6);
        e.setHours(23, 59, 59, 999);
        return e;
    }

    function inRange(dateStr, fromStr, toStr) {
        const t = parseYmd(dateStr);
        if (!t) return false;
        const from = fromStr ? parseYmd(fromStr) : null;
        const to = toStr ? parseYmd(toStr) : null;
        if (from && t < from) return false;
        if (to && t > to) return false;
        return true;
    }

    function filterByPeriod(items, dateKey, fromStr, toStr) {
        if (!fromStr && !toStr) return items;
        return items.filter(function (row) {
            return inRange(row[dateKey], fromStr, toStr);
        });
    }

    /** ひらがな（U+3041〜U+3096）を対応するカタカナへ（検索の正規化用） */
    function hiraganaToKatakana(s) {
        return String(s).replace(/[\u3041-\u3096]/g, function (ch) {
            return String.fromCharCode(ch.charCodeAt(0) + 0x60);
        });
    }

    /** キーワード検索用：ひらがな→カタカナのあと ASCII は小文字化 */
    function normalizeForJaSearch(s) {
        return hiraganaToKatakana(String(s || "")).toLowerCase();
    }

    function filterBySearch(items, query, keys) {
        var qRaw = (query || "").trim();
        if (!qRaw) return items;
        var qNorm = normalizeForJaSearch(qRaw);
        return items.filter(function (row) {
            return keys.some(function (k) {
                var v = row[k];
                if (v == null) return false;
                return normalizeForJaSearch(String(v)).indexOf(qNorm) !== -1;
            });
        });
    }

    function sortByMode(items, mode, dateKey, nameKey) {
        const copy = items.slice();
        if (mode === "date_desc") {
            copy.sort(function (a, b) {
                return String(b[dateKey] || "").localeCompare(String(a[dateKey] || ""));
            });
        } else if (mode === "date_asc") {
            copy.sort(function (a, b) {
                return String(a[dateKey] || "").localeCompare(String(b[dateKey] || ""));
            });
        } else if (mode === "name_desc") {
            copy.sort(function (a, b) {
                return String(b[nameKey] || "").localeCompare(String(a[nameKey] || ""), "ja");
            });
        } else {
            copy.sort(function (a, b) {
                return String(a[nameKey] || "").localeCompare(String(b[nameKey] || ""), "ja");
            });
        }
        return copy;
    }

    var jaSortCollator =
        typeof Intl !== "undefined" && typeof Intl.Collator === "function"
            ? new Intl.Collator("ja", { sensitivity: "variant", numeric: true })
            : null;

    function compareJapaneseSort(a, b) {
        var sa = String(a || "");
        var sb = String(b || "");
        if (jaSortCollator) return jaSortCollator.compare(sa, sb);
        return sa.localeCompare(sb, "ja");
    }

    /** 氏名の五十音: フリガナ（kana）優先。なければ表示名。 */
    function userNameSortKey(row) {
        var k = row.kana != null && String(row.kana).trim();
        if (k) return String(row.kana).trim();
        return row.name != null ? String(row.name) : "";
    }

    /** 会社名の五十音: companyKana 優先。なければ会社名（漢字は環境依存になりやすい）。 */
    function userCompanySortKey(row) {
        var k = row.companyKana != null && String(row.companyKana).trim();
        if (k) return String(row.companyKana).trim();
        return row.company != null ? String(row.company) : "";
    }

    /**
     * ユーザー管理一覧用: column は name | company | email | date（latestOrderDate）
     * direction: asc | desc — 日付は desc が新しい順
     * 五十音は kana / companyKana を用いる（漢字のコードポイント順ではない）
     */
    function sortUsersByColumn(items, column, direction) {
        var copy = items.slice();
        if (column === "name") {
            copy.sort(function (a, b) {
                var c = compareJapaneseSort(userNameSortKey(a), userNameSortKey(b));
                return direction === "asc" ? c : -c;
            });
        } else if (column === "company") {
            copy.sort(function (a, b) {
                var c = compareJapaneseSort(userCompanySortKey(a), userCompanySortKey(b));
                return direction === "asc" ? c : -c;
            });
        } else if (column === "email") {
            copy.sort(function (a, b) {
                var ea = String(a.email || "").toLowerCase();
                var eb = String(b.email || "").toLowerCase();
                var c = ea.localeCompare(eb, "en");
                return direction === "asc" ? c : -c;
            });
        } else {
            copy.sort(function (a, b) {
                var da = a.latestOrderDate || "";
                var db = b.latestOrderDate || "";
                if (!da && !db) return 0;
                if (!da) return 1;
                if (!db) return -1;
                var c = direction === "desc" ? db.localeCompare(da) : da.localeCompare(db);
                return c;
            });
        }
        return copy;
    }

    /**
     * お申し込み一覧用: column は date | orderer | dest
     * direction: asc | desc — 日付は desc が新しい順
     */
    function sortOrdersByColumn(items, column, direction) {
        var copy = items.slice();
        if (column === "date") {
            copy.sort(function (a, b) {
                var da = a.date || "";
                var db = b.date || "";
                if (!da && !db) return 0;
                if (!da) return 1;
                if (!db) return -1;
                return direction === "desc" ? db.localeCompare(da) : da.localeCompare(db);
            });
        } else if (column === "orderer") {
            copy.sort(function (a, b) {
                var c = compareJapaneseSort(String(a.ordererName || ""), String(b.ordererName || ""));
                return direction === "asc" ? c : -c;
            });
        } else if (column === "dest") {
            copy.sort(function (a, b) {
                var c = compareJapaneseSort(String(a.destName || ""), String(b.destName || ""));
                return direction === "asc" ? c : -c;
            });
        }
        return copy;
    }

    function csvEscape(cell) {
        const s = cell == null ? "" : String(cell);
        if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
    }

    function downloadCsv(filename, headerRow, rows) {
        const lines = [headerRow.map(csvEscape).join(",")].concat(
            rows.map(function (r) {
                return r.map(csvEscape).join(",");
            })
        );
        const bom = "\uFEFF";
        const blob = new Blob([bom + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /** 第2引数 withWeekday が false のときは「2026年3月30日」形式（曜日なし） */
    function formatYmdJa(ymd, withWeekday) {
        if (!ymd) return "—";
        const d = parseYmd(ymd);
        if (!d || isNaN(d.getTime())) return ymd;
        var base = d.getFullYear() + "年" + (d.getMonth() + 1) + "月" + d.getDate() + "日";
        if (withWeekday === false) return base;
        const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
        return base + "(" + w + ")";
    }

    window.AdminUtils = {
        startOfWeekMonday: startOfWeekMonday,
        endOfWeekSunday: endOfWeekSunday,
        filterByPeriod: filterByPeriod,
        filterBySearch: filterBySearch,
        sortByMode: sortByMode,
        sortUsersByColumn: sortUsersByColumn,
        sortOrdersByColumn: sortOrdersByColumn,
        downloadCsv: downloadCsv,
        formatYmdJa: formatYmdJa,
        pad: pad,
    };
})();
