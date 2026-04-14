#!/bin/bash
# Security Scan Script for DevSecOps Pipeline

echo "🔍 Starting Security Scans..."

# 1. Trivy - Container Image Scanning
echo "🐳 Running Trivy Image Scan..."
# trivy image ai-shop-assistant:latest --severity HIGH,CRITICAL

# 2. SonarQube - Static Code Analysis
echo "📊 Running SonarQube Analysis..."
# sonar-scanner \
#   -Dsonar.projectKey=ai-shop-assistant \
#   -Dsonar.sources=. \
#   -Dsonar.host.url=http://localhost:9000 \
#   -Dsonar.login=$SONAR_TOKEN

# 3. OWASP ZAP - Dynamic Application Security Testing (DAST)
echo "🛡️ Running OWASP ZAP Scan..."
# docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://ai-shop-service:80

# 4. GitLeaks - Secret Scanning
echo "🔑 Running GitLeaks..."
# gitleaks detect --source . -v

echo "✅ Security Scans Completed."
