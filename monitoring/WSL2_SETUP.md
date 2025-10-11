# 🐧 WSL 2 Docker Setup Guide

Quick guide to fix Docker Desktop integration with WSL 2.

## ❌ Issue

```
The command 'docker-compose' could not be found in this WSL 2 distro.
We recommend to activate the WSL integration in Docker Desktop settings.
```

## ✅ Solution Options

### **Option 1: Enable Docker Desktop WSL 2 Integration (Recommended)**

This is the easiest and recommended approach.

#### Steps:

1. **Open Docker Desktop** (on Windows)

2. **Go to Settings**:
   - Click the gear icon ⚙️ in the top right
   - Navigate to **Resources** → **WSL Integration**

3. **Enable WSL Integration**:
   - Toggle ON: **Enable integration with my default WSL distro**
   - Find your distro in the list (likely `Ubuntu` or `Ubuntu-22.04`)
   - Toggle it **ON**
   - Click **Apply & Restart**

4. **Restart WSL** (in PowerShell/CMD):
   ```powershell
   wsl --shutdown
   ```

5. **Restart your WSL terminal** and test:
   ```bash
   docker --version
   docker compose version
   ```

You should see Docker version information!

### **Option 2: Install Docker Compose in WSL**

If Docker Desktop integration doesn't work, install docker-compose directly in WSL.

```bash
# Install docker-compose
sudo apt update
sudo apt install docker-compose -y

# Verify installation
docker-compose --version
```

Then run the setup again:
```bash
cd ~/COS301/Capstone/Save-n-Bite/monitoring
./scripts/setup.sh
```

### **Option 3: Use Docker Compose V2 Command**

Modern Docker includes compose as a plugin. You can use `docker compose` instead of `docker-compose`.

The updated setup script now supports both commands automatically!

## 🔍 Verify Docker is Working

After completing any option above, verify:

```bash
# Check Docker
docker --version
# Output: Docker version XX.X.X, build XXXXXX

# Check Docker Compose (old style)
docker-compose --version
# Output: docker-compose version X.XX.X, build XXXXXXX

# OR check Docker Compose V2 (new style)
docker compose version
# Output: Docker Compose version vX.XX.X

# Test Docker is running
docker ps
# Should show running containers or empty list (not an error)
```

## 🚀 Run Setup Again

Once Docker is working:

```bash
cd ~/COS301/Capstone/Save-n-Bite/monitoring
./scripts/setup.sh
```

## 🔧 Python Requests Installation

If you see the externally-managed-environment error for Python, install via apt:

```bash
sudo apt install python3-requests -y
```

Then run setup again.

## 📊 Quick Setup (After Docker is Fixed)

```bash
# 1. Navigate to monitoring directory
cd ~/COS301/Capstone/Save-n-Bite/monitoring

# 2. Install Python requests (if needed)
sudo apt install python3-requests -y

# 3. Run setup
./scripts/setup.sh

# 4. Verify services
docker compose ps  # or: docker-compose ps

# 5. Access Grafana
# Open browser to: http://localhost:3000
# Login: admin / savenbite_admin
```

## 🐛 Still Having Issues?

### Issue: "Cannot connect to Docker daemon"

**Solution:**
```bash
# Make sure Docker Desktop is running on Windows
# Then check in WSL:
docker ps

# If it still fails, restart Docker Desktop completely
```

### Issue: Port already in use

**Solution:**
```bash
# Check what's using the port
sudo lsof -i :3000  # For Grafana
sudo lsof -i :9090  # For Prometheus

# Stop conflicting services or change ports in docker-compose.yml
```

### Issue: Permission denied on Docker socket

**Solution:**
```bash
# Add your user to the docker group
sudo usermod -aG docker $USER

# Log out and back in for changes to take effect
# Or run:
newgrp docker
```

## 📚 Additional Resources

- [Docker Desktop WSL 2 Backend](https://docs.docker.com/desktop/windows/wsl/)
- [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Compose Installation](https://docs.docker.com/compose/install/)

## ✅ Success Checklist

After setup, you should have:

- [ ] Docker command working: `docker --version`
- [ ] Docker Compose working: `docker compose version` or `docker-compose --version`
- [ ] Python requests installed: `python3 -c "import requests"`
- [ ] All monitoring services running: `docker compose ps`
- [ ] Grafana accessible: http://localhost:3000
- [ ] Prometheus accessible: http://localhost:9090

---

**Need more help?** Check the main [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md)
