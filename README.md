# Game Arena - Multi-Player Game Application

A complete full-stack multiplayer game application with real-time WebSocket communication, featuring a modern React frontend with game UI animations and a robust Node.js backend.

## 🎮 Features

### Frontend
- ✨ **Interactive Game UI** with smooth animations
- 🎨 **Canvas-based 2D rendering** for game arena
- ⌨️ **Keyboard controls** for player movement
- 💬 **Real-time chat** system
- 📊 **Live leaderboard** updates
- 🎯 **Click-to-score** game mechanics

### Backend
- 🔌 **WebSocket support** for real-time communication
- 👥 **Multi-player game sessions** (up to 4 players per game)
- 📈 **Score tracking** and leaderboard management
- 🏃 **Player position tracking** and state management
- 💪 **Health system** with regeneration
- 🛡️ **Error handling** and graceful degradation

### DevOps & Infrastructure
- 🐳 **Docker containerization** for both frontend and backend
- ☸️ **Kubernetes deployment** with Helm charts
- 🤖 **GitHub Actions** CI/CD pipeline
- 🔄 **ArgoCD** for GitOps deployment
- 📦 **JFrog Artifactory** integration
- 🖥️ **Self-hosted GitHub runner** support

## 📋 Project Structure

```
game-deployment/
├── frontend/                      # React frontend application
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/           # React components
│   │   │   ├── GameLobby.js     # Game lobby interface
│   │   │   ├── GameArena.js     # Game canvas and controls
│   │   │   └── ChatBox.js       # In-game chat
│   │   ├── styles/              # Component stylesheets
│   │   ├── App.js               # Main app component
│   │   ├── index.js             # Entry point
│   │   └── index.css            # Global styles
│   ├── package.json
│   └── Dockerfile
├── backend/                       # Node.js backend
│   ├── index.js                 # Main server
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── helm/                          # Kubernetes Helm charts
│   └── game-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── backend-deployment.yaml
│           ├── frontend-deployment.yaml
│           ├── service.yaml
│           ├── ingress.yaml
│           ├── hpa.yaml
│           ├── serviceaccount.yaml
│           └── _helpers.tpl
├── argocd/                        # ArgoCD configurations
│   ├── application.yaml          # ArgoCD Application
│   └── project.yaml              # ArgoCD Project
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions pipeline
├── docker-compose.yml            # Local development setup
└── README.md                      # This file
```

## 🚀 Quick Start

### Local Development with Docker Compose

**Prerequisites:**
- Docker & Docker Compose installed
- Node.js 18+ (for native development)

**Setup:**

```bash
# Clone the repository
git clone https://github.com/your-org/game-deployment.git
cd game-deployment

# Start services
docker-compose up -d

# Access the application
# Frontend: http://localhost:3001
# Backend API: http://localhost:3000/api
# Backend WebSocket: ws://localhost:3000/ws
```

**Logs:**
```bash
# View backend logs
docker-compose logs -f game-backend

# View frontend logs
docker-compose logs -f game-frontend
```

**Stop services:**
```bash
docker-compose down
```

### Local Native Development

**Backend:**
```bash
cd backend
npm install
npm start  # Runs on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3001
```

## 🏗️ Architecture

### Application Flow

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ HTTP/WebSocket
       ▼
┌──────────────────┐
│  Nginx/Ingress   │
└──────┬───────────┘
       │
   ┌───┴───┐
   │       │
   ▼       ▼
┌─────┐ ┌────────┐
│  FE │ │ Backend│
│Pods │ │  Pods  │
└─────┘ └────────┘
```

### Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2.0 |
| Backend | Node.js | 18 |
| Runtime | Express + WebSocket | Latest |
| Container | Docker | Latest |
| Orchestration | Kubernetes | 1.24+ |
| Package Mgmt | Helm | 3.x |
| GitOps | ArgoCD | Latest |
| Registry | JFrog | Latest |

## 🎮 Game Mechanics

### Player Movement
- **Arrow Keys** or **WASD**: Move player
- **Movement Speed**: 5 pixels per frame
- **Boundary Collision**: Players cannot move outside the arena

### Scoring
- **Click on Canvas**: +10 points
- **Leaderboard**: Real-time score updates
- **Win Condition**: Highest score after game time

### Game Session
- **Min Players**: 1
- **Max Players**: 4
- **Game Status**: Waiting → Active → Finished

## 📡 API Endpoints

### REST API

```bash
# Check health
GET /api/health

# Get all games
GET /api/games

# Create new game
POST /api/games

# Get specific game details
GET /api/games/:gameId

# Get server statistics
GET /api/stats
```

### WebSocket Events

**Client → Server:**
```json
{
  "type": "join_game",
  "payload": { "gameId": "...", "playerName": "..." }
}

{
  "type": "player_move",
  "payload": { "x": 100, "y": 200 }
}

{
  "type": "score_update",
  "payload": { "points": 10 }
}

{
  "type": "chat",
  "payload": { "message": "Hello!" }
}
```

## 🐳 Docker

### Build Images

```bash
# Backend image
docker build -f backend/Dockerfile -t game-backend:latest .

# Frontend image
docker build -f frontend/Dockerfile -t game-frontend:latest .
```

### Run Containers

```bash
# Backend
docker run -p 3000:3000 game-backend:latest

# Frontend
docker run -p 3001:3001 game-frontend:latest
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (1.24+)
- kubectl configured
- Helm 3.x installed
- ArgoCD (optional, for GitOps)

### Helm Installation

```bash
# Add Helm chart repository (if using remote repo)
helm repo add game-charts https://artifactory.company.com/artifactory/helm-local
helm repo update

# Install with default values
helm install game-app helm/game-app --namespace game-app --create-namespace

# Install with custom values
helm install game-app helm/game-app \
  --namespace game-app \
  --values custom-values.yaml

# Upgrade deployment
helm upgrade game-app helm/game-app --namespace game-app
```

### Verify Deployment

```bash
# Check pods
kubectl get pods -n game-app

# Check services
kubectl get svc -n game-app

# View logs
kubectl logs -n game-app -l app.kubernetes.io/name=game-app -f

# Port forward for local access
kubectl port-forward -n game-app svc/game-app-frontend 3001:3001
```

### ArgoCD Deployment

```bash
# Create namespace
kubectl create namespace argocd
kubectl create namespace game-app

# Install ArgoCD (if not already installed)
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Deploy Game App via ArgoCD
kubectl apply -f argocd/application.yaml

# Access ArgoCD UI
kubectl port-forward -n argocd svc/argocd-server 8080:443
# Login with admin/<generated-password>
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

The pipeline includes:

1. **Test Stage**: Linting and unit tests
2. **Build Stage**: Docker image creation
3. **Security Scan**: Vulnerability scanning with Trivy
4. **Deploy Stage**: Push to JFrog and ArgoCD sync

### Trigger Pipeline

Automatically on:
- Push to `main` branch
- Push to `develop` branch

Manually via GitHub Actions UI.

## 📊 Monitoring & Logging

### Prometheus Metrics

Backend exposes metrics at `/metrics` endpoint.

### Health Checks

- **Liveness Probe**: `/api/health` (HTTP)
- **Readiness Probe**: `/api/health` (HTTP)
- **Initial Delay**: 30s
- **Period**: 10s

### Logs

```bash
# Docker Compose
docker-compose logs -f game-backend
docker-compose logs -f game-frontend

# Kubernetes
kubectl logs -n game-app -f deployment/game-app-backend
kubectl logs -n game-app -f deployment/game-app-frontend
```

## 🔒 Security

- ✅ Non-root user for containers
- ✅ Security context configured
- ✅ Network policies supported
- ✅ RBAC enabled
- ✅ Secret management via K8s Secrets
- ✅ TLS/SSL ready

## 📈 Scaling

### Horizontal Pod Autoscaling

```yaml
Backend HPA:
- Min Replicas: 2
- Max Replicas: 10
- Target CPU: 70%
- Target Memory: 80%

Frontend HPA:
- Min Replicas: 1
- Max Replicas: 5
- Target CPU: 80%
```

## 🛠️ Configuration

### Environment Variables

**Backend** (`.env`):
```env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
WS_PATH=/ws
MAX_PLAYERS_PER_GAME=4
```

**Frontend** (React):
```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_WS_URL=ws://localhost:3000/ws
NODE_ENV=production
```

### Helm Values Override

```yaml
# custom-values.yaml
backend:
  replicaCount: 5
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi

frontend:
  replicaCount: 3
```

## 🐛 Troubleshooting

### Backend Connection Issues

```bash
# Test backend health
curl http://localhost:3000/api/health

# Check WebSocket connectivity
wscat -c ws://localhost:3000/ws
```

### Frontend Not Connecting

1. Check browser console for errors
2. Verify backend is running on port 3000
3. Check CORS configuration
4. Verify WebSocket proxy settings

### Pod Crashing

```bash
# Check pod events
kubectl describe pod <pod-name> -n game-app

# View pod logs
kubectl logs <pod-name> -n game-app

# Check resource requests/limits
kubectl top pods -n game-app
```

## 📝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support & Contact

- **Documentation**: [GitHub Wiki](https://github.com/your-org/game-deployment/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/game-deployment/issues)
- **Email**: devops@company.com
- **Slack**: #game-app-support

## 🙏 Acknowledgments

- React team for amazing frontend framework
- Node.js team for reliable backend runtime
- Kubernetes community for orchestration
- ArgoCD for GitOps excellence

---

**Last Updated**: 2024
**Version**: 1.0.0
