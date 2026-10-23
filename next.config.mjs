import { withPayload } from "@payloadcms/next/withPayload";

const supabaseHostname = process.env.SUPABASE_URL
  ? new URL(process.env.SUPABASE_URL).hostname
  : "pfvhzecrervwtsetspqq.supabase.co";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ hostname: supabaseHostname, protocol: "https" }],
  },
};

export default withPayload(nextConfig);
