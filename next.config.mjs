/** @type {import('next').NextConfig} */
const nextConfig = {
  // The brand + asset-type markdown in context/ is read at request time via fs.
  // Next doesn't auto-trace fs reads, so bundle the docs into every API function.
  experimental: {
    outputFileTracingIncludes: {
      '/api/**': ['./context/**/*'],
    },
  },
};
export default nextConfig;
