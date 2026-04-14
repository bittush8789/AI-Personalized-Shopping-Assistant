#!/bin/bash

# ==============================================================================
# AI Personalized Shopping Assistant - Infrastructure Setup Script
# This script installs the necessary tools and platform components for the project.
# Supported OS: Ubuntu/Debian (Linux)
# ==============================================================================

set -e

echo "🚀 Starting Infrastructure Setup..."

# 1. Update System
sudo apt-get update

# 2. Install Git
echo "📦 Installing Git..."
sudo apt-get install -y git

# 3. Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Note: You may need to log out and back in for group changes to take effect."
else
    echo "✅ Docker already installed."
fi

# 4. Install Kubectl
echo "☸️ Installing Kubectl..."
if ! command -v kubectl &> /dev/null; then
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
else
    echo "✅ Kubectl already installed."
fi

# 5. Install Kind (Kubernetes in Docker)
echo "🏗️ Installing Kind..."
if ! command -v kind &> /dev/null; then
    [ $(uname -m) = x86_64 ] && curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
    chmod +x ./kind
    sudo mv ./kind /usr/local/bin/kind
else
    echo "✅ Kind already installed."
fi

# 6. Create Kind Cluster
echo "🌟 Creating Kind Cluster 'ai-shop'..."
if ! kind get clusters | grep -q "ai-shop"; then
    kind create cluster --name ai-shop
else
    echo "✅ Kind cluster 'ai-shop' already exists."
fi

# 7. Install Helm
echo "⛵ Installing Helm..."
if ! command -v helm &> /dev/null; then
    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
else
    echo "✅ Helm already installed."
fi

# 8. Install ArgoCD using Helm
echo "🐙 Installing ArgoCD via Helm..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm upgrade --install argocd argo/argo-cd -n argocd

# 9. Install Prometheus & Grafana using Helm (kube-prometheus-stack)
echo "📈 Installing Prometheus & Grafana..."
kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm upgrade --install kube-stack prometheus-community/kube-prometheus-stack -n monitoring

echo "--------------------------------------------------"
echo "✅ Setup Complete!"
echo "--------------------------------------------------"
echo "ArgoCD UI: kubectl port-forward -n argocd svc/argocd-server 8080:443"
echo "Grafana UI: kubectl port-forward -n monitoring svc/kube-stack-grafana 3001:80"
echo "Default Grafana Login: admin / prom-operator"
echo "--------------------------------------------------"
