#!/usr/bin/env bash

# Usage: ./list_amplify_jobs.sh <BRANCH_NAME> [INTERVAL_SECONDS]
# Example: ./list_amplify_jobs.sh main 5

BRANCH_NAME="$1"
INTERVAL="${2:-10}"  # Default 10 seconds if not provided

if [ -z "$BRANCH_NAME" ]; then
  echo "Usage: $0 <BRANCH_NAME> [INTERVAL_SECONDS]"
  exit 1
fi

# Attempt to capture the Amplify App ID from terraform output if terraform state is present
if [[ -f "terraform.tfstate" ]]; then
  TF_APP_ID=$(terraform output -raw amplify_app_id 2>/dev/null)
fi

# If Terraform didn't provide a valid ID, prompt the user
if [ -z "$TF_APP_ID" ]; then
  echo "Could not read 'amplify_app_id' from Terraform."
  read -rp "Please enter your Amplify App ID manually: " TF_APP_ID
fi

# If still empty, exit
if [ -z "$TF_APP_ID" ]; then
  echo "No Amplify App ID provided. Exiting."
  exit 1
fi

echo "Using Amplify App ID: $TF_APP_ID"
echo "Branch Name: $BRANCH_NAME"
echo "Refreshing every $INTERVAL second(s)..."

# Main loop
while true; do
  clear
  echo "===== Most Recent Amplify Job (Branch: $BRANCH_NAME) ====="
  aws amplify list-jobs \
    --app-id "$TF_APP_ID" \
    --branch-name "$BRANCH_NAME" \
    --max-items 1 \
    --query 'jobSummaries[0].[jobId, status]' \
    --output table
  
  echo
  echo "Press Ctrl+C to exit..."
  sleep "$INTERVAL"
done
