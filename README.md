# AutoCRM

A modern CRM application built with React, Supabase, and AWS Amplify.

## Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)
- Supabase account
- AWS account

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd autocrm
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase URL and anon key

4. Start the development server:
```bash
npm run dev
```

## Deployment

### AWS Amplify Setup

1. Install AWS Amplify CLI:
```bash
npm install -g @aws-amplify/cli
```

2. Configure Amplify:
```bash
amplify configure
```

3. Initialize Amplify in the project:
```bash
amplify init
```

4. Push to AWS:
```bash
amplify push
```

## Project Structure

```
src/
  ├── components/     # Reusable UI components
  ├── pages/         # Page components
  ├── config/        # Configuration files
  ├── services/      # API and service integrations
  └── utils/         # Utility functions
```

## Built With

- React + TypeScript
- Vite
- Material-UI
- Supabase
- AWS Amplify



## Debugging

auto deploy on amplify by pushing to github.
Check the build status:

```
function amplify-status() {
  aws amplify list-jobs \
    --app-id $(terraform output -raw amplify_app_id) \
    --branch-name $(terraform output -raw amplify_branch_name) \
    --query 'jobSummaries[0].[jobId,status,startTime,endTime]' \
    --output table
}
```