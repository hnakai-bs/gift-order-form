/**
 * デモ用の管理画面モックデータ（静的HTML用）
 */
(function () {
    function orderContentFromProducts(products) {
        if (!products || !products.length) return "";
        return products
            .map(function (p) {
                return String(p.sku || "") + "×" + String(p.qty != null ? p.qty : 0);
            })
            .join("\n");
    }

    var orderDetails = {
        o1: {
            destLine: "株式会社エービーシー 山田 太郎 様",
            destAddress: "〒100-0001\n東京都千代田区千代田1-1-1 〇〇ビル 10F",
            destTel: "03-1234-5678",
            products: [
                { sku: "A-101", name: "プレミアムカタログギフト（和・山吹）", qty: 1, subtotal: "2,000円" },
            ],
            useNoshi: "お中元",
            nameType: "フルネーム",
            nameText: "山田 太郎",
            deliveryDate: "2026年3月30日(月)",
            deliveryTime: "午前中",
            payment: "銀行振込",
            email: "example@example.com",
            productTotal: "2,000円",
            shipping: "880円",
            grandTotal: "2,880円",
        },
        o2: {
            destLine: "佐藤 花子 様",
            destAddress: "〒150-0001\n東京都渋谷区神宮前2-3-4",
            destTel: "0312345678",
            products: [
                { sku: "B-202", name: "プレミアムカタログギフト（洋・紺）", qty: 2, subtotal: "5,000円" },
            ],
            useNoshi: "お歳暮",
            nameType: "会社名",
            nameText: "有限会社サンプル商事",
            deliveryDate: "2026年4月5日(日)",
            deliveryTime: "14時〜16時",
            payment: "クレジットカード",
            email: "sato@example.com",
            productTotal: "5,000円",
            shipping: "880円",
            grandTotal: "5,880円",
        },
        o3: {
            destLine: "合同会社グリーン 御中",
            destAddress: "〒810-0001\n福岡県福岡市中央区天神2-2-2",
            destTel: "0921234567",
            products: [
                { sku: "N-010", name: "のり詰め合わせ Aセット", qty: 1, subtotal: "3,500円" },
                { sku: "PKG-01", name: "ギフト包装・のし紙（お中元）", qty: 1, subtotal: "0円" },
            ],
            useNoshi: "その他",
            nameType: "フルネーム",
            nameText: "高橋 美咲",
            deliveryDate: "2026年4月8日(水)",
            deliveryTime: "指定なし",
            payment: "銀行振込",
            email: "takahashi@example.com",
            productTotal: "3,500円",
            shipping: "880円",
            grandTotal: "4,380円",
        },
        o4: {
            destLine: "鈴木 一郎 様",
            destAddress: "〒530-0001\n大阪府大阪市北区梅田3-3-3",
            destTel: "08011112222",
            products: [
                { sku: "G-500", name: "ギフト券 3,000円", qty: 5, subtotal: "15,000円" },
            ],
            useNoshi: "内祝い",
            nameType: "フルネーム",
            nameText: "鈴木 一郎",
            deliveryDate: "2026年2月25日(水)",
            deliveryTime: "午前中",
            payment: "銀行振込",
            email: "suzuki@example.com",
            productTotal: "15,000円",
            shipping: "0円",
            grandTotal: "15,000円",
        },
    };

    window.ADMIN_MOCK = {
        users: [
            {
                id: "u1",
                name: "山田 太郎",
                kana: "ヤマダ タロウ",
                company: "株式会社エービーシー",
                companyKana: "カブシキガイシャエービーシー",
                email: "yamada@example.com",
                tel: "09012345678",
                zip: "1000001",
                address: "東京都千代田区千代田1-1",
                registeredAt: "2026-04-02",
                latestOrderDate: "2026-03-28",
            },
            {
                id: "u2",
                name: "佐藤 花子",
                kana: "サトウ ハナコ",
                company: "有限会社サンプル商事",
                companyKana: "ユウゲンガイシャサンプルショウジ",
                email: "sato@example.com",
                tel: "0312345678",
                zip: "1500001",
                address: "東京都渋谷区神宮前1-2-3",
                registeredAt: "2026-03-25",
                latestOrderDate: "2026-03-30",
            },
            {
                id: "u3",
                name: "鈴木 一郎",
                kana: "スズキ イチロウ",
                company: "株式会社テックリンク",
                companyKana: "カブシキガイシャテックリンク",
                email: "suzuki@example.com",
                tel: "08011112222",
                zip: "5300001",
                address: "大阪府大阪市北区梅田1-1",
                registeredAt: "2026-02-10",
                latestOrderDate: "2026-01-15",
            },
            {
                id: "u4",
                name: "高橋 美咲",
                kana: "タカハシ ミサキ",
                company: "合同会社グリーン",
                companyKana: "ゴウドウガイシャグリーン",
                email: "takahashi@example.com",
                tel: "0921234567",
                zip: "8100001",
                address: "福岡県福岡市中央区天神1-1",
                registeredAt: "2026-04-01",
                latestOrderDate: null,
            },
        ],
        orders: [
            {
                id: "o1",
                date: "2026-03-30",
                ordererName: "山田 太郎（株式会社エービーシー）",
                destName: "株式会社エービーシー 山田 太郎 様",
                content: orderContentFromProducts(orderDetails.o1.products),
            },
            {
                id: "o2",
                date: "2026-04-01",
                ordererName: "佐藤 花子（有限会社サンプル商事）",
                destName: "佐藤 花子 様",
                content: orderContentFromProducts(orderDetails.o2.products),
            },
            {
                id: "o3",
                date: "2026-04-02",
                ordererName: "高橋 美咲（合同会社グリーン）",
                destName: "合同会社グリーン 御中",
                content: orderContentFromProducts(orderDetails.o3.products),
            },
            {
                id: "o4",
                date: "2026-02-20",
                ordererName: "鈴木 一郎（株式会社テックリンク）",
                destName: "鈴木 一郎 様",
                content: orderContentFromProducts(orderDetails.o4.products),
            },
        ],
        /** confilm.html 相当の表示用（id は orders.id と対応） */
        orderDetails: orderDetails,
    };
})();
