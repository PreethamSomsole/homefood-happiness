const repoName = 'homefood-happiness'
const isPages = process.env.GITHUB_PAGES === 'true'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: isPages ? `/${repoName}` : '',
  assetPrefix: isPages ? `/${repoName}/` : '',
  trailingSlash: true,
}

export default nextConfig
