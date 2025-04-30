/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: [
        // add any remote domains you need for <Image> (e.g. OpenAI DALL·E)
        'oaidalleapiprodscus.blob.core.windows.net',
      ],
    },
  };
  
  export default nextConfig;
  