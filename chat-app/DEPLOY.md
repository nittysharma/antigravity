# Deployment Guide for Amazon Linux 2023 (EC2)

This guide explains how to deploy the Chat App on an AWS EC2 instance running **Amazon Linux 2023**.

## 1. Prepare the Instance

Connect to your EC2 instance via SSH and run the following commands:

```bash
# Update system packages
sudo dnf update -y

# Install Development Tools (Required for compiling native modules like sqlite3)
sudo dnf groupinstall "Development Tools" -y

# Install Node.js 20 (Required for better-sqlite3)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install nodejs -y

# Verify Node version (should be v20+)
node -v

# Install Git
sudo dnf install git -y

# Install PM2 (Process Manager) globally
sudo npm install -g pm2
```

## 2. Upload/Clone Your Code

Clone your repository or upload your project files to the instance.
(Assuming your code is in `~/chat-app`)

## 3. Build the Client

The client needs to be compiled into static HTML/JS/CSS files.

```bash
cd ~/chat-app/client

# Install dependencies
npm install

# Build the project (creates 'dist' folder)
npm run build
```

## 4. Setup and Run the Server

The server will serve both the API and the built client files.

```bash
cd ~/chat-app/server

# Install dependencies
npm install

# Start the server in the background using PM2
pm2 start index.js --name "chat-app"

# Save the process list so it restarts on reboot
pm2 startup
pm2 save
```

## 5. Configure Security Group (Firewall)

1. Go to the **AWS Console** > **EC2** > **Security Groups**.
2. Select your instance's security group.
3. Add an **Inbound Rule**:
   - **Type**: Custom TCP
   - **Port Range**: `3001` (or whatever port your server runs on)
   - **Source**: `0.0.0.0/0` (Anywhere)

## 6. Access the App

Open your browser and visit:
`http://<YOUR_EC2_PUBLIC_IP>:3001`

---

## Optional: Run on Port 80 (HTTP)

If you want to access the app without typing `:3001`, you can use **iptables** to forward port 80 to 3001:

```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3001
```

Or use **Nginx** as a reverse proxy (Recommended for production):

1. Install Nginx: `sudo dnf install nginx -y`
2. Start Nginx: `sudo systemctl start nginx`
3. Edit config: `sudo nano /etc/nginx/nginx.conf`
4. Add proxy pass to `http://localhost:3001` inside the `server` block.
