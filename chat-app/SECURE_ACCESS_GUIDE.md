# Secure Access Guide: Cloudflare Tunnel

This guide explains how to expose your application securely using Cloudflare Tunnel. This method requires **ZERO inbound ports** to be open on your EC2 instance.

## Prerequisites

1.  **Cloudflare Account**: Sign up at [cloudflare.com](https://www.cloudflare.com) (Free plan is sufficient).
2.  **Domain Access**: Access to your `domainz.in` panel to change nameservers.

## Step 1: Add Domain to Cloudflare

1.  Log in to the Cloudflare Dashboard.
2.  Click **"Add a Site"** and enter `dostu.in`.
3.  Select the **Free** plan.
4.  Cloudflare will provide two nameservers (e.g., `bob.ns.cloudflare.com` and `alice.ns.cloudflare.com`).
5.  **Action Required:** Go to your `domainz.in` control panel and update the nameservers for `dostu.in` to the ones provided by Cloudflare.
6.  Wait for propagation (usually 15 mins to a few hours).

## Step 2: Create the Tunnel (Zero Trust Dashboard)

The easiest way is to use the Cloudflare Zero Trust Dashboard.

1.  On the left sidebar of the Cloudflare Dashboard, click **Zero Trust**.
2.  Go to **Networks** > **Tunnels**.
3.  Click **Create a Tunnel**.
4.  Select **Cloudflared** connector.
5.  Name your tunnel (e.g., `chat-app-ec2`) and click **Save Tunnel**.

## Step 3: Install Connector on EC2

1.  After saving, you will see a "Choose your environment" screen.
2.  Select **Red Hat / CentOS** (since you are on Amazon Linux 2023).
3.  Copy the command provided in the box. It will look something like this:
    ```bash
    sudo rpm -ivh https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm &&
    sudo cloudflared service install <YOUR_LONG_TOKEN_HERE>
    ```
4.  **Run this command on your EC2 instance.**
    *   This installs the `cloudflared` agent and starts it as a background service.
    *   It will automatically connect to Cloudflare.

## Step 4: Route Traffic

1.  Back in the Cloudflare Dashboard, click **Next**.
2.  **Public Hostname** tab:
    *   **Subdomain**: (Leave empty for root `dostu.in`, or type `www`)
    *   **Domain**: Select `dostu.in`
    *   **Path**: (Leave empty)
3.  **Service** section:
    *   **Type**: `HTTP`
    *   **URL**: `localhost:3001` (This points to your internal Node.js server)
4.  Click **Save Tunnel**.

## Step 5: Close EC2 Ports

1.  Go to AWS Console > EC2 > Security Groups.
2.  **Edit Inbound Rules**.
3.  **DELETE** the rules for Port 443 and Port 80.
4.  You can keep SSH (Port 22) open for your management IP only.
5.  **Save**.

## Verification

1.  Open `https://dostu.in` in your browser.
2.  You should see your chat app!
3.  The connection is secure (padlock icon) using Cloudflare's certificate.
4.  Your EC2 instance is completely hidden from the public internet.

---

## Alternative: AWS Application Load Balancer (ALB)

If you prefer to stay 100% within AWS (Note: ALB costs ~$16/month + data):

1.  **Request Certificate**: Go to AWS Certificate Manager (ACM) and request a public certificate for `dostu.in`. Validate it via DNS.
2.  **Create Target Group**:
    *   Type: Instances
    *   Port: 3001
    *   Protocol: HTTP
    *   Select your EC2 instance.
3.  **Create Load Balancer**:
    *   Type: Application Load Balancer (ALB)
    *   Scheme: Internet-facing
    *   Listeners: Add HTTPS (443) -> Forward to Target Group.
    *   Select the ACM certificate.
4.  **Update DNS**: Point `dostu.in` CNAME to the ALB's DNS name.
5.  **Security Groups**:
    *   **ALB SG**: Allow Inbound 443 from `0.0.0.0/0`.
    *   **EC2 SG**: Allow Inbound 3001 **ONLY** from the **ALB SG ID** (Source: `sg-xxxx`).
