import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // next-intl uses dynamic import(); PackFileCacheStrategy logs a harmless parsing warning
    const prev = config.ignoreWarnings || [];
    config.ignoreWarnings = [
      ...prev,
      (warning) =>
        typeof warning?.message === 'string' &&
        warning.message.includes('next-intl') &&
        warning.message.includes("import(t)"),
    ];
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default withNextIntl(nextConfig);
