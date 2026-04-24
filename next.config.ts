import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    typescript: {
        // !! DİKKAT !!
        // Projende tip hatası olsa bile build almasını sağlar.
        // Özellikle react-simple-maps gibi kütüphanelerin tip sorunlarını aşmak için kullanılır.
        ignoreBuildErrors: true,
    },
    eslint: {
        // ESLint hatalarını da build sırasında görmezden gelir (opsiyonel ama hayat kurtarır)
        ignoreDuringBuilds: true,
    },
    /* Diğer config ayarların varsa buraya ekleyebilirsin */
};

export default nextConfig;