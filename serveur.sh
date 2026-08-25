#!/bin/bash
# Script pour lancer le serveur local du menu Pili-Pili Lounge

echo "🍽️  Démarrage du serveur local pour Pili-Pili Lounge..."
echo ""
echo "📋 Menu public : http://localhost:8000"
echo "🔧 Espace admin : http://localhost:8000/admin/"
echo "📱 QR Code : http://localhost:8000/admin/qr-code.html"
echo ""
echo "Pour arrêter le serveur : Ctrl+C"
echo ""

python3 -m http.server 8000
