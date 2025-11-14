# Resume-Craft-Pro - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Resume-Craft-Pro to production environments.

## Prerequisites

- Node.js 18+ installed
- Google Gemini API key (Gemini 2.0 Flash)
- Git repository access
- Deployment platform account (Vercel recommended)

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### Getting a Gemini API Key

1. Visit: https://aistudio.google.com/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key and paste it into your `.env` file

## Local Development

### Installation

```bash
# Clone the repository
git clone https://github.com/PranavMishra17/Resume-Craft-Pro.git
cd Resume-Craft-Pro

# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Run development server
npm run dev
```

The application will be available at http://localhost:3000

### Building Locally

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Deployment to Vercel (Recommended)

### One-Click Deploy

Click the button below to deploy to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PranavMishra17/Resume-Craft-Pro)

### Manual Deployment

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables**:
   - Go to your project dashboard on Vercel
   - Navigate to Settings → Environment Variables
   - Add `GEMINI_API_KEY` with your API key
   - Redeploy the application

5. **Production Deployment**:
   ```bash
   vercel --prod
   ```

### Vercel Configuration

The project includes a `vercel.json` configuration (if needed):

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

## Deployment to Netlify

1. **Build Configuration**:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18

2. **Environment Variables**:
   - Add `GEMINI_API_KEY` in Site settings → Environment variables

3. **Deploy**:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login
   netlify login

   # Deploy
   netlify deploy --prod
   ```

## Deployment to Custom Server

### Using PM2 (Process Manager)

1. **Install PM2**:
   ```bash
   npm install -g pm2
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Start with PM2**:
   ```bash
   pm2 start npm --name "resume-craft-pro" -- start
   ```

4. **Configure PM2 to start on boot**:
   ```bash
   pm2 startup
   pm2 save
   ```

5. **Monitor the application**:
   ```bash
   pm2 status
   pm2 logs resume-craft-pro
   ```

### Using Docker

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build

   EXPOSE 3000

   ENV NODE_ENV=production

   CMD ["npm", "start"]
   ```

2. **Build Docker image**:
   ```bash
   docker build -t resume-craft-pro .
   ```

3. **Run container**:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e GEMINI_API_KEY=your_api_key \
     --name resume-craft-pro \
     resume-craft-pro
   ```

## Post-Deployment Checklist

- [ ] Verify GEMINI_API_KEY is set correctly
- [ ] Test file upload functionality
- [ ] Test LaTeX parsing with sample resume
- [ ] Test keyword analysis endpoint
- [ ] Test full optimization workflow
- [ ] Test all export formats (LaTeX, DOCX, PDF, Markdown)
- [ ] Check token tracking and cost calculation
- [ ] Verify localStorage is working (chat history, token usage)
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Check mobile responsiveness
- [ ] Monitor API usage and costs
- [ ] Set up error logging (optional: Sentry, LogRocket)
- [ ] Configure analytics (optional: Google Analytics, Plausible)

## Performance Optimization

### Recommended Settings

1. **Enable caching** for static assets
2. **Use CDN** for faster global access
3. **Enable compression** (gzip/brotli)
4. **Optimize images** in `/public` directory
5. **Monitor API rate limits** for Gemini API

### Rate Limiting

The Gemini API has rate limits:
- Free tier: 15 requests per minute
- Paid tier: Higher limits available

Configure `maxConcurrentCalls` in optimization settings to avoid rate limiting.

## Monitoring and Logging

### Built-in Logging

The application includes comprehensive logging:
- `[TOKEN_TRACKER]` - Token usage and costs
- `[LATEX_EXPORT]` - LaTeX export operations
- `[KEYWORD_ANALYZER]` - Keyword extraction
- `[PARALLEL_OPTIMIZER]` - Optimization progress
- `[STORAGE]` - LocalStorage operations

### External Monitoring (Optional)

Recommended tools:
- **Error Tracking**: Sentry
- **Performance Monitoring**: Vercel Analytics, New Relic
- **User Analytics**: Google Analytics, Plausible
- **Uptime Monitoring**: UptimeRobot, Pingdom

## Security Considerations

1. **API Key Protection**:
   - Never commit `.env` to version control
   - Use environment variables for all secrets
   - Rotate API keys periodically

2. **File Upload Security**:
   - File size limits enforced (5MB per file, 20MB total)
   - Supported formats validated server-side
   - Malicious file content scanning recommended

3. **CORS Configuration**:
   - Configure allowed origins in production
   - Enable HTTPS only

4. **Rate Limiting**:
   - Implement rate limiting for API endpoints
   - Use Vercel Edge Config or similar

## Backup and Recovery

### Data Backup

LocalStorage data is stored client-side. For server-side persistence:

1. **Implement Database** (optional):
   - PostgreSQL with Supabase
   - MongoDB Atlas
   - Firebase Firestore

2. **Backup Strategy**:
   - Regular database backups
   - Version control for code
   - Export token usage data periodically

### Disaster Recovery

1. **Code Repository**: GitHub (already configured)
2. **Deployment Rollback**: Use Vercel's instant rollback feature
3. **Database Snapshots**: Enable automatic backups on your database provider

## Scaling Considerations

### Horizontal Scaling

- **Serverless Functions**: Vercel/Netlify automatically scale
- **CDN**: Use Vercel Edge Network or Cloudflare

### Vertical Scaling

- **Increase Function Memory**: Vercel Pro plan allows up to 3GB
- **Optimize Bundle Size**: Use code splitting, lazy loading

### Cost Optimization

1. **Monitor Gemini API Usage**:
   - Track tokens in TokenCounter component
   - Set budget alerts in Google Cloud Console

2. **Optimize Concurrent Calls**:
   - Adjust `maxConcurrentCalls` based on usage patterns
   - Use targeted mode for cost-effective optimization

3. **Cache Responses**:
   - Implement caching for repeated keyword extractions
   - Cache resume parsing results

## Troubleshooting

### Common Issues

1. **Build Fails**:
   ```bash
   # Clear cache and rebuild
   rm -rf .next node_modules
   npm install
   npm run build
   ```

2. **API Key Not Working**:
   - Verify key is correct in environment variables
   - Check Gemini API quota and billing
   - Ensure key has proper permissions

3. **File Upload Fails**:
   - Check file size limits (5MB per file)
   - Verify supported formats (.tex, .docx, .pdf, .txt, .md)
   - Check server memory limits

4. **TypeScript Errors**:
   - Ensure all dependencies are installed
   - Run `npm run build` to check for errors
   - Check `tsconfig.json` configuration

## Support and Maintenance

### Updating Dependencies

```bash
# Check for outdated packages
npm outdated

# Update to latest compatible versions
npm update

# Update to latest major versions (careful!)
npm install <package>@latest
```

### Version Updates

Follow semantic versioning:
- **Patch** (1.0.x): Bug fixes
- **Minor** (1.x.0): New features, backward compatible
- **Major** (x.0.0): Breaking changes

## Additional Resources

- **Documentation**: https://github.com/PranavMishra17/Resume-Craft-Pro/blob/main/README.md
- **Architecture**: RESUME_OPTIMIZATION_ARCHITECTURE.md
- **Quick Start**: QUICKSTART.md
- **Libraries**: LIBRARIES.md
- **Google Gemini API**: https://ai.google.dev/docs
- **Next.js Deployment**: https://nextjs.org/docs/deployment

## Contact and Support

For issues and support:
- **GitHub Issues**: https://github.com/PranavMishra17/Resume-Craft-Pro/issues
- **Creator**: Pranav Mishra
  - LinkedIn: https://www.linkedin.com/in/pranavgamedev/
  - Portfolio: https://portfolio-pranav-mishra-paranoid.vercel.app

---

**Last Updated**: 2025-01-15
**Version**: 1.0.0
