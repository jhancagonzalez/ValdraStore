import { withPayload } from "@payloadcms/next/withPayload";

const supabaseHostname = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : "pfvhzecrervwtsetspqq.supabase.co";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    globalNotFound: true,
  },
  images: {
    minimumCacheTTL: 86400,
    remotePatterns: [{ hostname: supabaseHostname, protocol: "https" }],
  },
};

export default withPayload(nextConfig);
