# Build context must be the REPO ROOT (brand/ is imported by the compositions):
#   docker build -f reels/Dockerfile -t sacred-reels .
FROM node:22-bookworm-slim

# Chromium runtime deps for Remotion's headless renderer
RUN apt-get update && apt-get install -y --no-install-recommends \
  libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
  libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
  libasound2 libpango-1.0-0 libcairo2 fonts-liberation ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY reels/package.json ./reels/
RUN cd reels && npm install --no-audit --no-fund

# Download Chromium BEFORE copying source, so editing a composition doesn't
# re-download a few hundred MB on every rebuild. This layer only invalidates
# when package.json changes.
RUN cd reels && npx remotion browser ensure

COPY brand ./brand
COPY reels ./reels
RUN cd reels && node scripts/sync-glyphs.mjs

EXPOSE 3123
CMD ["node", "reels/server/index.mjs"]
