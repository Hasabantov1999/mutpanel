export interface MutCalculationInput {
    panelYatirim: number;
    panelCekim: number;
    devir: number;
    komisyonOrani: number;
    araciKomisyonOrani?: number | null;
    manuelYatirimlar: { miktar: number }[];
    manuelCekimler: { miktar: number }[];
    teslimatlar: { miktar: number; komisyonOrani?: number | null }[];
}

/**
 * Merkezi MUT Hesaplama Fonksiyonu
 * Formül: Devir + Toplam Yatırımlar - Toplam Çekimler - Teslimatlar - Genel Komisyon - Aracı Komisyon - Teslimat Komisyonları
 */
export const calculateMutFinances = (input: MutCalculationInput) => {
    const manuelYatirimTotal = input.manuelYatirimlar.reduce((sum, m) => sum + (Number(m.miktar) || 0), 0);
    const manuelCekimTotal = input.manuelCekimler.reduce((sum, m) => sum + (Number(m.miktar) || 0), 0);
    const teslimatTotal = input.teslimatlar.reduce((sum, t) => sum + (Number(t.miktar) || 0), 0);

    const teslimatMasrafiTotal = input.teslimatlar.reduce((sum, t) => {
        const miktar = Number(t.miktar) || 0;
        const oran = Number(t.komisyonOrani) || 0;
        return sum + (miktar * (oran / 100));
    }, 0);

    const toplamYatirim = (Number(input.panelYatirim) || 0) + manuelYatirimTotal;
    const toplamCekim = (Number(input.panelCekim) || 0) + manuelCekimTotal;

    // Genel Komisyon: (Panel Yatırım + Manuel Yatırımlar) üzerinden
    const komisyon = toplamYatirim * ((Number(input.komisyonOrani) || 0) / 100);

    // Aracı Komisyon: (Panel Yatırım + Manuel Yatırımlar) üzerinden
    const araciKomisyon = toplamYatirim * ((Number(input.araciKomisyonOrani) || 0) / 100);

    // KASA = Devir + Yatırım + Manuel Yatırım - Çekim - Manuel Çekim - Teslimatlar - Komisyon - Aracı Komisyon - Teslimat Masrafları
    const kasa = (Number(input.devir) || 0) + toplamYatirim - toplamCekim - teslimatTotal - komisyon - araciKomisyon - teslimatMasrafiTotal;

    return {
        manuelYatirimTotal,
        manuelCekimTotal,
        teslimatTotal,
        teslimatMasrafiTotal,
        toplamYatirim,
        toplamCekim,
        komisyon,
        araciKomisyon,
        kasa
    };
};
