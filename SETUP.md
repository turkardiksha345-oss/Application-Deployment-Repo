# Setup and Deployment Guide

## Quick Reference

This guide provides step-by-step instructions for setting up, developing, testing, and deploying the Game Arena application.

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Docker Deployment](#docker-deployment)
3. [Kubernetes Deployment](#kubernetes-deployment)
4. [ArgoCD GitOps Setup](#argocd-gitops-setup)
5. [CI/CD Pipeline Configuration](#cicd-pipeline-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites
- Node.js 18.x
- npm or yarn
- Git
- Docker & Docker Compose (optional)

### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/game-deployment.git
cd game-deployment
```

### Step 2: Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 3: Configure Environment

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your settings
nano .env
```

### Step 4: Start Services

**Option A: Individual Terminals**

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

**Option B: Docker Compose**
```bash
docker-compose up
```

### Step 5: Access Application

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api
- Backend Health: http://localhost:3000/api/health

---

## Docker Deployment

### Build Images

```bash
# Build backend
docker build -f backend/Dockerfile -t game-backend:v1.0.0 .

# Build frontend
docker build -f frontend/Dockerfile -t game-frontend:v1.0.0 .

# Tag for registry
docker tag game-backend:v1.0.0 artifactory.company.com/game-app/backend:v1.0.0
docker tag game-frontend:v1.0.0 artifactory.company.com/game-app/frontend:v1.0.0
```

### Push to JFrog Artifactory

```bash
# Login
docker login artifactory.company.com -u <username> -p <password>

# Push images
docker push artifactory.company.com/game-app/backend:v1.0.0
docker push artifactory.company.com/game-app/frontend:v1.0.0
```

### Run with Docker

```bash
# Backend
docker run -d \
  --name game-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  game-backend:v1.0.0

# Frontend
docker run -d \
  --name game-frontend \
  -p 3001:3001 \
  -e REACT_APP_API_URL=http://localhost:3000 \
  game-frontend:v1.0.0
```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3.x installed
- Images pushed to JFrog Artifactory

### Step 1: Create Namespace

```bash
kubectl create namespace game-app
kubectl label namespace game-app app.kubernetes.io/name=game-app
```

### Step 2: Create Docker Registry Secret

```bash
kubectl create secret docker-registry jfrog-secret \
  --docker-server=artifactory.company.com \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=devops@company.com \
  -n game-app
```

### Step 3: Deploy with Helm

**Default deployment:**
```bash
helm install game-app helm/game-app \
  --namespace game-app \
  --set backend.image.repository=artifactory.company.com/game-app/backend \
  --set frontend.image.repository=artifactory.company.com/game-app/frontend
```

**Development environment:**
```bash
helm install game-app helm/game-app \
  -f helm/values-dev.yaml \
  --namespace game-app
```

**Production environment:**
```bash
helm install game-app helm/game-app \
  -f helm/values-prod.yaml \
  --namespace game-app
```

### Step 4: Verify Deployment

```bash
# Check pods
kubectl get pods -n game-app

# Check services
kubectl get svc -n game-app

# Check ingress
kubectl get ingress -n game-app

# View pod logs
kubectl logs -n game-app -l app.kubernetes.io/name=game-app -f

# Port forward
kubectl port-forward -n game-app svc/game-app-frontend 3001:3001
```

### Step 5: Upgrade Deployment

```bash
helm upgrade game-app helm/game-app \
  --namespace game-app \
  --values custom-values.yaml
```

### Step 6: Rollback Deployment

```bash
helm rollback game-app [REVISION] --namespace game-app
```

---

## ArgoCD GitOps Setup

### Prerequisites

- ArgoCD installed on cluster
- Git repository access token
- Application repository configured

### Step 1: Install ArgoCD (if needed)

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait -n argocd --for=condition=Ready pod -l app.kubernetes.io/name=argocd-server
```

### Step 2: Configure Git Repository Secret

```bash
# Create secret for repository access
kubectl create secret generic argocd-repo-creds \
  --from-literal=url=https://github.com/your-org/game-deployment.git \
  --from-literal=password=<github-token> \
  --from-literal=username=not-used \
  -n argocd
```

### Step 3: Create ArgoCD Project

```bash
kubectl apply -f argocd/project.yaml
```

### Step 4: Create ArgoCD Application

```bash
kubectl apply -f argocd/application.yaml
```

### Step 5: Sync Application

```bash
# Via kubectl
kubectl patch argocd-resource game-app -p '{"spec": {"syncPolicy": {"automated": {"selfHeal": true}}}}' \
  -n argocd

# Via ArgoCD CLI
argocd app sync game-app --server argocd.company.com --auth-token <token>
```

### Step 6: Access ArgoCD UI

```bash
kubectl port-forward -n argocd svc/argocd-server 8080:443

# Open browser: https://localhost:8080
# Default credentials: admin / <auto-generated-password>

# Get password:
kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}" | base64 -d
```

---

## CI/CD Pipeline Configuration

### GitHub Secrets Setup

Add these secrets to GitHub repository settings:

```
JFROG_USERNAME: <username>
JFROG_PASSWORD: <password>
ARGOCD_SERVER: argocd.company.com
ARGOCD_AUTH_TOKEN: <argocd-token>
SLACK_WEBHOOK: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Self-Hosted Runner Setup

See [Build-runner/README.md](../Build-runner/README.md) for runner image creation.

```bash
# Register runner
./config.sh \
  --url https://github.com/your-org \
  --token <github-token> \
  --name k8s-runner \
  --runnergroup Default \
  --labels linux,x64,docker,kubernetes

# Run
./run.sh
```

### Trigger Pipeline

Automatic on push to `main`:
```bash
git push origin main
```

Manual trigger via GitHub Actions UI.

---

## Troubleshooting

### Docker Issues

**Container won't start:**
```bash
# Check logs
docker logs <container-id>

# Inspect image
docker inspect <image>

# Test locally with bash
docker run -it game-backend:latest /bin/sh
```

### Kubernetes Issues

**Pods not starting:**
```bash
# Describe pod
kubectl describe pod <pod-name> -n game-app

# Check events
kubectl get events -n game-app --sort-by=.metadata.creationTimestamp

# View pod logs
kubectl logs <pod-name> -n game-app
```

**Service not accessible:**
```bash
# Check service
kubectl get svc -n game-app

# Check endpoints
kubectl get endpoints -n game-app

# Port forward for testing
kubectl port-forward svc/game-app-backend 3000:3000 -n game-app
```

**Resource issues:**
```bash
# Check resource usage
kubectl top pods -n game-app
kubectl top nodes

# Check limits
kubectl describe resourcequota -n game-app
```

### WebSocket Connection Issues

**Frontend can't connect:**
```bash
# Check backend is running
kubectl get pods -n game-app -l component=backend

# Check backend logs
kubectl logs -n game-app -l component=backend

# Test WebSocket endpoint
wscat -c ws://backend-service:3000/ws
```

### ArgoCD Sync Issues

**Application out of sync:**
```bash
# Manual sync
kubectl patch application game-app -n argocd -p '{"spec":{"syncPolicy":{}}}' --type merge

# Check application status
kubectl describe application game-app -n argocd
```

---

## Performance Tuning

### Increase Replicas

```bash
helm upgrade game-app helm/game-app \
  --set backend.replicaCount=10 \
  --set frontend.replicaCount=5 \
  -n game-app
```

### Adjust Resource Limits

```bash
helm upgrade game-app helm/game-app \
  --set backend.resources.limits.cpu=2000m \
  --set backend.resources.limits.memory=2Gi \
  -n game-app
```

### Enable HPA Monitoring

```bash
kubectl get hpa -n game-app -w
```

---

## Rollback Strategy

**Helm Rollback:**
```bash
# List releases
helm history game-app -n game-app

# Rollback to previous
helm rollback game-app --namespace game-app

# Rollback to specific version
helm rollback game-app 2 --namespace game-app
```

**Kubernetes Rollout:**
```bash
# Check rollout status
kubectl rollout status deployment/game-app-backend -n game-app

# Rollback deployment
kubectl rollout undo deployment/game-app-backend -n game-app

# Rollback to specific revision
kubectl rollout undo deployment/game-app-backend --to-revision=2 -n game-app
```

---

## Monitoring Commands

```bash
# Watch pod status
kubectl get pods -n game-app -w

# Real-time resource usage
kubectl top pods -n game-app --containers

# Check HPA status
kubectl get hpa -n game-app

# View application status
kubectl get application game-app -n argocd -o wide

# Get deployment events
kubectl get events -n game-app --sort-by=.metadata.creationTimestamp
```

---

## Additional Resources

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)
- [Helm Chart Documentation](./helm/game-app/README.md)
- [ArgoCD Documentation](https://argoproj.github.io/argo-cd/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

---

**Last Updated**: 2024
**Version**: 1.0.0
