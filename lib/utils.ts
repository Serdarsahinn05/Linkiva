// lib/utils.ts
export const isValidUsername = (username: string): boolean => {
    // Sadece küçük harf, rakam, nokta ve alt çizgi. Boşluk ve özel karakter yasak!
    const usernameRegex = /^[a-z0-9._]+$/;
    return usernameRegex.test(username);
};

// URL'deki garip karakterleri temizlemek için yardımcı
export const slugify = (text: string) => {
    return text
        .toLowerCase()
        .replace(/\s+/g, '')           // Boşlukları sil
        .replace(/[^a-z0-9._]/g, '');  // Geçersiz her şeyi sil
};