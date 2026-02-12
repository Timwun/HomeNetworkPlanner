# Testing the Network Diagram - Quick Start Guide

To see connection lines in the network diagram, you need to set up a network hierarchy. Here's a quick example:

## Step 1: Add a Router (Root Device)

1. Click **"Add Device"**
2. Fill in:
   - **Name**: My Router
   - **IP Address**: 192.168.178.1
   - **Type**: Router
3. In the **Network Ports** section, add ports:
   - Port name: `LAN 1`, Type: Ethernet → Click **Add**
   - Port name: `LAN 2`, Type: Ethernet → Click **Add**
   - Port name: `WiFi`, Type: WiFi → Click **Add**
4. Click **"Add Device"**

## Step 2: Add an Access Point

1. Click **"Add Device"**
2. Fill in:
   - **Name**: Living Room AP
   - **IP Address**: 192.168.178.2
   - **Type**: Access Point
3. In the **Network Ports** section, add:
   - Port name: `WiFi`, Type: WiFi → Click **Add**
4. In **Connected To**: Select "My Router"
5. In **Port**: Select "LAN 1"
6. Click **"Add Device"**

## Step 3: Add a Mobile Device

1. Click **"Add Device"**
2. Fill in:
   - **Name**: iPhone
   - **IP Address**: 192.168.178.10
   - **Type**: Mobile Device
3. In **Connected To**: Select "Living Room AP"
4. In **Port**: Select "WiFi"
5. Click **"Add Device"**

## Step 4: View the Network Diagram

1. Switch to **"Network Diagram"** view
2. You should now see:
   - **My Router** at the top
   - A **solid line** from Router → Living Room AP (labeled "LAN 1")
   - An **animated line** from Living Room AP → iPhone (labeled "WiFi")

**Legend:**
- **Solid lines** = Ethernet connections
- **Animated/dashed lines** = WiFi connections
- **Line labels** = Port names

## Troubleshooting

**No lines showing?**
- Make sure devices have a "Connected To" parent selected
- Make sure the parent device has ports configured
- The root device (usually the router) won't have incoming connections
- Try dragging devices apart if they're overlapping

**Can't see the whole diagram?**
- Use the zoom controls (bottom left)
- Drag the canvas to pan around
- Click the "fit view" button to auto-zoom

## Connection Types

When adding ports, you can specify:
- **Ethernet**: For wired LAN connections (shows as solid lines)
- **WiFi**: For wireless connections (shows as animated lines)
- **Other**: For other connection types (shows as solid lines)

Just name your ports simply like "WiFi", "LAN 1", "LAN 2", etc.
