(function () {
    function init() {
        var mock = window.ADMIN_MOCK;
        if (!mock) return;

        var params = new URLSearchParams(window.location.search);
        var id = params.get("id");
        var user = mock.users.find(function (u) {
            return u.id === id;
        });
        if (!user) user = mock.users[0];

        function set(id, val) {
            var el = document.getElementById(id);
            if (el) el.value = val != null ? val : "";
        }

        set("user_name", user.name);
        set("user_kana", user.kana);
        set("company", user.company);
        set("email", user.email);
        set("tel", user.tel);
        set("zip", user.zip);
        set("address", user.address);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
