#!/bin/bash
set -e

echo "🚀 SwarmShield Production Deployment Script"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/swarmshield"
KEEPER_DIR="$APP_DIR/keeper"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_DIR="/var/log/swarmshield"
USER="swarmshield"

echo -e "${BLUE}Step 1: System Updates${NC}"
sudo apt-get update
sudo apt-get upgrade -y

echo -e "\n${BLUE}Step 2: Install Dependencies${NC}"
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build essentials
sudo apt-get install -y build-essential git curl

# Install PM2 for process management (alternative to systemd)
sudo npm install -g pm2

echo -e "\n${BLUE}Step 3: Create User and Directories${NC}"
# Create swarmshield user if doesn't exist
if ! id "$USER" &>/dev/null; then
    sudo useradd -r -s /bin/bash -d $APP_DIR $USER
    echo -e "${GREEN}✓ Created user: $USER${NC}"
else
    echo -e "${GREEN}✓ User $USER already exists${NC}"
fi

# Create directories
sudo mkdir -p $APP_DIR
sudo mkdir -p $LOG_DIR
sudo chown -R $USER:$USER $APP_DIR
sudo chown -R $USER:$USER $LOG_DIR
echo -e "${GREEN}✓ Created directories${NC}"

echo -e "\n${BLUE}Step 4: Clone/Update Repository${NC}"
if [ -d "$APP_DIR/.git" ]; then
    echo "Repository exists, updating..."
    cd $APP_DIR
    sudo -u $USER git pull
else
    echo "Cloning repository..."
    sudo -u $USER git clone https://github.com/shariqazeem/swarm-shield.git $APP_DIR
fi
echo -e "${GREEN}✓ Repository ready${NC}"

echo -e "\n${BLUE}Step 5: Install Keeper Dependencies${NC}"
cd $KEEPER_DIR
sudo -u $USER npm install --production
echo -e "${GREEN}✓ Keeper dependencies installed${NC}"

echo -e "\n${BLUE}Step 6: Install Frontend Dependencies${NC}"
cd $FRONTEND_DIR
sudo -u $USER npm install --production
sudo -u $USER npm run build
echo -e "${GREEN}✓ Frontend built${NC}"

echo -e "\n${BLUE}Step 7: Environment Configuration${NC}"
if [ ! -f "$KEEPER_DIR/.env" ]; then
    echo -e "${RED}⚠️  WARNING: .env file not found!${NC}"
    echo ""
    echo "Please create $KEEPER_DIR/.env with the following:"
    echo "----------------------------------------"
    echo "RPC_URL=https://api.devnet.solana.com"
    echo "KEEPER_PRIVATE_KEY=[your,keeper,keypair,array]"
    echo "POLL_INTERVAL_MS=5000"
    echo "----------------------------------------"
    echo ""
    read -p "Press Enter after creating .env file..."
else
    echo -e "${GREEN}✓ .env file exists${NC}"
fi

echo -e "\n${BLUE}Step 8: Setup PM2 Process Manager${NC}"
cd $KEEPER_DIR
sudo -u $USER pm2 delete swarmshield-keeper 2>/dev/null || true
sudo -u $USER pm2 start npm --name "swarmshield-keeper" -- start
sudo -u $USER pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $APP_DIR
echo -e "${GREEN}✓ Keeper started with PM2${NC}"

echo -e "\n${BLUE}Step 9: Setup Frontend (Optional)${NC}"
cd $FRONTEND_DIR
sudo -u $USER pm2 delete swarmshield-frontend 2>/dev/null || true
sudo -u $USER pm2 start npm --name "swarmshield-frontend" -- start -- -p 3000
sudo -u $USER pm2 save
echo -e "${GREEN}✓ Frontend started with PM2${NC}"

echo -e "\n${BLUE}Step 10: Setup Nginx (Optional - for production domain)${NC}"
read -p "Do you want to setup Nginx reverse proxy? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo apt-get install -y nginx

    sudo tee /etc/nginx/sites-available/swarmshield > /dev/null <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    sudo ln -sf /etc/nginx/sites-available/swarmshield /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl restart nginx
    echo -e "${GREEN}✓ Nginx configured${NC}"
fi

echo -e "\n${GREEN}=============================================="
echo "✅ Deployment Complete!"
echo "==============================================${NC}"
echo ""
echo "Keeper Status:"
sudo -u $USER pm2 status
echo ""
echo "View Keeper Logs:"
echo "  sudo -u $USER pm2 logs swarmshield-keeper"
echo ""
echo "View Frontend Logs:"
echo "  sudo -u $USER pm2 logs swarmshield-frontend"
echo ""
echo "Restart Keeper:"
echo "  sudo -u $USER pm2 restart swarmshield-keeper"
echo ""
echo "Stop All:"
echo "  sudo -u $USER pm2 stop all"
echo ""
echo "Monitor:"
echo "  sudo -u $USER pm2 monit"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Verify keeper is running: sudo -u $USER pm2 logs swarmshield-keeper"
echo "2. Check frontend: http://$(curl -s ifconfig.me):3000"
echo "3. Monitor for batch executions"
echo ""
