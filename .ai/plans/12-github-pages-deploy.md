# Step 12 — GitHub Pages Deployment (Staging then Main)

**Objective**  
Configure GitHub Actions to build and publish the site to GitHub Pages. Start with a staging branch; then switch to `main` after approval.

**Actions**  
1. Add workflow `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy Starlight to GitHub Pages
   on:
     push:
       branches: [ staging ]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   concurrency:
     group: "pages"
     cancel-in-progress: false

   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm ci
         - run: npm run build
         - name: Upload Pages artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: dist
     deploy:
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       runs-on: ubuntu-latest
       needs: build
       steps:
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```
2. Place your `CNAME` file under `public/CNAME` so it lands in `dist/` on build.
3. In repo settings, set Pages to use “GitHub Actions.”
4. After staging approval, change the workflow trigger branch from `staging` to `main`.

**Acceptance Criteria**  
- Successful build and deploy on the staging branch.
- Site available at the GitHub Pages staging URL.
- After approval, main branch deploys without changes to build output.
