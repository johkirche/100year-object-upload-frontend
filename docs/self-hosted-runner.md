# Deploying with a GitHub Self-Hosted Runner

This guide explains how to set up a GitHub self-hosted runner on your server for deploying this application.

## Advantages of a Self-Hosted Runner

- No need for SSH key setup
- Simpler permission management
- Direct access to deployment directory
- Faster deployments (no need to transfer files over the network)
- More secure (no need to open SSH to external connections)

## Installation Options

You can run the GitHub runner in two ways:

1. **As a regular user with sudo access** - More secure but requires additional configuration
2. **As the root user** - Simpler setup but less secure

### Option 1: Running as a Regular User (with sudo)

This option requires configuring sudo permissions but follows security best practices by not running as root.

### Option 2: Running as Root (Simplified)

This option is simpler as it doesn't require sudo configuration, but runs GitHub workflows with full root privileges.

## Setting Up the Runner

### 1. Create a Directory for the Runner

```bash
# Log into your server and create a directory
mkdir -p /opt/github-runner
cd /opt/github-runner
```

### 2. Download the Runner

For Linux x64 (adjust URL for your OS):

```bash
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
```

### 3. Configure the Runner

1. Go to your GitHub repository
2. Navigate to Settings → Actions → Runners
3. Click "New self-hosted runner"
4. Follow the configuration instructions shown on GitHub
5. When prompted for labels, add `self-hosted` (this is referenced in the workflow file)

### 4. Install the Runner as a Service

#### If Running as a Regular User:

```bash
# Configure service (as user with sudo privileges)
sudo ./svc.sh install

# Start the service
sudo ./svc.sh start
```

#### If Running as Root:

```bash
# Make sure you're logged in as root
# Configure and install service
./svc.sh install
./svc.sh start
```

### 5. Grant the Runner User Sudo Access (Only for Option 1)

Skip this step if running the runner as root.

If running as a regular user, the runner needs sudo access to Docker and file operations:

```bash
# Edit the sudoers file safely
sudo visudo -f /etc/sudoers.d/github-runner

# Add the following line (replace with your runner user)
github-runner ALL=(ALL) NOPASSWD: /usr/bin/docker-compose, /usr/bin/docker, /bin/cp, /bin/chown
```

## Setting Up GitHub Secrets

In your GitHub repository, add the following secrets:

1. Go to Settings → Secrets and variables → Actions
2. Add these repository secrets:

- `DEPLOY_PATH`: Path to your deployment directory (e.g., `/opt/app`)
- `NGINX_SERVER_NAME`: Your domain name
- `FRONTEND_PUBLIC_PORT`: Port for the frontend
- `LETSENCRYPT_EMAIL`: Email for SSL certificates
- `API_BASE_URL`: URL to your backend API

## How It Works

1. When code is pushed to your main branch, GitHub Actions will:
   - Trigger the workflow on your self-hosted runner
   - Check out the code to a subdirectory on the runner
   - Copy files to the deployment directory
   - Create environment files from your GitHub Secrets
   - Rebuild and restart Docker containers

2. The workflow runs entirely on your server with local file access
   - No SSH keys or network transfers needed
   - The runner has direct access to all necessary resources

## Security Considerations

- If running as root, be aware that any GitHub workflow will have full access to your server
- Only use a root runner on repositories where you trust all contributors
- Consider restricting branch protections to limit who can push to branches that trigger deployments

## Troubleshooting

If the runner isn't working:

1. Check the runner service status:
   ```bash
   # If installed as regular user:
   sudo ./svc.sh status
   
   # If installed as root:
   ./svc.sh status
   ```

2. View runner logs:
   ```bash
   # Regular user:
   sudo cat /opt/github-runner/_diag/*.log
   
   # Root:
   cat /opt/github-runner/_diag/*.log
   ```

3. If using a regular user, ensure the user has sudo access:
   ```bash
   sudo -l -U <runner-user>
   ```

4. Check that Docker and Docker Compose are installed and working:
   ```bash
   docker --version
   docker compose --version
   ```

5. Verify the deployment path exists and is accessible:
   ```bash
   ls -la $DEPLOY_PATH
   ``` 