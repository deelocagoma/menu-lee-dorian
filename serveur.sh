#!/bin/bash
# Script pour lancer le serveur local du menu LEET-DORIAN

echo "🍽️  Démarrage du serveur local pour LEET-DORIAN..."
echo ""
echo "📋 Menu public : http://localhost:8000"
echo "🔧 Espace admin : http://localhost:8000/admin/"
echo "📱 QR Code : http://localhost:8000/admin/qr-code.html"
echo ""
echo "Pour arrêter le serveur : Ctrl+C"
echo ""

python3 -m http.server 8000
