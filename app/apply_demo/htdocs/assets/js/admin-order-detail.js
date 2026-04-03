(function () {
    function init() {
        var mock = window.ADMIN_MOCK;
        if (!mock || !mock.orderDetails) return;

        var params = new URLSearchParams(window.location.search);
        var id = params.get("id") || "o1";
        var d = mock.orderDetails[id];
        if (!d) d = mock.orderDetails.o1;

        function setText(id, text) {
            var el = document.getElementById(id);
            if (el) el.textContent = text != null ? text : "";
        }

        function setHtml(id, html) {
            var el = document.getElementById(id);
            if (el) el.innerHTML = html;
        }

        setText("od-dest-line", d.destLine);
        setHtml("od-dest-address", (d.destAddress || "").replace(/\n/g, "<br>"));
        setText("od-dest-tel", d.destTel);

        var pt = document.getElementById("od-product-tbody");
        if (pt && d.products) {
            pt.innerHTML = d.products
                .map(function (p) {
                    return (
                        "<tr><td><span class=\"product-id-tag\">" +
                        escapeHtml(p.sku) +
                        "</span></td><td>" +
                        escapeHtml(p.name) +
                        "</td><td>" +
                        escapeHtml(String(p.qty)) +
                        "</td><td class=\"text-right\">" +
                        escapeHtml(p.subtotal) +
                        "</td></tr>"
                    );
                })
                .join("");
        }

        setText("od-use-noshi", d.useNoshi);
        setText("od-name-type", d.nameType);
        setText("od-name-text", d.nameText);
        setText("od-delivery-date", d.deliveryDate);
        setText("od-delivery-time", d.deliveryTime);
        setText("od-payment", d.payment);
        setText("od-email", d.email);
        setText("od-product-total", d.productTotal);
        setText("od-shipping", d.shipping);
        setText("od-grand-total", d.grandTotal);
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
