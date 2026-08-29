# SecureOps AI - Agentic Threat Modeling & Cloud Run Production Suite

Production-grade Agentic AI Threat Modeling, OWASP Top 10 Web & LLM Security Auditing, Resilient Gemini Model Fallback Ladder, and Google Cloud Run Deployment Automation.

---

## 1. Production Directives Implemented

- **Agentic Threat Modeling**: 5 Threat Zones (Input Surfaces, Planning & Reasoning, Tool Execution, Memory & State, Inter-System Communication) generating structured Threat Summary Tables mapping risks to countermeasures.
- **Secure Coding Standard**: OWASP Top 10 Web & LLM01-LLM10 mitigations, input sanitization, indirect prompt injection defense, broken access control prevention, and safe output encoding.
- **Secure Firestore & Firebase Auth**: Zero insecure defaults, owner-bound data isolation (`request.auth.uid == userId`), and backend JWT verification.
- **Secret Management & Zero-Hardcoding Hygiene**: Zero hardcoded strings, Google Cloud Secret Manager dynamic credential access.
- **Security Reviewer Persona**: Automated code reviewer with severity rankings, CWE/OWASP identifiers, and concrete remediation code diffs.
- **Functional Stability & Walkthroughs**: Complete user walkthroughs and automation test cases for every process and UI interaction, paired with an automated 4-stage Gemini model fallback ladder (`gemini-3.6-flash` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest` -> `gemini-3.7-flash`).

---

## 2. Environment & Prerequisites

Ensure the Google Cloud SDK (`gcloud`) and Firebase CLI are installed and configured:

```bash
# 1. Authenticate with Google Cloud
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# 2. Enable mandatory Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com
```

---

## 3. Secret Management Setup (Zero-Hardcoding Hygiene)

Operational credentials must never be hardcoded in application source code. Store the Gemini API key securely in Google Cloud Secret Manager:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Retrieve your Google Cloud Project Number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# 3. Grant the default Cloud Run service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

Python Dynamic Access Pattern:
```python
from google.cloud import secretmanager

def access_secret(secret_id: str, version_id: str = "latest") -> str:
    client = secretmanager.SecretManagerServiceClient()
    name = f"projects/your-project-id/secrets/{secret_id}/versions/{version_id}"
    response = client.access_secret_version(request={"name": name})
    return response.payload.data.decode("UTF-8")
```

---

## 4. Database Security Configuration (Cloud Firestore Rules)

Deploy owner-bound security rules ensuring strict user isolation and zero insecure defaults:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Owner-bound path checking for personal documents
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User profile documents
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Zero insecure defaults: Deny all other unmatched paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy the rules to Firestore:
```bash
firebase deploy --only firestore:rules
```

---

## 5. Cloud Run Deployment Flow

Deploy the containerized service directly to Google Cloud Run:

```bash
gcloud run deploy secureops-ai \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
  --set-env-vars="NODE_ENV=production,PORT=3000"
```

---

## 6. Required Campaign Labeling (Verification Binding)

Apply the mandatory resource label to register the service for automated challenge verification:

```bash
gcloud run services update secureops-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```

Verify that the label was successfully registered:
```bash
gcloud run services describe secureops-ai \
  --region=asia-southeast1 \
  --format="yaml(metadata.labels)"
```

---

## 7. Local Development

```bash
# Install dependencies
npm install

# Run full-stack dev server (Express + Vite on port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```
